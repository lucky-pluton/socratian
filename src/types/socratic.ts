export type StageId =
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'stage-4'
  | 'stage-5'
  | 'stage-6'
  | 'stage-7'
  | 'stage-8'
  | 'stage-9'
  | 'stage-10';

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
  | 'combine_objects'
  | 'take_away_objects'
  | 'context_blocks'
  | 'bank_ledger'
  | 'number_line'
  | 'property_tiles'
  | 'commutative_swap'
  | 'associative_regroup'
  | 'elevation_temp';

export type VisualObjectKind =
  | 'chocolate'
  | 'apple'
  | 'book'
  | 'balloon'
  | 'coin'
  | 'dot';

export interface VisualHint {
  type: VisualHintType;
  objectKind?: VisualObjectKind;
  operation?: 'add' | 'subtract' | 'compare' | 'swap' | 'regroup' | 'move';
  animate?: 'merge' | 'count_on' | 'disappear' | 'swap' | 'regroup' | 'slide' | 'none';
  interactive?: boolean;
  showNumbers?: boolean;
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
  questionId?: number;
  role: 'tutor' | 'visual' | 'student';
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

export interface MisconceptionRule {
  id: string;
  label: string;
  keywords: string[];
  wrongNumbers?: number[];
  simplerExamplePrompt: string;
}

export interface SequentialQuestion {
  id: number;
  stageId: StageId;
  stageNumber: number;
  conceptId: string;
  prompt: string;
  learningObjective: string;
  expectedDiscovery: string;
  requiresReasoning: boolean;
  acceptedNumbers?: number[];
  acceptedBoolean?: 'yes' | 'no';
  reasoningKeywords: string[];
  misconceptions: MisconceptionRule[];
  adaptiveHint: string;
  showVisualOnAsk?: boolean;
  visualHint: VisualHint;
}

export interface StageDefinition {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  expectedDiscovery: string;
  progressionCriteria: string;
  openingQuestion: string;
  openingVisualHint: VisualHint;
  accentColor: string;
  conceptIds: string[];
  questionIds: number[];
}

export interface TopicLearningProgress {
  topic: string;
  current_stage: number;
  current_question: number;
  completed_questions: number[];
  mastered_concepts: string[];
  misconceptions: string[];
  pending_followup: boolean;
  pending_followup_type:
  | 'reasoning'
  | 'partial'
  | 'misconception'
  | 'unrelated_doubt'
  | null;
  struggle_count: number;
  next_question: number;
  last_turn_id?: string | null;
  stage_summaries: Record<string, string>;
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
  activeTopic: string;
  currentStageId: StageId;
  learningState: TopicLearningProgress;
  topicStates: Record<string, TopicLearningProgress>;
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
  action?: 'answer' | 'ask_why' | 'hint' | 'simplify' | 'challenge_start';
  challengePrompt?: string;
  clientTurnId?: string;
}

export interface TutorTurnResponse {
  tutorMessage: ConversationMessage;
  studentMessage?: ConversationMessage;
  state: StudentState;
  newlyDiscoveredConcepts: ConceptDefinition[];
  newlyEarnedBadges: BadgeDefinition[];
}
