import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  ConceptProgress,
  ConversationMessage,
  StageId,
  StudentState,
  TopicLearningProgress,
} from '../src/types/socratic.js';
import {
  CONCEPTS,
  DEFAULT_TOPIC,
  STAGES,
  createInitialTopicProgress,
  getQuestionById,
  getStageById,
} from './curriculum.js';

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'socratia-data')
  : path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface PersistedData {
  students: Record<string, Omit<StudentState, 'aiMode' | 'persistenceMode'>>;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  }
  return null;
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialConceptProgress(): Record<string, ConceptProgress> {
  const map: Record<string, ConceptProgress> = {};
  for (const concept of CONCEPTS) {
    map[concept.id] = {
      conceptId: concept.id,
      status: concept.id === 'combining_quantities' ? 'exploring' : 'undiscovered',
      mastery: 0,
      studentExplanation: null,
      activeMisconception: null,
      discoveredAt: null,
    };
  }
  return map;
}

export function createDefaultStudent(
  studentId: string,
  name = 'Explorer'
): Omit<StudentState, 'aiMode' | 'persistenceMode'> {
  const firstStage = STAGES[0];
  const firstQuestion = getQuestionById(1);
  const now = new Date().toISOString();
  const initialTopic = createInitialTopicProgress(DEFAULT_TOPIC);

  return {
    studentId,
    name,
    activeTopic: DEFAULT_TOPIC,
    currentStageId: 'stage-1',
    learningState: initialTopic,
    topicStates: { [DEFAULT_TOPIC]: initialTopic },
    curiosityStreak: 1,
    lastActiveDate: getTodayKey(),
    reasoningScore: 0,
    questionsAsked: 0,
    misconceptionsResolved: 0,
    explanationsGiven: 0,
    patternsDiscovered: 0,
    dailyChallengeCompletedDate: null,
    weeklyChallengeCompleted: false,
    conceptProgress: buildInitialConceptProgress(),
    messages: [
      {
        id: `msg-init-${firstStage.id}-q${firstQuestion.id}`,
        stageId: firstStage.id,
        questionId: firstQuestion.id,
        role: 'tutor',
        content: firstQuestion.prompt,
        visualHint: firstQuestion.visualHint,
        createdAt: now,
      },
    ],
    journal: [
      {
        id: 'journal-welcome',
        stageId: 'stage-1',
        conceptId: null,
        entryType: 'reflection',
        title: 'Beginning the Journey',
        content:
          'Welcome to your Reasoning Journal. Whenever you discover why a mathematical idea works in your own words, save it here!',
        createdAt: now,
      },
    ],
    badges: [],
  };
}

function normalizeStudent(
  student: Omit<StudentState, 'aiMode' | 'persistenceMode'>
): Omit<StudentState, 'aiMode' | 'persistenceMode'> {
  const defaults = buildInitialConceptProgress();
  for (const [k, v] of Object.entries(defaults)) {
    if (!student.conceptProgress[k]) {
      student.conceptProgress[k] = v;
    }
  }
  if (!student.activeTopic) {
    student.activeTopic = DEFAULT_TOPIC;
  }
  if (!student.topicStates) {
    student.topicStates = {};
  }
  if (!student.learningState) {
    student.learningState = createInitialTopicProgress(student.activeTopic);
  }
  if (!student.learningState.stage_summaries) {
    student.learningState.stage_summaries = {};
  }
  student.topicStates[student.activeTopic] = student.learningState;
  return student;
}

function ensureLocalStore(): PersistedData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: PersistedData = { students: {} };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as PersistedData;
  } catch {
    return { students: {} };
  }
}

function writeLocalStore(data: PersistedData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function updateStreak(student: Omit<StudentState, 'aiMode' | 'persistenceMode'>) {
  const today = getTodayKey();
  if (student.lastActiveDate === today) return;
  const last = new Date(student.lastActiveDate);
  const curr = new Date(today);
  const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    student.curiosityStreak += 1;
  } else if (diffDays > 1) {
    student.curiosityStreak = 1;
  }
  student.lastActiveDate = today;
}

