import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type {
  BadgeDefinition,
  ConceptDefinition,
  ConversationMessage,
  SequentialQuestion,
  StageId,
  StudentState,
  TeachingStrategy,
  TutorAssessment,
  TutorTurnRequest,
} from '../src/types/socratic.js';
import {
  BADGES,
  CONCEPTS,
  SEQUENTIAL_QUESTIONS,
  getConceptById,
  getNextQuestion,
  getQuestionById,
  getStageById,
} from './curriculum.js';

/**
 * AI Evaluator Output Schema:
 * Note the strict separation of responsibilities:
 * - The AI evaluates the student's response to the CURRENT sequential question,
 *   detects misconceptions, and crafts natural adaptive follow-ups or a warm bridge phrase.
 * - The Curriculum Engine deterministically decides stage/question advancement,
 *   mastery unlocking, and when to return to the original sequence.
 */
const EvaluatorOutputSchema = z.object({
  evaluation: z.enum([
    'understood',
    'correct_without_reasoning',
    'partial',
    'wrong_or_misconception',
    'unrelated_doubt',
  ]),
  alternativeValidExplanation: z.boolean(),
  whatUnderstood: z.string(),
  whatMisunderstood: z.string().nullable(),
  detectedMisconception: z.string().nullable(),
  strategyUsed: z.enum([
    'socratic_probe',
    'counterexample',
    'real_world_analogy',
    'visual_scaffold',
    'concept_synthesis',
    'revisit_foundation',
  ]),
  bridgeAcknowledgement: z
    .string()
    .describe(
      'Short, warm 1-sentence acknowledgement building on what the student said (used ONLY when evaluation=understood before asking the next sequential question). Do NOT include a question here and do NOT reveal terminology before discovery.'
    ),
  adaptiveFollowUpQuestion: z
    .string()
    .describe(
      'Used when evaluation is NOT understood. Must be ONE focused Socratic question (or for unrelated_doubt, a 1-2 sentence answer followed by returning to the exact pending question). Never ask multiple unrelated questions and never give away the answer.'
    ),
  studentInsightSummary: z
    .string()
    .nullable()
    .describe('Concise summary of the student explanation in their own words when understood.'),
});

type EvaluatorOutput = z.infer<typeof EvaluatorOutputSchema>;

const EVALUATOR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    evaluation: {
      type: 'string',
      enum: [
        'understood',
        'correct_without_reasoning',
        'partial',
        'wrong_or_misconception',
        'unrelated_doubt',
      ],
    },
    alternativeValidExplanation: { type: 'boolean' },
    whatUnderstood: { type: 'string' },
    whatMisunderstood: { type: ['string', 'null'] },
    detectedMisconception: { type: ['string', 'null'] },
    strategyUsed: {
      type: 'string',
      enum: [
        'socratic_probe',
        'counterexample',
        'real_world_analogy',
        'visual_scaffold',
        'concept_synthesis',
        'revisit_foundation',
      ],
    },
    bridgeAcknowledgement: { type: 'string' },
    adaptiveFollowUpQuestion: { type: 'string' },
    studentInsightSummary: { type: ['string', 'null'] },
  },
  required: [
    'evaluation',
    'alternativeValidExplanation',
    'whatUnderstood',
    'whatMisunderstood',
    'detectedMisconception',
    'strategyUsed',
    'bridgeAcknowledgement',
    'adaptiveFollowUpQuestion',
    'studentInsightSummary',
  ],
};

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

