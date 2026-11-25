export type StageId =
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'stage-4'
  | 'stage-5'
  | 'stage-6';

export type ConceptStatus = 'undiscovered' | 'exploring' | 'discovered';

export type TeachingStrategy =
  | 'socratic_probe'
  | 'counterexample'
  | 'real_world_analogy'
  | 'visual_scaffold'
  | 'concept_synthesis'
  | 'revisit_foundation';

export type VisualHintType =
  | 'chocolates'
  | 'context_blocks'
  | 'bank_ledger'
  | 'number_line'
  | 'property_tiles'
  | 'elevation_temp';

export interface VisualHint {
  type: VisualHintType;
  start?: number;
  addend?: number;
  groupA?: number;
  groupB?: number;
  groupC?: number;
  compareA?: number;
  compareB?: number;
  labelA?: string;
  labelB?: string;
  unit?: string;
  caption?: string;
}

export interface TutorAssessment {
  whatUnderstood: string;
  whatMisunderstood: string | null;
  answerCorrect: boolean | null;
  reasoningCorrect: boolean | null;
  activeMisconception: string | null;
  misconceptionResolved: boolean;
  nextPedagogicalGoal: string;
  strategyUsed: TeachingStrategy;
  understandingDelta: number;
}

export interface ConversationMessage {
  id: string;
  stageId: StageId;
  role: 'tutor' | 'student';
  content: string;
  assessment?: TutorAssessment;
  visualHint?: VisualHint;
  createdAt: string;
}

export interface ConceptDefinition {
  id: string;
  stageId: StageId;
  mysteryTitle: string;
  discoveredTitle: string;
  intuitionSummary: string;
  realWorldExample: string;
  prerequisites: string[];
  revealNameAfterDiscovery: boolean;
  keyMisconceptions: string[];
}

export interface StageDefinition {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  openingQuestion: string;
  openingVisualHint: VisualHint;
  accentColor: string;
  conceptIds: string[];
}

export interface ConceptProgress {
  conceptId: string;
  status: ConceptStatus;
  mastery: number; // 0-100
  studentExplanation: string | null;
  activeMisconception: string | null;
  discoveredAt: string | null;
}

export interface JournalEntry {
  id: string;
  stageId: StageId;
  conceptId: string | null;
  entryType: 'discovery' | 'explanation' | 'question' | 'reflection';
  title: string;
  content: string;
  createdAt: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  criteria: string;
  icon: string;
  color: string;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export interface ChallengeItem {
  id: string;
  kind: 'daily' | 'weekly';
  title: string;
  prompt: string;
  stageId: StageId;
  visualHint: VisualHint;
  completed: boolean;
}

export interface StudentState {
  studentId: string;
  name: string;
  currentStageId: StageId;
  curiosityStreak: number;
  lastActiveDate: string;
  reasoningScore: number;
  questionsAsked: number;
  misconceptionsResolved: number;
  explanationsGiven: number;
  patternsDiscovered: number;
  dailyChallengeCompletedDate: string | null;
  weeklyChallengeCompleted: boolean;
  conceptProgress: Record<string, ConceptProgress>;
  messages: ConversationMessage[];
  journal: JournalEntry[];
  badges: EarnedBadge[];
  aiMode: 'gemini' | 'demo';
  persistenceMode: 'supabase' | 'local';
}

export interface TutorTurnRequest {
  studentId: string;
  stageId: StageId;
  message: string;
  action?: 'answer' | 'ask_why' | 'hint' | 'challenge_start';
  challengePrompt?: string;
}

export interface TutorTurnResponse {
  tutorMessage: ConversationMessage;
  studentMessage?: ConversationMessage;
  state: StudentState;
  newlyDiscoveredConcepts: ConceptDefinition[];
  newlyEarnedBadges: BadgeDefinition[];
}