export async function loadStudentState(
  studentId: string,
  aiMode: 'gemini' | 'demo',
  fallbackState?: Omit<StudentState, 'aiMode' | 'persistenceMode'>
): Promise<StudentState> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: profile } = await sb
        .from('student_profiles')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();

      if (!profile) {
        const fresh = createDefaultStudent(studentId);
        await saveStudentStateToSupabase(sb, fresh);
        return { ...fresh, aiMode, persistenceMode: 'supabase' };
      }

      const [{ data: concepts }, { data: messages }, { data: journal }, { data: badges }] =
        await Promise.all([
          sb.from('concept_progress').select('*').eq('student_id', studentId),
          sb
            .from('conversation_messages')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: true }),
          sb
            .from('journal_entries')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false }),
          sb.from('earned_badges').select('*').eq('student_id', studentId),
        ]);

      const conceptProgress = buildInitialConceptProgress();
      for (const row of concepts ?? []) {
        conceptProgress[row.concept_id] = {
          conceptId: row.concept_id,
          status: row.status,
          mastery: row.mastery,
          studentExplanation: row.student_explanation,
          activeMisconception: row.active_misconception,
          discoveredAt: row.discovered_at,
        };
      }

      const learningState: TopicLearningProgress =
        (profile.learning_state as TopicLearningProgress | null) ??
        createInitialTopicProgress(DEFAULT_TOPIC);

      const loaded = normalizeStudent({
        studentId,
        name: profile.name,
        activeTopic: learningState.topic || DEFAULT_TOPIC,
        currentStageId: profile.current_stage_id as StageId,
        learningState,
        topicStates:
          (profile.topic_states as Record<string, TopicLearningProgress> | null) ?? {
            [learningState.topic || DEFAULT_TOPIC]: learningState,
          },
        curiosityStreak: profile.curiosity_streak,
        lastActiveDate: profile.last_active_date,
        reasoningScore: profile.reasoning_score,
        questionsAsked: profile.questions_asked,
        misconceptionsResolved: profile.misconceptions_resolved,
        explanationsGiven: profile.explanations_given,
        patternsDiscovered: CONCEPTS.filter(
          (c) =>
            (c.stageId === 'stage-4' || c.stageId === 'stage-5' || c.stageId === 'stage-9') &&
            conceptProgress[c.id]?.status === 'discovered'
        ).length,
        dailyChallengeCompletedDate: profile.daily_challenge_completed_date,
        weeklyChallengeCompleted: profile.weekly_challenge_completed,
        conceptProgress,
        messages: (messages ?? []).map((m) => ({
          id: m.id,
          stageId: m.stage_id as StageId,
          questionId: m.question_id ?? undefined,
          role: m.role as 'tutor' | 'student',
          content: m.content,
          assessment: m.assessment ?? undefined,
          visualHint: m.visual_hint ?? undefined,
          createdAt: m.created_at,
        })),
        journal: (journal ?? []).map((j) => ({
          id: j.id,
          stageId: j.stage_id as StageId,
          conceptId: j.concept_id,
          entryType: j.entry_type,
          title: j.title,
          content: j.content,
          createdAt: j.created_at,
        })),
        badges: (badges ?? []).map((b) => ({
          badgeId: b.badge_id,
          earnedAt: b.earned_at,
        })),
      });
      updateStreak(loaded);
      return { ...loaded, aiMode, persistenceMode: 'supabase' };
    } catch (err) {
      console.warn('Supabase load failed, falling back to local JSON store:', err);
    }
  }

  const store = ensureLocalStore();
  let student = store.students[studentId];
  if (!student) {
    student =
      fallbackState && fallbackState.studentId === studentId
        ? normalizeStudent(fallbackState)
        : createDefaultStudent(studentId);
    store.students[studentId] = student;
    writeLocalStore(store);
  } else {
    student = normalizeStudent(student);
    updateStreak(student);
    writeLocalStore(store);
  }

  return {
    ...student,
    aiMode,
    persistenceMode: 'local',
  };
}