function buildEvaluatorSystemPrompt(
  state: StudentState,
  q: SequentialQuestion,
  isFinalQuestionOfStage: boolean
): string {
  const stage = getStageById(q.stageId);
  const concept = getConceptById(q.conceptId);
  const hideTerm = Boolean(concept?.revealNameAfterDiscovery);

  const prevSummaries = Object.entries(state.learningState.stage_summaries)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `You are the diagnostic evaluator and adaptive phrasing voice of Socratia, a structured Socratic mathematics teacher.

STRICT CONVERSATION RULES:
1. Ask exactly ONE primary question per message.
2. NEVER invent a new stage, jump to a different conceptual stage, or replace the curriculum's next sequential question.
3. If the student gives a correct numerical/yes-no answer WITHOUT explaining why (when reasoning is expected), classify as "correct_without_reasoning" and ask ONE "why/how" question.
4. If the answer is correct but reasoning is flawed or incomplete, classify as "partial" and address the reasoning gap with ONE follow-up.
5. If the answer is incorrect, classify as "wrong_or_misconception", identify the misconception, and ask ONE simpler guiding question or counterexample — NEVER reveal the final answer immediately.
6. If the student uses a different but mathematically valid explanation, classify as "understood" with alternativeValidExplanation=true.
7. NEVER introduce mathematical terminology ("Commutative property", "Associative property", "Additive inverse") before the student discovers the concept, unless they explicitly asked for it. ${
    hideTerm && !isFinalQuestionOfStage
      ? `FORBIDDEN WORDS RIGHT NOW: Do NOT mention "${concept?.discoveredTitle}" yet.`
      : hideTerm && isFinalQuestionOfStage
        ? `Only if evaluation="understood" on this final discovery question may bridgeAcknowledgement gently introduce the name "${concept?.discoveredTitle}".`
        : ''
  }
8. If the student asks an unrelated math/topic doubt, classify as "unrelated_doubt": answer briefly in 1-2 friendly sentences, and end adaptiveFollowUpQuestion by returning directly to the exact pending question: "${q.prompt}"
9. Never assume mastery from a blind guess; require reasoning when requiresReasoning=true.
10. Keep tone warm, natural, concise, and never robotic.

CURRENT CURRICULUM POSITION:
- Topic: ${state.learningState.topic}
- Stage ${stage.number}: ${stage.title}
- Stage Objective: ${stage.learningObjective}
- Expected Stage Discovery: ${stage.expectedDiscovery}
- Current Question (#${q.id}): "${q.prompt}"
- Question Objective: ${q.learningObjective}
- Expected Answer/Idea: ${q.expectedDiscovery}
- Requires Reasoning: ${q.requiresReasoning}
- Pending Follow-up Active: ${state.learningState.pending_followup} (${state.learningState.pending_followup_type ?? 'none'})

STUDENT'S PRIOR DISCOVERIES / EXPLANATIONS:
${prevSummaries || 'Just beginning the Addition pathway.'}`;
}

async function callGeminiEvaluator(
  state: StudentState,
  q: SequentialQuestion,
  req: TutorTurnRequest,
  isFinalQuestionOfStage: boolean
): Promise<EvaluatorOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  const client = new GoogleGenAI({ apiKey });

  const recentDialogue = state.messages
    .filter((m) => m.stageId === q.stageId)
    .slice(-10)
    .map((m) => `${m.role === 'tutor' ? 'Tutor' : 'Student'}: ${m.content}`)
    .join('\n');

  const input = `Recent conversation in Stage ${q.stageNumber}:
${recentDialogue || '(Opening question was just asked)'}

Latest student message: "${req.message}"

Evaluate the student's response strictly against Question #${q.id} ("${q.prompt}") and return JSON.`;

  const interaction = await client.interactions.create({
    model,
    system_instruction: buildEvaluatorSystemPrompt(state, q, isFinalQuestionOfStage),
    input,
    store: false,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: EVALUATOR_JSON_SCHEMA,
    },
  });

  const rawText = interaction.output_text;
  if (!rawText) throw new Error('Empty response from Gemini Interactions API');
  return EvaluatorOutputSchema.parse(JSON.parse(rawText));
}

// ============================================================================
// Deterministic Adaptive Demo Evaluator (Preserves Strict Sequential Progression)
// ============================================================================

function matchesWholePhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function isBareShortReply(text: string): boolean {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[.,!?₹°c]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return true;
  return /^(it is|that is|i think|answer is|maybe)\s+[+-]?\d+(\.\d+)?$/.test(cleaned);
}

function detectYesNo(text: string): 'yes' | 'no' | null {
  const lower = text.toLowerCase().trim();
  const hasNo = /\b(no|nope|not|never|don't|do not|doesn't|cannot|can't|won't|wouldn't)\b/.test(
    lower
  );
  const hasYes = /\b(yes|yeah|yep|sure|of course|can|did|still|agree)\b/.test(lower);
  if (hasNo && !hasYes) return 'no';
  if (hasYes && !hasNo) return 'yes';
  if (/\byes\b/.test(lower)) return 'yes';
  if (/\bno\b/.test(lower)) return 'no';
  // Handle "different" vs "same" for Q31 ("Will -5 + 5 and 5 + (-5) have different answers?")
  if (/\bdifferent\b/.test(lower) && !/\bnot different\b/.test(lower) && !/\bno different\b/.test(lower)) {
    return 'yes';
  }
  if (/\b(same|equal|both 0|both zero)\b/.test(lower)) return 'no';
  return null;
}

