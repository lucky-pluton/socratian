import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type {
  BadgeDefinition,
  ConceptDefinition,
  ConversationMessage,
  SequentialQuestion,
  StageId,
  StageTransition,
  StudentState,
  TeachingStrategy,
  TutorAssessment,
  TutorTurnRequest,
  VisualHint,
} from '../src/types/socratic.js';
import {
  BADGES,
  CONCEPTS,
  SEQUENTIAL_QUESTIONS,
  getConceptById,
  getNextUncompletedTarget,
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
  visualRequest: z
    .object({
      show: z.boolean(),
      type: z
        .enum([
          'combine_objects',
          'take_away_objects',
          'context_blocks',
          'bank_ledger',
          'number_line',
          'commutative_swap',
          'associative_regroup',
          'elevation_temp',
        ])
        .optional(),
      objectKind: z
        .enum(['chocolate', 'apple', 'book', 'balloon', 'coin', 'dot'])
        .optional(),
      groupA: z.number().optional(),
      groupB: z.number().optional(),
      groupC: z.number().optional(),
      start: z.number().optional(),
      addend: z.number().optional(),
      interactive: z.boolean().optional(),
      caption: z.string().optional(),
    })
    .nullable()
    .optional(),
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
    visualRequest: {
      type: ['object', 'null'],
      properties: {
        show: { type: 'boolean' },
        type: {
          type: 'string',
          enum: [
            'combine_objects',
            'take_away_objects',
            'context_blocks',
            'bank_ledger',
            'number_line',
            'commutative_swap',
            'associative_regroup',
            'elevation_temp',
          ],
        },
        objectKind: {
          type: 'string',
          enum: ['chocolate', 'apple', 'book', 'balloon', 'coin', 'dot'],
        },
        groupA: { type: 'number' },
        groupB: { type: 'number' },
        groupC: { type: 'number' },
        start: { type: 'number' },
        addend: { type: 'number' },
        interactive: { type: 'boolean' },
        caption: { type: 'string' },
      },
      required: ['show'],
    },
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

  return `You are Socratia, a warm, gentle math companion for children.

HOW TO SPEAK:
- Keep every reply to 1–2 short sentences. Use simple, everyday words.
- Ask ONLY ONE short question at a time.
- Never lecture, never dump formulas, and never use robotic phrases ("partially correct", "learning objective", "conceptual mastery").
- Use everyday examples (chocolates, books, ₹ rupees, steps).
- Explain more only if the child asks "why" or seems stuck.
- If struggle_count >= 1 or the child asks to simplify, use a tiny example (1 or 2 chocolates) and a shorter question.

STRICT SEQUENCE RULES:
1. Never jump stages or invent a new topic. Follow the current question (#${q.id}).
2. ${q.requiresReasoning
      ? 'This step REQUIRES reasoning: if the child gives ONLY a bare number/yes/no with no reason, set evaluation="correct_without_reasoning" and ask one short "why/how" question. If they give even a brief valid explanation (e.g. "I added 2 and 2" or "18 is already counted"), set evaluation="understood" immediately.'
      : 'Needs reasoning is FALSE for this step because the next sequential question asks how they got it — so a correct answer (even just a number like "4") MUST be marked evaluation="understood" immediately!'
    }
3. If the answer is right in part or missing the reason, set evaluation="partial" and ask one NEW gentle follow-up (never repeat a question you already asked in Recent conversation).
4. If the answer is wrong, set evaluation="wrong_or_misconception" and offer one simpler everyday picture — never reveal the answer.
5. If the child gives a different valid reason, or answers a stepping-stone follow-up accurately, set evaluation="understood" with alternativeValidExplanation=true.
6. ${hideTerm && !isFinalQuestionOfStage
      ? `NEVER mention "${concept?.discoveredTitle}" yet.`
      : hideTerm && isFinalQuestionOfStage
        ? `If evaluation="understood", bridgeAcknowledgement may gently name "${concept?.discoveredTitle}" in 1 short sentence.`
        : 'Keep bridgeAcknowledgement to 1 short warm sentence.'
    }
7. For an unrelated question, set evaluation="unrelated_doubt": answer in 1 short sentence, then return gently to: "${q.prompt}"

CURRENT STEP:
- Stage ${stage.number} (${stage.title}) · Question #${q.id}: "${q.prompt}"
- Idea: ${q.expectedDiscovery} · Needs reasoning: ${q.requiresReasoning} · Struggle count: ${state.learningState.struggle_count}
- Prior notes: ${prevSummaries || 'Starting out.'}`;
}