async function saveStudentStateToSupabase(
  sb: SupabaseClient,
  student: Omit<StudentState, 'aiMode' | 'persistenceMode'>
): Promise<void> {
  await sb.from('student_profiles').upsert({
    id: student.studentId,
    name: student.name,
    current_stage_id: student.currentStageId,
    learning_state: student.learningState,
    topic_states: student.topicStates,
    curiosity_streak: student.curiosityStreak,
    last_active_date: student.lastActiveDate,
    reasoning_score: student.reasoningScore,
    questions_asked: student.questionsAsked,
    misconceptions_resolved: student.misconceptionsResolved,
    explanations_given: student.explanationsGiven,
    daily_challenge_completed_date: student.dailyChallengeCompletedDate,
    weekly_challenge_completed: student.weeklyChallengeCompleted,
    updated_at: new Date().toISOString(),
  });

  const conceptRows = Object.values(student.conceptProgress).map((cp) => ({
    student_id: student.studentId,
    concept_id: cp.conceptId,
    status: cp.status,
    mastery: cp.mastery,
    student_explanation: cp.studentExplanation,
    active_misconception: cp.activeMisconception,
    discovered_at: cp.discoveredAt,
  }));
  if (conceptRows.length > 0) {
    await sb.from('concept_progress').upsert(conceptRows);
  }

  const msgRows = student.messages.map((m) => ({
    id: m.id,
    student_id: student.studentId,
    stage_id: m.stageId,
    question_id: m.questionId ?? null,
    role: m.role,
    content: m.content,
    assessment: m.assessment ?? null,
    visual_hint: m.visualHint ?? null,
    created_at: m.createdAt,
  }));
  if (msgRows.length > 0) {
    await sb.from('conversation_messages').upsert(msgRows);
  }

  const journalRows = student.journal.map((j) => ({
    id: j.id,
    student_id: student.studentId,
    stage_id: j.stageId,
    concept_id: j.conceptId,
    entry_type: j.entryType,
    title: j.title,
    content: j.content,
    created_at: j.createdAt,
  }));
  if (journalRows.length > 0) {
    await sb.from('journal_entries').upsert(journalRows);
  }

  const badgeRows = student.badges.map((b) => ({
    student_id: student.studentId,
    badge_id: b.badgeId,
    earned_at: b.earnedAt,
  }));
  if (badgeRows.length > 0) {
    await sb.from('earned_badges').upsert(badgeRows);
  }
}

export async function saveStudentState(state: StudentState): Promise<void> {
  const { aiMode: _ai, persistenceMode: _pm, ...clean } = state;
  clean.topicStates[clean.activeTopic] = clean.learningState;
  const sb = getSupabase();
  if (sb) {
    try {
      await saveStudentStateToSupabase(sb, clean);
      return;
    } catch (err) {
      console.warn('Supabase save failed, persisting locally:', err);
    }
  }
  const store = ensureLocalStore();
  store.students[clean.studentId] = clean;
  writeLocalStore(store);
}

export async function resetStudentState(
  studentId: string,
  aiMode: 'gemini' | 'demo'
): Promise<StudentState> {
  const fresh = createDefaultStudent(studentId);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('conversation_messages').delete().eq('student_id', studentId);
      await sb.from('journal_entries').delete().eq('student_id', studentId);
      await sb.from('earned_badges').delete().eq('student_id', studentId);
      await sb.from('concept_progress').delete().eq('student_id', studentId);
      await saveStudentStateToSupabase(sb, fresh);
      return { ...fresh, aiMode, persistenceMode: 'supabase' };
    } catch (err) {
      console.warn('Supabase reset failed:', err);
    }
  }
  const store = ensureLocalStore();
  store.students[studentId] = fresh;
  writeLocalStore(store);
  return { ...fresh, aiMode, persistenceMode: 'local' };
}

export function syncLearningPositionToStage(
  state: StudentState,
  stageId: StageId
): ConversationMessage | null {
  const stage = getStageById(stageId);
  state.currentStageId = stage.id;
  state.learningState.current_stage = stage.number;

  // Pick first uncompleted question in this stage, or first question if stage already done
  const completedSet = new Set(state.learningState.completed_questions);
  const targetQId =
    stage.questionIds.find((qid) => !completedSet.has(qid)) ?? stage.questionIds[0];
  state.learningState.current_question = targetQId;
  state.learningState.next_question = targetQId;
  state.learningState.pending_followup = false;
  state.learningState.pending_followup_type = null;

  const firstConcept = stage.conceptIds[0];
  if (firstConcept && state.conceptProgress[firstConcept]?.status === 'undiscovered') {
    state.conceptProgress[firstConcept].status = 'exploring';
  }

  const hasStageMsgs = state.messages.some((m) => m.stageId === stageId);
  if (hasStageMsgs) return null;

  const q = getQuestionById(targetQId);
  const msg: ConversationMessage = {
    id: `msg-init-${stage.id}-q${q.id}-${Date.now()}`,
    stageId: stage.id,
    questionId: q.id,
    role: 'tutor',
    content: q.prompt,
    visualHint: q.visualHint,
    createdAt: new Date().toISOString(),
  };
  state.messages.push(msg);
  return msg;
}