function detectUnrelatedDoubt(text: string, q: SequentialQuestion): string | null {
  const lower = text.toLowerCase().trim();
  if (!lower.includes('?') && !/^(what is|why is|how do|can you tell me|who |wait, )/.test(lower)) {
    return null;
  }
  // Check if the question is actually about the current prompt topic
  const onTopic =
    q.reasoningKeywords.some((kw) => lower.includes(kw)) ||
    lower.includes('why does this') ||
    lower.includes('why does it');
  if (onTopic && !/(fraction|multiply|multiplication|divide|division|planet|pi|gravity|algebra|triangle|square root|prime|percentage)/.test(lower)) {
    return null;
  }
  if (/(multiply|multiplication|times)/.test(lower)) {
    return 'Quick answer: multiplication is repeated addition of equal groups (we will explore that in a later topic!).';
  }
  if (/(divide|division)/.test(lower)) {
    return 'Quick answer: division splits a total into equal groups or shares.';
  }
  if (/(fraction|decimal)/.test(lower)) {
    return 'Quick answer: fractions and decimals describe parts between whole numbers on the number line.';
  }
  if (/(pi|circle|triangle|geometry)/.test(lower)) {
    return 'Quick answer: geometry explores shapes and space — pi (~3.14) compares a circle’s distance around to its width.';
  }
  if (/(prime)/.test(lower)) {
    return 'Quick answer: a prime number has only two whole-number divisors: 1 and itself.';
  }
  // Any clearly off-topic question mark
  if (
    lower.endsWith('?') &&
    !onTopic &&
    text.trim().split(/\s+/).length >= 3
  ) {
    return "That's a fun curiosity! Let's keep it brief so we don't lose our thread — we can explore that more once we wrap up this Addition idea.";
  }
  return null;
}

