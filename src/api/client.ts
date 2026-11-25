import type {
  BadgeDefinition,
  ChallengeItem,
  ConceptDefinition,
  JournalEntry,
  SequentialQuestion,
  StageDefinition,
  StageId,
  StudentState,
  TutorTurnRequest,
  TutorTurnResponse,
} from '../types/socratic';

const STUDENT_ID_KEY = 'socratia_student_id';
const STATE_CACHE_KEY = 'socratia_state_cache';

export function getStudentId(): string {
  let id = localStorage.getItem(STUDENT_ID_KEY);
  if (!id) {
    id = `learner-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STUDENT_ID_KEY, id);
  }
  return id;
}

function getCachedState(): StudentState | undefined {
  try {
    const raw = localStorage.getItem(STATE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as StudentState) : undefined;
  } catch {
    return undefined;
  }
}

function cacheState(state: StudentState) {
  try {
    localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export interface CurriculumPayload {
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  questions: SequentialQuestion[];
  badges: BadgeDefinition[];
}

export interface StatePayload {
  state: StudentState;
  dailyChallenge: ChallengeItem;
  weeklyChallenge: ChallengeItem;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function fetchCurriculum(): Promise<CurriculumPayload> {
  return jsonFetch<CurriculumPayload>('/api/curriculum');
}

export async function fetchState(studentId: string): Promise<StatePayload> {
  const res = await jsonFetch<StatePayload>(`/api/state?studentId=${encodeURIComponent(studentId)}`);
  const cached = getCachedState();
  if (
    cached &&
    cached.studentId === studentId &&
    cached.learningState &&
    Array.isArray(cached.learningState.completed_questions) &&
    res.state.persistenceMode === 'local' &&
    res.state.messages.length <= 1 &&
    cached.messages.length > 1
  ) {
    return { ...res, state: cached };
  }
  cacheState(res.state);
  return res;
}

export async function switchStage(studentId: string, stageId: StageId): Promise<{ state: StudentState }> {
  const res = await jsonFetch<{ state: StudentState }>('/api/stage', {
    method: 'POST',
    body: JSON.stringify({ studentId, stageId, fallbackState: getCachedState() }),
  });
  cacheState(res.state);
  return res;
}

export async function sendTutorTurn(
  payload: TutorTurnRequest & { challengeKind?: 'daily' | 'weekly' }
): Promise<TutorTurnResponse> {
  const res = await jsonFetch<TutorTurnResponse>('/api/tutor/turn', {
    method: 'POST',
    body: JSON.stringify({ ...payload, fallbackState: getCachedState() }),
  });
  cacheState(res.state);
  return res;
}

export async function addJournalEntry(payload: {
  studentId: string;
  stageId: StageId;
  conceptId?: string | null;
  entryType: JournalEntry['entryType'];
  title: string;
  content: string;
}): Promise<{ entry: JournalEntry; state: StudentState }> {
  const res = await jsonFetch<{ entry: JournalEntry; state: StudentState }>('/api/journal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  cacheState(res.state);
  return res;
}

export function completeChallenge(
  studentId: string,
  kind: 'daily' | 'weekly'
): Promise<StatePayload> {
  return jsonFetch<StatePayload>('/api/challenge/complete', {
    method: 'POST',
    body: JSON.stringify({ studentId, kind }),
  });
}

export async function resetJourney(studentId: string): Promise<StatePayload> {
  const res = await jsonFetch<StatePayload>('/api/tutor/reset', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
  cacheState(res.state);
  return res;
}