async function callGeminiEvaluator(
  state: StudentState,
  q: SequentialQuestion,
  req: TutorTurnRequest,
  isFinalQuestionOfStage: boolean
): Promise<EvaluatorOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  const candidateModels = Array.from(
    new Set([
      primaryModel,
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ])
  );
  const client = new GoogleGenAI({ apiKey });

  const recentDialogue = state.messages
    .filter((m) => m.stageId === q.stageId && m.role !== 'visual')
    .slice(-10)
    .map((m) => `${m.role === 'tutor' ? 'Tutor' : 'Student'}: ${m.content}`)
    .join('\n');

  const input = `Recent conversation in Stage ${q.stageNumber}:
${recentDialogue || '(Opening question was just asked)'}

Latest student message: "${req.message}"

Evaluate the student's response strictly against Question #${q.id} ("${q.prompt}") and return JSON.`;

  const systemInstruction = buildEvaluatorSystemPrompt(state, q, isFinalQuestionOfStage);
  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const interactionPromise = client.interactions.create({
        model,
        system_instruction: systemInstruction,
        input,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: EVALUATOR_JSON_SCHEMA,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on ${model}`)), 4500)
      );

      const interaction = await Promise.race([interactionPromise, timeoutPromise]);
      const rawText = interaction.output_text;
      if (!rawText) throw new Error(`Empty response from ${model}`);
      return EvaluatorOutputSchema.parse(JSON.parse(rawText));
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, trying fallback if available:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Gemini models failed');
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
  const hasAnswerNumber = extractNumbers(lower).length > 0;
  const onTopic =
    hasAnswerNumber ||
    q.reasoningKeywords.some((kw) => lower.includes(kw)) ||
    /\b(answer|chocolate|apple|book|balloon|debt|owe|zero|line|step|group|order|minus|negative|positive|same|total|why does|how did)\b/.test(
      lower
    );
  const explicitOtherMath = /(fraction|decimal|multiply|multiplication|divide|division|planet|pi|gravity|algebra|triangle|square root|prime|percentage)/.test(
    lower
  );
  if (onTopic && !explicitOtherMath) {
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
  if (lower.endsWith('?') && !onTopic && text.trim().split(/\s+/).length >= 3) {
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
    !bare && (matched >= 1 || hasConnector || altMatched || wordCount >= 5);

  // On open-ended explanation questions (no fixed number/boolean required), accept concise genuine reasoning like "I counted", "2 + 2", "in my head", "quicker"
  if (!q.acceptedNumbers && !q.acceptedBoolean && wordCount >= 2 && (matched >= 1 || hasConnector || altMatched || wordCount >= 3)) {
    return { hasReasoning: true, matchedKeywords: matched, alternativeValid: altMatched };
  }

  // If they previously gave the right value and now explain why in 3+ words (even without exact keyword match), accept natural wording
  if (previousStudentAnswerInFollowup && !bare && wordCount >= 3) {
    return { hasReasoning: true, matchedKeywords: matched, alternativeValid: altMatched || matched === 0 };
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

function getLastTutorContentForStage(state: StudentState, stageId: StageId): string {
  const m = [...state.messages]
    .reverse()
    .find((msg) => msg.stageId === stageId && msg.role === 'tutor');
  return m?.content ?? '';
}

function getPriorTutorContentsForQuestion(
  state: StudentState,
  stageId: StageId,
  questionId: number
): Set<string> {
  return new Set(
    state.messages
      .filter(
        (msg) =>
          msg.stageId === stageId &&
          msg.role === 'tutor' &&
          msg.questionId === questionId
      )
      .map((msg) => msg.content.trim().toLowerCase())
  );
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
  const lastTutorLower = getLastTutorContentForStage(state, q.stageId).toLowerCase();

  // 0. Handle stepping-stone follow-up answers directly so they never loop
  if (q.id === 3 && lastTutorLower.includes('next number after 18') && nums.includes(19)) {
    if (yesNo === 'no' || nums.includes(23) || lower.includes('count') || lower.includes('no')) {
      return {
        evaluation: 'understood',
        alternativeValidExplanation: true,
        whatUnderstood: 'Counted forward starting at 19 instead of recounting from 1',
        whatMisunderstood: null,
        detectedMisconception: null,
        strategyUsed: 'concept_synthesis',
        bridgeAcknowledgement: 'Yes — 19! You skipped recounting all 18.',
        adaptiveFollowUpQuestion: '',
        studentInsightSummary: 'Starting at 19 lets you count forward without recounting 18.',
      };
    }
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Correctly identified 19 as the next number after 18',
      whatMisunderstood: 'Needs to connect 19 back to skipping the recount of 18',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        'Yes, 19! So if you start right at 19, do you still need to count the first 18 again?',
      studentInsightSummary: null,
    };
  }

  if (q.id === 32 && lastTutorLower.includes('noon') && nums.includes(5) && !nums.includes(-2)) {
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Found +5°C at noon',
      whatMisunderstood: 'Still needs the midnight 7°C drop from +5°C',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        'Nice — it reaches +5°C at noon! Now if it drops 7°C from +5°C, where does it end up?',
      studentInsightSummary: null,
    };
  }

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

  // 2. Check explicit "I don't know" / "what is addition" / simplify / cognitive fatigue
  const asksToSimplify = /(simplify|simpler|easier|too hard|confused|lost|slow down|smaller example|what is addition|don't know what addition|never learned|show me)/i.test(
    lower
  );
  if (asksToSimplify || /^(idk|i don'?t know|no idea|not sure|skip|\?+)$/i.test(lower)) {
    const isBeginnerAddition =
      q.stageNumber === 1 &&
      /(what is addition|never learned|don't know)/i.test(lower);
    const gentleLine = isBeginnerAddition
      ? 'No problem! Look at the 2 chocolates and 2 more below — tap Put together to count them. How many do you see altogether?'
      : state.learningState.struggle_count >= 1 || asksToSimplify
        ? `No rush — let's look at the picture together. ${q.adaptiveHint}`
        : `${q.adaptiveHint} What do you notice?`;
    return {
      evaluation: 'wrong_or_misconception',
      alternativeValidExplanation: false,
      whatUnderstood: 'Asked to see it visually',
      whatMisunderstood: 'Needs a gentle visual stepping stone',
      detectedMisconception: null,
      strategyUsed: 'visual_scaffold',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: gentleLine,
      studentInsightSummary: null,
      visualRequest: {
        show: true,
        interactive: true,
      },
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
      const tiredPrefix =
        state.learningState.struggle_count >= 1
          ? "No worries — let's make it simpler and look at just one small piece."
          : "Wait, let's look at this differently.";
      return {
        evaluation: 'wrong_or_misconception',
        alternativeValidExplanation: false,
        whatUnderstood: `Tried ${nums[0]}`,
        whatMisunderstood: `Different outcome from ${nums[0]}`,
        detectedMisconception: `Explored ${nums[0]} on Question ${q.id}`,
        strategyUsed: 'visual_scaffold',
        bridgeAcknowledgement: '',
        adaptiveFollowUpQuestion: `${tiredPrefix} ${q.adaptiveHint} What do you get when you try that?`,
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
      whatUnderstood: 'Spotted the right result',
      whatMisunderstood: 'Has not shared the thinking behind it yet',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        'Interesting! How did you think of that — why does that happen?',
      studentInsightSummary: null,
    };
  }

  // Multi-part Stage 10 questions check: if student gave numeric answer + some explanation, check if they addressed relevance/why (Scenario C partial)
  if (q.stageNumber === 10 && gaveAcceptedValue && text.trim().split(/\s+/).length < 6) {
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Found the right number',
      whatMisunderstood: 'Needs to connect which numbers mattered and why',
      detectedMisconception: null,
      strategyUsed: 'socratic_probe',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion:
        "That's a good observation! Which numbers in the story actually mattered here, and why?",
      studentInsightSummary: null,
    };
  }

  // Open-ended reasoning question where response is too vague/short (Scenario C)
  if (!gaveAcceptedValue && !reasoning.hasReasoning) {
    if (text.trim().split(/\s+/).length <= 3) {
      return {
        evaluation: 'partial',
        alternativeValidExplanation: false,
        whatUnderstood: 'Shared a quick thought',
        whatMisunderstood: 'Needs a slightly fuller picture',
        detectedMisconception: null,
        strategyUsed: 'socratic_probe',
        bridgeAcknowledgement: '',
        adaptiveFollowUpQuestion: `Tell me a little more — ${q.adaptiveHint}`,
        studentInsightSummary: null,
      };
    }
    // Check if open-ended question without strict number/boolean has valid reasoning
    if (!q.acceptedNumbers && !q.acceptedBoolean && text.trim().split(/\s+/).length >= 4) {
      return {
        evaluation: 'understood',
        alternativeValidExplanation: true,
        whatUnderstood: 'Independent reasoning in own words',
        whatMisunderstood: null,
        detectedMisconception: null,
        strategyUsed: 'concept_synthesis',
        bridgeAcknowledgement: buildNaturalBridge(q, text),
        adaptiveFollowUpQuestion: '',
        studentInsightSummary: text.slice(0, 180),
      };
    }
    return {
      evaluation: 'partial',
      alternativeValidExplanation: false,
      whatUnderstood: 'Exploring the idea',
      whatMisunderstood: 'One small piece is still missing',
      detectedMisconception: null,
      strategyUsed: 'visual_scaffold',
      bridgeAcknowledgement: '',
      adaptiveFollowUpQuestion: `Let's look at one small piece of this together. ${q.adaptiveHint} What do you notice?`,
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

  // Unexpected connection & discovery moments
  const connectionMoments: Record<number, string> = {
    4: 'Nice! Counting forward saves so much time.',
    7: 'Aha! Context decides which things belong together.',
    9: 'Adding zero changed nothing, yet the addition still happened.',
    12: `You spotted it — order didn’t change a thing! That's called the **${concept?.discoveredTitle ?? 'Commutative Property'}**.`,
    16: `You found another pattern — grouping differently kept the total the same! That's the **${concept?.discoveredTitle ?? 'Associative Property'}**.`,
    20: 'You noticed something cool: -3 is greater than -8 because it is closer to zero.',
    23: "So adding can clear a debt, leave a debt, or leave extra money. Isn't that neat?",
    28: 'See the connection? Part of +7 walks you to 0, and the rest steps past it.',
    31: `Opposites cancel to zero in either order — that’s the **${concept?.discoveredTitle ?? 'Additive Inverse'}**!`,
  };

  if (connectionMoments[q.id]) {
    return connectionMoments[q.id];
  }
  if (isLastInStage && concept?.revealNameAfterDiscovery) {
    return `You just discovered the **${concept.discoveredTitle}**!`;
  }
  if (isLastInStage) {
    return `Nice discovery: *${stage.expectedDiscovery}*`;
  }
  if (studentText.trim().split(/\s+/).length >= 5) {
    return "That's a good observation.";
  }
  return 'Nice!';
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
  stageTransition?: StageTransition | null;
}> {
  const now = new Date().toISOString();

  // Idempotency guard: prevent duplicate tutor responses for retried/double-submitted clientTurnId
  if (req.clientTurnId && state.learningState.last_turn_id === req.clientTurnId) {
    const existingTutor = [...state.messages]
      .reverse()
      .find((m) => m.role === 'tutor');
    if (existingTutor) {
      return {
        tutorMessage: existingTutor,
        newlyDiscoveredConcepts: [],
        newlyEarnedBadges: [],
        stageTransition: null,
      };
    }
  }
  if (req.clientTurnId) {
    state.learningState.last_turn_id = req.clientTurnId;
  }

  // Keep active question aligned with the module the student is currently answering
  if (req.action !== 'challenge_start') {
    const activeQ = getQuestionById(state.learningState.current_question);
    if (activeQ.stageId !== req.stageId) {
      const requestedStage = getStageById(req.stageId);
      const completedSet = new Set(state.learningState.completed_questions);
      const targetQId =
        requestedStage.questionIds.find((qid) => !completedSet.has(qid)) ??
        requestedStage.questionIds[0];
      state.currentStageId = requestedStage.id;
      state.learningState.current_stage = requestedStage.number;
      state.learningState.current_question = targetQId;
      state.learningState.next_question = targetQId;
      state.learningState.pending_followup = false;
      state.learningState.pending_followup_type = null;
    }
  }

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
    state.messages.push({
      id: `msg-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: req.stageId,
      questionId: state.learningState.current_question,
      role: 'visual',
      content: '',
      visualHint: getStageById(req.stageId).openingVisualHint,
      createdAt: new Date().toISOString(),
    });
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
      content: `${q.adaptiveHint} Try the picture below and share what you notice.`,
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
    state.messages.push({
      id: `msg-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'visual',
      content: '',
      visualHint: { ...q.visualHint, interactive: true },
      createdAt: new Date().toISOString(),
    });
    return {
      tutorMessage,
      studentMessage,
      newlyDiscoveredConcepts: [],
      newlyEarnedBadges: [],
    };
  }

  if (req.action === 'simplify') {
    state.learningState.pending_followup = true;
    state.learningState.struggle_count += 1;
    const tutorMessage: ConversationMessage = {
      id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'tutor',
      content: `No rush at all — let's look at this together. ${q.adaptiveHint}`,
      assessment: {
        whatUnderstood: 'Asked to simplify the step',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: q.learningObjective,
        strategyUsed: 'revisit_foundation',
        understandingDelta: 2,
      },
      visualHint: q.visualHint,
      createdAt: new Date().toISOString(),
    };
    state.messages.push(tutorMessage);
    state.messages.push({
      id: `msg-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'visual',
      content: '',
      visualHint: { ...q.visualHint, interactive: true },
      createdAt: new Date().toISOString(),
    });
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
      content: `I love that curiosity! ${q.adaptiveHint} Seeing it that way, what do you notice about: ${q.prompt}`,
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
    state.messages.push({
      id: `msg-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: q.stageId,
      questionId: q.id,
      role: 'visual',
      content: '',
      visualHint: { ...q.visualHint, interactive: true },
      createdAt: new Date().toISOString(),
    });
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

  // Never stall on a reasoning follow-up when this question does not require reasoning
  if (!q.requiresReasoning && evalOut.evaluation === 'correct_without_reasoning') {
    evalOut.evaluation = 'understood';
    evalOut.bridgeAcknowledgement =
      evalOut.bridgeAcknowledgement?.trim() || 'Right — nice work!';
    evalOut.studentInsightSummary =
      evalOut.studentInsightSummary || q.expectedDiscovery;
  }

  const newlyDiscoveredConcepts: ConceptDefinition[] = [];
  let stageTransition: StageTransition | null = null;
  let responseText = '';
  let nextVisualHint: VisualHint = q.visualHint;
  let shouldEmitVisual = true;
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

    // 2. Clear pending follow-up & reset fatigue counter
    state.learningState.pending_followup = false;
    state.learningState.pending_followup_type = null;
    state.learningState.struggle_count = 0;
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

    // 4. Advance deterministically within the current module, or move to the next module once its question set is complete
    const target = getNextUncompletedTarget(state.learningState.completed_questions, q.id);
    const nextQ = target.nextQuestion;
    if (nextQ) {
      state.learningState.current_question = nextQ.id;
      state.learningState.next_question = nextQ.id;
      state.learningState.current_stage = nextQ.stageNumber;
      state.currentStageId = nextQ.stageId;
      targetQuestionIdForMsg = nextQ.id;
      targetStageIdForMsg = nextQ.stageId;
      nextVisualHint = nextQ.visualHint;
      shouldEmitVisual = true;

      const nextConcept = state.conceptProgress[nextQ.conceptId];
      if (nextConcept && nextConcept.status === 'undiscovered') {
        nextConcept.status = 'exploring';
      }

      if (nextQ.stageId !== q.stageId) {
        const nextStage = getStageById(nextQ.stageId);
        stageTransition = {
          fromStageId: stage.id,
          fromStageNumber: stage.number,
          fromStageTitle: stage.title,
          toStageId: nextStage.id,
          toStageNumber: nextStage.number,
          toStageTitle: nextStage.title,
        };

        // Leave a closing note in the finished module's chat log before entering the next module
        state.messages.push({
          id: `msg-tut-done-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          stageId: q.stageId,
          questionId: q.id,
          role: 'tutor',
          content: `${evalOut.bridgeAcknowledgement.trim()} Module ${stage.number} complete — moving to Module ${nextStage.number}: ${nextStage.title}.`,
          createdAt: now,
        });

        responseText = `${evalOut.bridgeAcknowledgement.trim()}\n\nModule ${stage.number} complete — now starting Module ${nextStage.number}: ${nextStage.title}.\n\n${nextQ.prompt}`;
      } else {
        responseText = `${evalOut.bridgeAcknowledgement.trim()} ${nextQ.prompt}`;
      }
    } else {
      // Completed the entire 10-stage Addition pathway!
      responseText = `${evalOut.bridgeAcknowledgement.trim()} You have completed every module of the Addition Discovery Journey! Would you like to revisit any idea in the Practice Lab or test a custom scenario of your own?`;
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
    state.learningState.struggle_count =
      evalOut.evaluation === 'unrelated_doubt'
        ? state.learningState.struggle_count
        : state.learningState.struggle_count + 1;

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

    if (evalOut.evaluation === 'wrong_or_misconception') {
      shouldEmitVisual = true;
      nextVisualHint = { ...q.visualHint, interactive: true };
    } else if (evalOut.visualRequest?.show) {
      shouldEmitVisual = true;
      nextVisualHint = {
        ...q.visualHint,
        ...evalOut.visualRequest,
        type: evalOut.visualRequest.type ?? q.visualHint.type,
      };
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

  // Anti-duplicate guard: check ALL prior tutor messages for this question so we never ping-pong or repeat
  const priorContents = getPriorTutorContentsForQuestion(
    state,
    targetStageIdForMsg,
    targetQuestionIdForMsg
  );
  if (priorContents.has(responseText.trim().toLowerCase())) {
    const altFallbacks = [
      `Let's try a super simple check: ${q.adaptiveHint}`,
      `Look at the picture below for a moment — what changes if we take just one small step?`,
      `No rush! Try telling me in one short sentence what you see happening here.`,
    ];
    const fresh = altFallbacks.find(
      (candidate) => !priorContents.has(candidate.trim().toLowerCase())
    );
    responseText =
      fresh ??
      `You're doing fine — tell me what you notice in the picture below, and we'll take the next step together.`;
  }

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

  if (shouldEmitVisual) {
    state.messages.push({
      id: `msg-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: targetStageIdForMsg,
      questionId: targetQuestionIdForMsg,
      role: 'visual',
      content: '',
      visualHint: nextVisualHint,
      createdAt: new Date().toISOString(),
    });
  }

  const newlyEarnedBadges = evaluateBadges(state);

  return {
    tutorMessage,
    studentMessage,
    newlyDiscoveredConcepts,
    newlyEarnedBadges,
    stageTransition,
  };
}

export { SEQUENTIAL_QUESTIONS };