function hasValidReasoningForQuestion(
  text: string,
  q: SequentialQuestion,
  previousStudentAnswerInFollowup: boolean
): { hasReasoning: boolean; matchedKeywords: number; alternativeValid: boolean } {
  const lower = text.toLowerCase();
  const wordCount = lower.trim().split(/\s+/).filter(Boolean).length;
  const matched = q.reasoningKeywords.filter((kw) => lower.includes(kw)).length;
  const hasConnector = /\b(because|since|so|that means|which|therefore|instead|already|still|if|when|by|from|remaining|leftover|closer|equal|cancel|both|same|different|skip|start|count|put|combin|move|step)\b/.test(
    lower
  );

  // Alternative valid reasoning patterns (Scenario G)
  const alternativePatterns = [
    /(number line|jumps|hops|steps|forward|backward)/,
    /(owe|borrow|pay back|debt|pocket|wallet|spent|earned)/,
    /(balance|cancel|neutral|mirror|opposite|distance from zero)/,
    /(bracket|group|pair|swap|order|switch|doesn't change)/,
    /(unit|apple|book|balloon|km|meter|people|passenger|tank|degree|temperature)/,
  ];
  const altMatched = alternativePatterns.some((re) => re.test(lower));

  const bare = isBareShortReply(text);
  const enoughExplanation =
    !bare && (matched >= 1 || hasConnector || altMatched || wordCount >= 6);

  // If they previously gave the right value and now explain why, lower threshold cleanly
  if (previousStudentAnswerInFollowup && !bare && wordCount >= 3 && (matched >= 1 || hasConnector || altMatched)) {
    return { hasReasoning: true, matchedKeywords: matched, alternativeValid: altMatched };
  }

  return {
    hasReasoning: enoughExplanation && (matched >= 1 || (hasConnector && wordCount >= 4) || (altMatched && wordCount >= 4)),
    matchedKeywords: matched,
    alternativeValid: altMatched,
  };
}

function studentGavePreviousCorrectValue(state: StudentState, q: SequentialQuestion): boolean {
  if (state.learningState.pending_followup_type !== 'reasoning') return false;
  const recentStudent = [...state.messages]
    .reverse()
    .find((m) => m.stageId === q.stageId && m.role === 'student');
  if (!recentStudent) return false;
  const nums = extractNumbers(recentStudent.content);
  if (q.acceptedNumbers?.some((n) => nums.includes(n))) return true;
  if (q.acceptedBoolean && detectYesNo(recentStudent.content) === q.acceptedBoolean) return true;
  return false;
}

export function evaluateDemoResponse(
  state: StudentState,
  q: SequentialQuestion,
  rawMessage: string
): EvaluatorOutput {
  const text = rawMessage.trim();
  const lower = text.toLowerCase();
  const nums = extractNumbers(text);
  const yesNo = detectYesNo(text);
  const prevGaveValue = studentGavePreviousCorrectValue(state, q);

  // 1. Check unrelated doubt (Scenario E)
  const unrelatedReply = detectUnrelatedDoubt(text, q);
  if (unrelatedReply) {
    return {
      evaluation: 'unrelated_doubt',
      alternativeValidExplanation: false,
      whatUnderstood: 'Asked an unrelated curiosity question',
      whatMisunderstood: null,
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: `${unrelatedReply} Returning to where we were: ${q.prompt}`,
      studentInsightSummary: null,
    };
  }

  // 2. Check explicit "I don't know" / guessing / stuck
  if (/^(idk|i don'?t know|no idea|not sure|skip|\?+)$/i.test(lower)) {
    return {
      evaluation: 'wrong_or_misconception',
      alternativeValidExplanation: false,
      whatUnderstood: 'Unsure how to proceed yet',
      whatMisunderstood: 'Needs a gentle stepping-stone scaffold',
      detectedMisconception: null,
      strategyUsed: 'visual_scaffold',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: `${q.adaptiveHint} Looking at that clue, what do you think happens here?`,
      studentInsightSummary: null,
    };
  }

  // 3. Check specific question misconception rules (Scenario D)
  for (const rule of q.misconceptions) {
    const keywordHit = rule.keywords.some((kw) => matchesWholePhrase(lower, kw));
    const wrongNumHit =
      rule.wrongNumbers &&
      rule.wrongNumbers.some((wn) => nums.includes(wn)) &&
      !(q.acceptedNumbers?.some((an) => nums.includes(an))) &&
      !(q.id === 19 && nums.includes(3));

    // Special guard: on Q3, "yes" means "yes, must count all again"
    const booleanTrap =
      q.acceptedBoolean &&
      yesNo !== null &&
      yesNo !== q.acceptedBoolean &&
      rule.keywords.includes(yesNo);

    if (keywordHit || wrongNumHit || booleanTrap) {
      return {
        evaluation: 'wrong_or_misconception',
        alternativeValidExplanation: false,
        whatUnderstood: 'Attempted the question actively',
        whatMisunderstood: rule.label,
        detectedMisconception: rule.label,
        strategyUsed: 'counterexample',
        bridgeAcknowledgement: '',
        adaptiveFollowUpQuestion: rule.simplerExamplePrompt,
        studentInsightSummary: null,
      };
    }
  }

  // 4. Check generic wrong numeric answer (Scenario D)
  if (q.acceptedNumbers && nums.length > 0) {
    const hasAccepted = q.acceptedNumbers.some((an) => nums.includes(an));
    if (!hasAccepted && !prevGaveValue) {
      return {
        evaluation: 'wrong_or_misconception',
        alternativeValidExplanation: false,
        whatUnderstood: `Proposed ${nums[0]}`,
        whatMisunderstood: `Expected value differs from ${nums[0]}`,
        detectedMisconception: `Misapplied step on Question ${q.id} (answered ${nums[0]})`,
        strategyUsed: 'visual_scaffold',
        bridgeAcknowledgement: '',
        adaptiveFollowUpQuestion: `Hmm, let's test ${nums[0]} together! ${q.adaptiveHint} What do you get when you try that step by step?`,
        studentInsightSummary: null,
      };
    }
  }

  // 5. Check generic wrong yes/no answer (Scenario D)
  if (q.acceptedBoolean && yesNo !== null && yesNo !== q.acceptedBoolean && !prevGaveValue) {
    return {
      evaluation: 'wrong_or_misconception',
      alternativeValidExplanation: false,
      whatUnderstood: `Answered "${yesNo}"`,
      whatMisunderstood: 'Opposite conclusion from the objective',
      detectedMisconception: `Question ${q.id} directional/contextual misunderstanding`,
      strategyUsed: 'counterexample',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: `Let's double-check that idea: ${q.adaptiveHint} Knowing that, would your answer still be "${yesNo}", or something else?`,
      studentInsightSummary: null,
    };
  }

  // 6. Check reasoning quality
  const reasoning = hasValidReasoningForQuestion(text, q, prevGaveValue);

  // Special case: Q1 ("two chocolates and two more") accepts 4 directly if reasoning isn't required yet (since Q2 asks how!)
  if (!q.requiresReasoning) {
    const hasNum = q.acceptedNumbers ? q.acceptedNumbers.some((an) => nums.includes(an)) : true;
    if (hasNum) {
      return {
        evaluation: 'understood',
        alternativeValidExplanation: reasoning.alternativeValid,
        whatUnderstood: 'Correctly found the combined total of 4 chocolates',
        whatMisunderstood: null,
        detectedMisconception: null,
        strategyUsed: 'socratic_probe',
        bridgeAcknowledgement: 'Right — 4 chocolates!',
        adaptiveFollowUpQuestion: '',
        studentInsightSummary: 'Two chocolates and two more combine to 4 chocolates.',
      };
    }
  }

  // Correct value given WITHOUT reasoning (Scenario B)
  const gaveAcceptedValue =
    prevGaveValue ||
    (q.acceptedNumbers ? q.acceptedNumbers.some((an) => nums.includes(an)) : false) ||
    (q.acceptedBoolean ? yesNo === q.acceptedBoolean : false);

  if (gaveAcceptedValue && !reasoning.hasReasoning) {
    return {
      evaluation: 'correct_without_reasoning',
      alternativeValidExplanation: false,
      whatUnderstood: 'Gave the right answer',
      whatMisunderstood: 'Has not yet explained why or how it works',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        'You got the right answer! Why does that work — how did you figure it out in your own words?',
      studentInsightSummary: null,
    };
  }

  // Multi-part Stage 10 questions check: if student gave numeric answer + some explanation, check if they addressed relevance/why (Scenario C partial)
  if (q.stageNumber === 10 && gaveAcceptedValue && text.trim().split(/\s+/).length < 6) {
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Found the right number',
      whatMisunderstood: 'Needs to explain which quantities were relevant and why the answer makes sense',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        'Good calculation! Which quantities in the story actually mattered here, and why does your result make sense?',
      studentInsightSummary: null,
    };
  }

  // Open-ended reasoning question where response is too vague/short (Scenario C)
  if (!gaveAcceptedValue && !reasoning.hasReasoning) {
    if (text.trim().split(/\s+/).length <= 3) {
      return {
        evaluation: 'partial',
        alternativeValidExplanation: false,
        whatUnderstood: 'Started sharing a thought',
        whatMisunderstood: 'Explanation is too brief to verify conceptual understanding',
        detectedMisconception: null,
        strategyUsed: 'socratic_probe',
        bridgeAcknowledgement: '',
        adaptiveFollowUpQuestion: `Tell me a little more about what you mean! ${q.adaptiveHint}`,
        studentInsightSummary: null,
      };
    }
    // Check if open-ended question without strict number/boolean has valid reasoning
    if (!q.acceptedNumbers && !q.acceptedBoolean && text.trim().split(/\s+/).length >= 4) {
      return {
        evaluation: 'understood',
        alternativeValidExplanation: true,
        whatUnderstood: 'Shared a thoughtful explanation in own words',
        whatMisunderstood: null,
        detectedMisconception: null,
        strategyUsed: 'concept_synthesis',
        bridgeAcknowledgement: 'That makes great sense!',
        adaptiveFollowUpQuestion: '',
        studentInsightSummary: text.slice(0, 180),
      };
    }
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Engaging with the idea',
      whatMisunderstood: 'Missing the key connection for this step',
      detectedMisconception: null,
      strategyUsed: 'visual_scaffold',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: `You're thinking in a good direction. ${q.adaptiveHint} What do you notice?`,
      studentInsightSummary: null,
    };
  }

  // Scenario A & G: Understood with sound (or alternative valid) reasoning!
  return {
    evaluation: 'understood',
    alternativeValidExplanation: reasoning.alternativeValid,
    whatUnderstood: 'Demonstrated both accurate outcome and sound reasoning',
    whatMisunderstood: null,
    detectedMisconception: null,
    strategyUsed: 'concept_synthesis',
    bridgeAcknowledgement: buildNaturalBridge(q, text),
    adaptiveFollowUpQuestion: '',
    studentInsightSummary: text.slice(0, 180),
  };
}

function buildNaturalBridge(q: SequentialQuestion, studentText: string): string {
  const stage = getStageById(q.stageId);
  const isLastInStage = stage.questionIds[stage.questionIds.length - 1] === q.id;
  const concept = getConceptById(q.conceptId);

  if (isLastInStage && concept?.revealNameAfterDiscovery) {
    return `Exactly right — you just discovered the **${concept.discoveredTitle}** on your own!`;
  }
  if (isLastInStage) {
    return `Well reasoned! You've uncovered a key insight: *${stage.expectedDiscovery}*`;
  }
  if (studentText.trim().split(/\s+/).length >= 5) {
    return 'Nice reasoning — building directly on what you noticed:';
  }
  return 'Spot on!';
}

// ============================================================================
// Curriculum Engine State Transitions & Badge Evaluation
// ============================================================================

function evaluateBadges(state: StudentState): BadgeDefinition[] {
  const existing = new Set(state.badges.map((b) => b.badgeId));
  const newlyEarned: BadgeDefinition[] = [];
  const now = new Date().toISOString();

  const award = (id: string) => {
    if (existing.has(id)) return;
    const def = BADGES.find((b) => b.id === id);
    if (!def) return;
    existing.add(id);
    state.badges.push({ badgeId: id, earnedAt: now });
    newlyEarned.push(def);
  };

  if (state.questionsAsked >= 2) award('why-seeker');
  if (state.explanationsGiven >= 3) award('reasoning-voice');
  if (state.misconceptionsResolved >= 1) award('self-corrector');
  if (
    state.conceptProgress['zero_identity']?.status === 'discovered' &&
    state.conceptProgress['zero_balance']?.status === 'discovered'
  ) {
    award('zero-explorer');
  }
  if (
    state.conceptProgress['commutative_property']?.status === 'discovered' &&
    state.conceptProgress['associative_property']?.status === 'discovered'
  ) {
    award('pattern-discoverer');
  }

  const totalDiscovered = Object.values(state.conceptProgress).filter(
    (c) => c.status === 'discovered'
  ).length;
  if (totalDiscovered >= 10) award('addition-master');

  return newlyEarned;
}

export async function runSocraticTurn(
  state: StudentState,
  req: TutorTurnRequest
): Promise<{
  tutorMessage: ConversationMessage;
  studentMessage?: ConversationMessage;
  newlyDiscoveredConcepts: ConceptDefinition[];
  newlyEarnedBadges: BadgeDefinition[];
}> {
  const now = new Date().toISOString();
  const q = getQuestionById(state.learningState.current_question);
  const stage = getStageById(q.stageId);
  const isFinalQuestionOfStage =
    stage.questionIds[stage.questionIds.length - 1] === q.id;

  let studentMessage: ConversationMessage | undefined;
  if (req.action !== 'challenge_start') {
    const content =
      req.action === 'ask_why' && !req.message.trim()
        ? 'Why does this work?'
        : req.action === 'hint' && !req.message.trim()
          ? 'Could I have a gentle hint?'
          : req.message.trim();

    studentMessage = {
      id: `msg-stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'student',
      content,
      createdAt: now,
    };
    state.messages.push(studentMessage);
  }

  // Handle explicit button actions: challenge_start, hint, ask_why without losing sequence
  if (req.action === 'challenge_start' && req.challengePrompt) {
    const tutorMessage: ConversationMessage = {
      id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: req.stageId,
      questionId: state.learningState.current_question,
      role: 'tutor',
      content: req.challengePrompt,
      assessment: {
        whatUnderstood: 'Started curiosity challenge',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Elicit initial reasoning before revealing solution',
        strategyUsed: 'socratic_probe',
        understandingDelta: 4,
      },
      visualHint: getStageById(req.stageId).openingVisualHint,
      createdAt: new Date().toISOString(),
    };
    state.messages.push(tutorMessage);
    return {
      tutorMessage,
      newlyDiscoveredConcepts: [],
      newlyEarnedBadges: [],
    };
  }

  if (req.action === 'hint') {
    state.learningState.pending_followup = true;
    const tutorMessage: ConversationMessage = {
      id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'tutor',
      content: `${q.adaptiveHint} With that in mind, how would you answer: ${q.prompt}`,
      assessment: {
        whatUnderstood: 'Requested a gentle scaffold',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: q.learningObjective,
        strategyUsed: 'visual_scaffold',
        understandingDelta: 2,
      },
      visualHint: q.visualHint,
      createdAt: new Date().toISOString(),
    };
    state.messages.push(tutorMessage);
    return {
      tutorMessage,
      studentMessage,
      newlyDiscoveredConcepts: [],
      newlyEarnedBadges: [],
    };
  }

  if (req.action === 'ask_why') {
    state.questionsAsked += 1;
    state.reasoningScore += 10;
    state.learningState.pending_followup = true;
    const tutorMessage: ConversationMessage = {
      id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'tutor',
      content: `Great question to ask! ${q.adaptiveHint} Now try applying that intuition back to our question: ${q.prompt}`,
      assessment: {
        whatUnderstood: 'Asked why to understand underlying intuition',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: q.learningObjective,
        strategyUsed: 'real_world_analogy',
        understandingDelta: 8,
      },
      visualHint: q.visualHint,
      createdAt: new Date().toISOString(),
    };
    state.messages.push(tutorMessage);
    const newlyEarnedBadges = evaluateBadges(state);
    return {
      tutorMessage,
      studentMessage,
      newlyDiscoveredConcepts: [],
      newlyEarnedBadges,
    };
  }

  // Run AI Evaluator (Gemini when configured, else deterministic Adaptive Evaluator)
  let evalOut: EvaluatorOutput;
  if (hasGeminiKey()) {
    try {
      evalOut = await callGeminiEvaluator(state, q, req, isFinalQuestionOfStage);
    } catch (err) {
      console.warn('Gemini evaluator failed, falling back to Demo Evaluator:', err);
      evalOut = evaluateDemoResponse(state, q, req.message);
    }
  } else {
    evalOut = evaluateDemoResponse(state, q, req.message);
  }

  const newlyDiscoveredConcepts: ConceptDefinition[] = [];
  let responseText = '';
  let nextVisualHint = q.visualHint;
  let targetQuestionIdForMsg = q.id;
  let targetStageIdForMsg: StageId = q.stageId;
  let assessment: TutorAssessment;

  if (evalOut.evaluation === 'understood') {
    const hadPendingMisconception =
      state.learningState.pending_followup_type === 'misconception';

    // 1. Mark current question complete
    if (!state.learningState.completed_questions.includes(q.id)) {
      state.learningState.completed_questions.push(q.id);
    }
    if (evalOut.studentInsightSummary) {
      state.learningState.stage_summaries[`Q${q.id}`] = evalOut.studentInsightSummary;
    }

    // 2. Clear pending follow-up & resolve active misconception if any
    state.learningState.pending_followup = false;
    state.learningState.pending_followup_type = null;
    if (hadPendingMisconception) {
      state.misconceptionsResolved += 1;
      state.reasoningScore += 20;
    }

    // 3. Check concept mastery within this stage
    const conceptProg = state.conceptProgress[q.conceptId];
    const remainingQuestionsForConcept = stage.questionIds.filter((qid) => {
      const qItem = getQuestionById(qid);
      return (
        qItem.conceptId === q.conceptId &&
        !state.learningState.completed_questions.includes(qid)
      );
    });

    if (conceptProg) {
      if (conceptProg.status === 'undiscovered') {
        conceptProg.status = 'exploring';
      }
      conceptProg.mastery = Math.min(100, conceptProg.mastery + 45);
      conceptProg.activeMisconception = null;

      if (remainingQuestionsForConcept.length === 0 && conceptProg.status !== 'discovered') {
        conceptProg.status = 'discovered';
        conceptProg.mastery = 100;
        conceptProg.discoveredAt = now;
        conceptProg.studentExplanation =
          evalOut.studentInsightSummary ?? q.expectedDiscovery;
        if (!state.learningState.mastered_concepts.includes(q.conceptId)) {
          state.learningState.mastered_concepts.push(q.conceptId);
        }
        const def = getConceptById(q.conceptId);
        if (def) {
          newlyDiscoveredConcepts.push(def);
          state.journal.unshift({
            id: `journal-disc-${def.id}-${Date.now()}`,
            stageId: def.stageId,
            conceptId: def.id,
            entryType: 'discovery',
            title: `Discovered: ${def.discoveredTitle}`,
            content: conceptProg.studentExplanation || def.intuitionSummary,
            createdAt: now,
          });
        }
      }
    }

    if (q.requiresReasoning) {
      state.explanationsGiven += 1;
      state.reasoningScore += 15;
    } else {
      state.reasoningScore += 5;
    }

    // 4. Advance deterministically to next sequential question
    const nextQ = getNextQuestion(q.id);
    if (nextQ) {
      state.learningState.current_question = nextQ.id;
      state.learningState.next_question = nextQ.id;
      state.learningState.current_stage = nextQ.stageNumber;
      state.currentStageId = nextQ.stageId;
      targetQuestionIdForMsg = nextQ.id;
      targetStageIdForMsg = nextQ.stageId;
      nextVisualHint = nextQ.visualHint;

      const nextConcept = state.conceptProgress[nextQ.conceptId];
      if (nextConcept && nextConcept.status === 'undiscovered') {
        nextConcept.status = 'exploring';
      }

      responseText = `${evalOut.bridgeAcknowledgement.trim()} ${nextQ.prompt}`;
    } else {
      // Completed the entire 10-stage Addition pathway!
      responseText = `${evalOut.bridgeAcknowledgement.trim()} You have completed every stage of the Addition Discovery Journey! Would you like to revisit any idea in the Practice Lab or test a custom scenario of your own?`;
    }

    assessment = {
      whatUnderstood: evalOut.whatUnderstood,
      whatMisunderstood: evalOut.whatMisunderstood,
      answerCorrect: true,
      reasoningCorrect: true,
      activeMisconception: null,
      misconceptionResolved: hadPendingMisconception,
      nextPedagogicalGoal: nextQ
        ? `Question #${nextQ.id}: ${nextQ.learningObjective}`
        : 'Addition pathway mastered!',
      strategyUsed: evalOut.strategyUsed as TeachingStrategy,
      understandingDelta: 15,
    };
  } else {
    // Do NOT advance current_question or stage! Keep sequence intact.
    state.learningState.pending_followup = true;
    state.learningState.next_question = q.id;

    if (evalOut.evaluation === 'correct_without_reasoning') {
      state.learningState.pending_followup_type = 'reasoning';
    } else if (evalOut.evaluation === 'partial') {
      state.learningState.pending_followup_type = 'partial';
    } else if (evalOut.evaluation === 'wrong_or_misconception') {
      state.learningState.pending_followup_type = 'misconception';
      if (
        evalOut.detectedMisconception &&
        !state.learningState.misconceptions.includes(evalOut.detectedMisconception)
      ) {
        state.learningState.misconceptions.push(evalOut.detectedMisconception);
      }
      if (state.conceptProgress[q.conceptId]) {
        state.conceptProgress[q.conceptId].activeMisconception =
          evalOut.detectedMisconception;
      }
    } else if (evalOut.evaluation === 'unrelated_doubt') {
      state.learningState.pending_followup_type = 'unrelated_doubt';
      state.questionsAsked += 1;
    }

    responseText = evalOut.adaptiveFollowUpQuestion;
    assessment = {
      whatUnderstood: evalOut.whatUnderstood,
      whatMisunderstood: evalOut.whatMisunderstood,
      answerCorrect:
        evalOut.evaluation === 'correct_without_reasoning'
          ? true
          : evalOut.evaluation === 'wrong_or_misconception'
            ? false
            : null,
      reasoningCorrect: false,
      activeMisconception: evalOut.detectedMisconception,
      misconceptionResolved: false,
      nextPedagogicalGoal: `Resolve follow-up on Question #${q.id}: ${q.learningObjective}`,
      strategyUsed: evalOut.strategyUsed as TeachingStrategy,
      understandingDelta: evalOut.evaluation === 'correct_without_reasoning' ? 4 : 0,
    };
  }

  state.patternsDiscovered = ['commutative_property', 'associative_property', 'additive_inverse'].filter(
    (cid) => state.conceptProgress[cid]?.status === 'discovered'
  ).length;

  const tutorMessage: ConversationMessage = {
    id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    stageId: targetStageIdForMsg,
    questionId: targetQuestionIdForMsg,
    role: 'tutor',
    content: responseText,
    assessment,
    visualHint: nextVisualHint,
    createdAt: new Date().toISOString(),
  };
  state.messages.push(tutorMessage);

  const newlyEarnedBadges = evaluateBadges(state);

  return {
    tutorMessage,
    studentMessage,
    newlyDiscoveredConcepts,
    newlyEarnedBadges,
  };
}

export { SEQUENTIAL_QUESTIONS };
