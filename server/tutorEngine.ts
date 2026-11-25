import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type {
  BadgeDefinition,
  ConceptDefinition,
  ConversationMessage,
  StageId,
  StudentState,
  TutorAssessment,
  TutorTurnRequest,
  VisualHint,
} from '../src/types/socratic.js';
import { BADGES, CONCEPTS, STAGES, getConceptById, getStageById } from './curriculum.js';

const TutorStructuredSchema = z.object({
  tutorMessage: z.string(),
  assessment: z.object({
    whatUnderstood: z.string(),
    whatMisunderstood: z.string().nullable(),
    answerCorrect: z.boolean().nullable(),
    reasoningCorrect: z.boolean().nullable(),
    activeMisconception: z.string().nullable(),
    misconceptionResolved: z.boolean(),
    nextPedagogicalGoal: z.string(),
    strategyUsed: z.enum([
      'socratic_probe',
      'counterexample',
      'real_world_analogy',
      'visual_scaffold',
      'concept_synthesis',
      'revisit_foundation',
    ]),
    understandingDelta: z.number().min(-15).max(25),
  }),
  discoveredConceptIds: z.array(z.string()),
  exploringConceptId: z.string().nullable(),
  studentExplanationSummary: z.string().nullable(),
  visualHint: z
    .object({
      type: z.enum([
        'chocolates',
        'context_blocks',
        'bank_ledger',
        'number_line',
        'property_tiles',
        'elevation_temp',
      ]),
      start: z.number().optional(),
      addend: z.number().optional(),
      groupA: z.number().optional(),
      groupB: z.number().optional(),
      groupC: z.number().optional(),
      compareA: z.number().optional(),
      compareB: z.number().optional(),
      labelA: z.string().optional(),
      labelB: z.string().optional(),
      unit: z.string().optional(),
      caption: z.string().optional(),
    })
    .nullable(),
  rewardAction: z
    .enum([
      'explained_reasoning',
      'corrected_misconception',
      'asked_why',
      'discovered_pattern',
      'applied_in_context',
    ])
    .nullable(),
});

type TutorStructuredOutput = z.infer<typeof TutorStructuredSchema>;

const TUTOR_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tutorMessage: {
      type: 'string',
      description:
        'Your conversational Socratic response. Must end with ONE clear guiding question. Never dump formulas or multiple unrelated questions.',
    },
    assessment: {
      type: 'object',
      properties: {
        whatUnderstood: { type: 'string' },
        whatMisunderstood: { type: ['string', 'null'] },
        answerCorrect: { type: ['boolean', 'null'] },
        reasoningCorrect: { type: ['boolean', 'null'] },
        activeMisconception: { type: ['string', 'null'] },
        misconceptionResolved: { type: 'boolean' },
        nextPedagogicalGoal: { type: 'string' },
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
        understandingDelta: { type: 'integer' },
      },
      required: [
        'whatUnderstood',
        'whatMisunderstood',
        'answerCorrect',
        'reasoningCorrect',
        'activeMisconception',
        'misconceptionResolved',
        'nextPedagogicalGoal',
        'strategyUsed',
        'understandingDelta',
      ],
    },
    discoveredConceptIds: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Concept IDs the student genuinely proved they understand in their own words (never unlock from a bare numerical guess alone).',
    },
    exploringConceptId: {
      type: ['string', 'null'],
      description: 'Concept ID currently being explored next.',
    },
    studentExplanationSummary: {
      type: ['string', 'null'],
      description: 'Concise summary of the insight the student articulated in their own words.',
    },
    visualHint: {
      type: ['object', 'null'],
      properties: {
        type: {
          type: 'string',
          enum: [
            'chocolates',
            'context_blocks',
            'bank_ledger',
            'number_line',
            'property_tiles',
            'elevation_temp',
          ],
        },
        start: { type: 'number' },
        addend: { type: 'number' },
        groupA: { type: 'number' },
        groupB: { type: 'number' },
        groupC: { type: 'number' },
        compareA: { type: 'number' },
        compareB: { type: 'number' },
        labelA: { type: 'string' },
        labelB: { type: 'string' },
        unit: { type: 'string' },
        caption: { type: 'string' },
      },
      required: ['type'],
    },
    rewardAction: {
      type: ['string', 'null'],
      enum: [
        'explained_reasoning',
        'corrected_misconception',
        'asked_why',
        'discovered_pattern',
        'applied_in_context',
        null,
      ],
    },
  },
  required: [
    'tutorMessage',
    'assessment',
    'discoveredConceptIds',
    'exploringConceptId',
    'studentExplanationSummary',
    'visualHint',
    'rewardAction',
  ],
};

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

function buildSystemPrompt(state: StudentState, stageId: StageId): string {
  const stage = getStageById(stageId);
  const stageConcepts = CONCEPTS.filter((c) => c.stageId === stageId);
  const discoveredList = CONCEPTS.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  ).map((c) => `${c.id} (${c.discoveredTitle})`);

  const stageConceptDetails = stageConcepts
    .map((c) => {
      const progress = state.conceptProgress[c.id];
      const label =
        progress?.status === 'discovered' || !c.revealNameAfterDiscovery
          ? c.discoveredTitle
          : `${c.mysteryTitle} [DO NOT NAME "${c.discoveredTitle}" UNTIL STUDENT DISCOVERS IT]`;
      return `- ${c.id}: ${label} | status=${progress?.status ?? 'undiscovered'} | intuition=${c.intuitionSummary}`;
    })
    .join('\n');

  return `You are Socratia, a warm, deeply insightful Socratic mathematics mentor.
Philosophy: "Don't tell students what mathematics is. Help them discover why it works."

CRITICAL RULES:
1. Ask ONLY ONE question at a time. Never ask multiple unrelated questions in one turn.
2. NEVER immediately reveal the correct answer, formula, or rule.
3. NEVER dump an entire lesson or lecture. Keep messages concise (2-4 warm sentences max) ending in one thought-provoking question.
4. Do NOT assume a correct numerical answer means conceptual understanding — always ask the student to justify HOW or WHY unless they already explained their reasoning clearly.
5. Never respond with empty generic praise alone; engage directly with what the student said.
6. If the student shows a misconception (e.g., "-100 > -1", "addition always makes things bigger", "add unrelated units", "blind guessing"), DO NOT scold. Offer a relatable real-world counterexample (chocolates, rupees ₹ debt, temperature °C, floors/elevation, walking steps) and ask what happens.
7. In Stage 5 (Hidden Patterns), NEVER say "Commutative", "Associative", "Additive Identity", or "Additive Inverse" BEFORE the student discovers and explains the pattern in their own words. Only celebrate and introduce the formal name AFTER adding that concept ID to discoveredConceptIds.
8. If the student asks "Why?", honor their curiosity, give a tiny real-world intuition nudge, and ask a guiding follow-up question.
9. Only unlock concepts in discoveredConceptIds when the student demonstrates real understanding in their own words — never for blind guessing!

CURRENT STAGE: ${stage.number}. ${stage.title} — ${stage.subtitle}
STAGE CONCEPTS:
${stageConceptDetails}

PREVIOUSLY DISCOVERED CONCEPTS ACROSS JOURNEY:
${discoveredList.length > 0 ? discoveredList.join(', ') : 'None yet (just starting)'}

Use visualHint whenever helpful so the student can manipulate chocolates, context blocks, bank balances, the interactive number line, property tiles, or elevation/temperature gauges alongside your question.`;
}

function formatConversationContext(
  state: StudentState,
  stageId: StageId,
  req: TutorTurnRequest
): string {
  const stageMsgs = state.messages.filter((m) => m.stageId === stageId).slice(-14);
  const transcript = stageMsgs
    .map((m) => `${m.role === 'tutor' ? 'Tutor' : 'Student'}: ${m.content}`)
    .join('\n');

  let actionNote = '';
  if (req.action === 'ask_why') {
    actionNote =
      '[STUDENT CLICKED "ASK WHY" — Honor their curiosity! Explain the intuition gently through an everyday example and ask ONE follow-up question.]';
  } else if (req.action === 'hint') {
    actionNote =
      '[STUDENT REQUESTED A GENTLE HINT — Do NOT give the answer. Give a small relatable clue or visual prompt and ask ONE simpler stepping-stone question.]';
  } else if (req.action === 'challenge_start') {
    actionNote = `[STUDENT LAUNCHED CURIOSITY CHALLENGE: "${req.challengePrompt ?? req.message}" — Begin guiding them through this puzzle with ONE focused opening question.]`;
  }

  return `Recent dialogue in this stage:
${transcript || '(No prior messages in this stage yet)'}

${actionNote}
Student's latest message: "${req.message}"

Respond as JSON matching the schema.`;
}

async function callGeminiSocraticTutor(
  state: StudentState,
  req: TutorTurnRequest
): Promise<TutorStructuredOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing');
  }
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model,
    system_instruction: buildSystemPrompt(state, req.stageId),
    input: formatConversationContext(state, req.stageId, req),
    store: false,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: TUTOR_RESPONSE_JSON_SCHEMA,
    },
  });

  const rawText = interaction.output_text;
  if (!rawText) {
    throw new Error('Empty response from Gemini Interactions API');
  }
  const parsed = JSON.parse(rawText);
  return TutorStructuredSchema.parse(parsed);
}

// ============================================================================
// Adaptive Socratic Reasoning Engine (Demo Mode & Resilient Fallback)
// ============================================================================

function getLastTutorMessage(state: StudentState, stageId: StageId): string {
  const stageTutorMsgs = state.messages.filter(
    (m) => m.stageId === stageId && m.role === 'tutor'
  );
  return stageTutorMsgs[stageTutorMsgs.length - 1]?.content ?? '';
}

function isBareNumber(text: string): boolean {
  return /^\s*[+-]?\d+(\.\d+)?\s*(chocolates?|km|m|°c|c|₹|rs|rupees|floors?)?\s*\.?\s*$/i.test(
    text
  );
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function hasReasoningLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  if (text.trim().split(/\s+/).length >= 5) return true;
  return /(because|since|so |count|start|from|owe|debt|zero|less|more|left|right|step|order|same|group|cancel|opposite|unit|differ|add|combine|nothing|empty|better|closer)/.test(
    lower
  );
}

function isQuestionOrWhy(text: string, action?: TutorTurnRequest['action']): boolean {
  if (action === 'ask_why') return true;
  const lower = text.toLowerCase().trim();
  return (
    lower.startsWith('why') ||
    lower.includes('why does') ||
    lower.includes('why is') ||
    lower.includes('how come') ||
    lower.includes("don't understand") ||
    lower.includes('confused')
  );
}

function nextUndiscoveredInStage(state: StudentState, stageId: StageId): ConceptDefinition | undefined {
  const stage = getStageById(stageId);
  for (const cid of stage.conceptIds) {
    const p = state.conceptProgress[cid];
    if (!p || p.status !== 'discovered') {
      return getConceptById(cid);
    }
  }
  return undefined;
}

export function generateDemoSocraticTurn(
  state: StudentState,
  req: TutorTurnRequest
): TutorStructuredOutput {
  const text = req.message.trim();
  const lower = text.toLowerCase();
  const lastTutor = getLastTutorMessage(state, req.stageId);
  const lastLower = lastTutor.toLowerCase();
  const num = extractFirstNumber(text);
  const bareNum = isBareNumber(text);
  const explained = hasReasoningLanguage(text);

  // Handle curiosity challenge launch
  if (req.action === 'challenge_start' && req.challengePrompt) {
    const promptLower = req.challengePrompt.toLowerCase();
    if (promptLower.includes('elevator')) {
      return {
        tutorMessage:
          "Let's explore this together! Imagine you are standing in the elevator at floor -3 (3 floors underground). When it goes up 7 floors, does it reach ground floor (0) along the way — and if so, how many floors are still left to climb?",
        assessment: {
          whatUnderstood: 'Ready to explore multi-step signed movement',
          whatMisunderstood: null,
          answerCorrect: null,
          reasoningCorrect: null,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Break -3 + 7 into reaching 0 and continuing past 0',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 5,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'crossing-zero',
        studentExplanationSummary: null,
        visualHint: {
          type: 'number_line',
          start: -3,
          addend: 7,
          caption: 'Start at -3 and test going up 7 floors.',
        },
        rewardAction: null,
      };
    }
    if (promptLower.includes('submarine')) {
      return {
        tutorMessage:
          'Great challenge to unpack! Our submarine begins at -18 m and rises +11 m first. Before jumping to the end, where is the submarine right after that first rise?',
        assessment: {
          whatUnderstood: 'Engaged with multi-step elevation challenge',
          whatMisunderstood: null,
          answerCorrect: null,
          reasoningCorrect: null,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Track intermediate depth before finding the inverse return to 0',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 5,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'multi-step-reasoning',
        studentExplanationSummary: null,
        visualHint: {
          type: 'elevation_temp',
          start: -18,
          addend: 11,
          groupC: -5,
          unit: 'm',
          caption: 'Submarine starts at -18 m and rises +11 m.',
        },
        rewardAction: null,
      };
    }
    return {
      tutorMessage: req.challengePrompt,
      assessment: {
        whatUnderstood: 'Starting daily curiosity puzzle',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Elicit initial reasoning before giving hints',
        strategyUsed: 'socratic_probe',
        understandingDelta: 5,
      },
      discoveredConceptIds: [],
      exploringConceptId: nextUndiscoveredInStage(state, req.stageId)?.id ?? null,
      studentExplanationSummary: null,
      visualHint: getStageById(req.stageId).openingVisualHint,
      rewardAction: null,
    };
  }

  // Handle "Hint" request
  if (req.action === 'hint') {
    const hintByStage: Record<StageId, { msg: string; visual: VisualHint }> = {
      'stage-1': {
        msg: 'Picture keeping the big group intact in a box instead of dumping them out. If 18 chocolates are already inside the box, what is the very next number you say when you place the 1st new chocolate beside it?',
        visual: { type: 'chocolates', groupA: 18, groupB: 5, labelA: 'Already counted', labelB: 'New chocolates' },
      },
      'stage-2': {
        msg: 'Check the label attached to each number. Can two quantities only join into one total when they measure the same kind of thing?',
        visual: { type: 'context_blocks', groupA: 4, groupB: 3, unit: 'km', labelA: 'Morning', labelB: 'Evening' },
      },
      'stage-3': {
        msg: 'Think of ₹0 as having zero debt and zero cash. If one friend owes ₹100 and another friend owes ₹1, who needs less money to get back to ₹0?',
        visual: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹', labelA: 'Your debt', labelB: 'Friend debt' },
      },
      'stage-4': {
        msg: 'Use the interactive number line! Start at -5 and count how many steps it takes just to reach 0 first — how many of your +7 steps remain after reaching 0?',
        visual: { type: 'number_line', start: -5, addend: 7, caption: 'Step from -5 to 0, then use the remaining steps.' },
      },
      'stage-5': {
        msg: 'Try testing with small numbers on the tiles: if you walk 4 steps and then 9 steps, versus 9 steps and then 4 steps, did the total distance you traveled change?',
        visual: { type: 'property_tiles', groupA: 4, groupB: 9, unit: 'steps' },
      },
      'stage-6': {
        msg: 'Break the story into moments in time, and ask yourself for each number: does this move me upward (+), downward (-), or is it measuring something completely different?',
        visual: { type: 'elevation_temp', start: -4, addend: 9, groupC: -7, unit: '°C' },
      },
    };
    const chosen = hintByStage[req.stageId];
    return {
      tutorMessage: chosen.msg,
      assessment: {
        whatUnderstood: 'Asked for a helpful scaffold',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Guide with concrete visualization without giving away answer',
        strategyUsed: 'visual_scaffold',
        understandingDelta: 2,
      },
      discoveredConceptIds: [],
      exploringConceptId: nextUndiscoveredInStage(state, req.stageId)?.id ?? null,
      studentExplanationSummary: null,
      visualHint: chosen.visual,
      rewardAction: null,
    };
  }

  // Handle "Why?" curiosity at any point
  if (isQuestionOrWhy(text, req.action)) {
    const whyResponses: Record<StageId, { msg: string; visual: VisualHint }> = {
      'stage-1': {
        msg: 'Great question to ask! Think about why we invented addition: without it, every time two piles met we would have to start counting from 1 all over again. If you already know there are 18 chocolates in a jar and get 5 more, why does starting at 19 work without recounting the first 18?',
        visual: { type: 'chocolates', groupA: 18, groupB: 5, labelA: 'Known jar (18)', labelB: 'Added (5)' },
      },
      'stage-2': {
        msg: "Asking 'why' is where real math starts! Numbers describe amounts of something — like kilometers walked or rupees spent. If you walk 4 km and then earn ₹50, why wouldn't '4 + 50 = 54' tell us anything useful?",
        visual: { type: 'context_blocks', groupA: 4, groupB: 3, unit: 'km', labelA: 'Morning walk', labelB: 'Evening walk' },
      },
      'stage-3': {
        msg: "Here's why negative numbers behave that way: 'greater' in math means further toward having money (to the right), not having a bigger digit! If -1 means owing ₹1 and -100 means owing ₹100, who is closer to being debt-free at ₹0?",
        visual: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹', labelA: 'Balance -100', labelB: 'Balance -1' },
      },
      'stage-4': {
        msg: "Think of '+' as combining movements! A positive step pushes you toward higher values (right), while a negative step represents a drop or debt pushing you toward lower values (left). If you are at 2 and add -5, why does it make sense that you cross 0 and end up below it?",
        visual: { type: 'number_line', start: 2, addend: -5, caption: 'Adding a negative step moves left past 0.' },
      },
      'stage-5': {
        msg: "Wonderfully curious! Suppose you put 4 coins in your left pocket and 9 in your right pocket, then swap which pocket you count first. Did any coin appear or disappear just because you looked in a different order?",
        visual: { type: 'property_tiles', groupA: 4, groupB: 9, unit: 'coins' },
      },
      'stage-6': {
        msg: "Because math models real life! When you track elevation or temperature, 0 is your anchor point, and each change nudges you up or down from where you currently are. Look at -4°C rising 9°C: why does part of that 9°C get 'used up' just warming back to 0°C?",
        visual: { type: 'elevation_temp', start: -4, addend: 9, unit: '°C' },
      },
    };
    const pick = whyResponses[req.stageId];
    return {
      tutorMessage: pick.msg,
      assessment: {
        whatUnderstood: 'Demonstrated genuine curiosity by asking why',
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Connect intuition to a concrete scenario and invite explanation',
        strategyUsed: 'real_world_analogy',
        understandingDelta: 8,
      },
      discoveredConceptIds: [],
      exploringConceptId: nextUndiscoveredInStage(state, req.stageId)?.id ?? null,
      studentExplanationSummary: null,
      visualHint: pick.visual,
      rewardAction: 'asked_why',
    };
  }

  // Global Misconception Checks (can trigger in any stage!)
  if (
    (lower.includes('negative') && (lower.includes('smaller') || lower.includes('bad'))) ||
    (lower.includes('-100') && (lower.includes('greater') || lower.includes('bigger') || lower.includes('larger')) && !lower.includes('-1 is greater'))
  ) {
    return {
      tutorMessage:
        'Suppose you owe ₹100 (so your balance is -100) and your friend owes ₹1 (balance -1). Who actually has the better financial position right now?',
      assessment: {
        whatUnderstood: 'Recognizes negative numbers relate to debt or being below zero',
        whatMisunderstood: 'Conflating larger digit magnitude (100) with greater value, or thinking all debt is equally small',
        answerCorrect: false,
        reasoningCorrect: false,
        activeMisconception: 'Magnitude vs value for negative numbers (-100 vs -1)',
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Use real-world debt comparison to challenge the misconception',
        strategyUsed: 'counterexample',
        understandingDelta: 0,
      },
      discoveredConceptIds: [],
      exploringConceptId: 'comparing-negatives',
      studentExplanationSummary: null,
      visualHint: {
        type: 'bank_ledger',
        compareA: -100,
        compareB: -1,
        unit: '₹',
        labelA: 'You owe ₹100',
        labelB: 'Friend owes ₹1',
        caption: 'Compare the two financial positions.',
      },
      rewardAction: null,
    };
  }

  // Stage-specific adaptive dialogue
  if (req.stageId === 'stage-1') {
    // 1) Chocolates 3 + 2 -> 5
    if (lastLower.includes('3 chocolates') && lastLower.includes('2 more')) {
      if (num === 5 && bareNum) {
        return {
          tutorMessage: 'Interesting! How did you arrive at 5?',
          assessment: {
            whatUnderstood: 'Found the total of 3 and 2 chocolates',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: null,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Ask student to justify their counting/combining method',
            strategyUsed: 'socratic_probe',
            understandingDelta: 5,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'need-for-addition',
          studentExplanationSummary: null,
          visualHint: { type: 'chocolates', groupA: 3, groupB: 2, labelA: 'Pocket', labelB: 'Friend' },
          rewardAction: null,
        };
      }
      if (num === 5 && explained) {
        return {
          tutorMessage:
            'That makes total sense — you combined both separate groups into one! Now suppose you already counted 18 chocolates in a jar, and someone gives you 5 more. Would you need to count all 23 chocolates from 1 again?',
          assessment: {
            whatUnderstood: 'Understands addition combines separate quantities',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Introduce counting forward vs recounting everything',
            strategyUsed: 'socratic_probe',
            understandingDelta: 12,
          },
          discoveredConceptIds: ['need-for-addition'],
          exploringConceptId: 'counting-on',
          studentExplanationSummary: 'Addition combines separate groups together to find a single total.',
          visualHint: {
            type: 'chocolates',
            groupA: 18,
            groupB: 5,
            labelA: 'Already counted (18)',
            labelB: '5 more',
            caption: 'Do you need to recount all 18 from 1?',
          },
          rewardAction: 'explained_reasoning',
        };
      }
      return {
        tutorMessage:
          'Take a look at the two groups: 3 chocolates in your pocket and 2 new ones from your friend. If you put them side by side and count them together, how many do you get — and how did you count them?',
        assessment: {
          whatUnderstood: 'Engaging with combining two groups',
          whatMisunderstood: num !== null ? `Answered ${num} instead of combining 3 and 2` : null,
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: num !== null ? 'Miscounted combined total' : null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Re-anchor with concrete counting',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 0,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'need-for-addition',
        studentExplanationSummary: null,
        visualHint: { type: 'chocolates', groupA: 3, groupB: 2, labelA: 'Pocket', labelB: 'Friend' },
        rewardAction: null,
      };
    }

    // 2) "How did you arrive at 5?"
    if (lastLower.includes('arrive at 5')) {
      return {
        tutorMessage:
          'Nice! Now suppose you already counted 18 chocolates in a jar, and someone gives you 5 more. Would you need to count all 23 chocolates from 1 again?',
        assessment: {
          whatUnderstood: 'Articulated how they combined 3 and 2',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Test counting-on efficiency with larger base (18 + 5)',
          strategyUsed: 'socratic_probe',
          understandingDelta: 12,
        },
        discoveredConceptIds: ['need-for-addition'],
        exploringConceptId: 'counting-on',
        studentExplanationSummary: `Combined 3 and 2 by: "${text}".`,
        visualHint: { type: 'chocolates', groupA: 18, groupB: 5, labelA: 'Jar (18)', labelB: 'New (5)' },
        rewardAction: 'explained_reasoning',
      };
    }

    // 3) 18 + 5 counting forward
    if (lastLower.includes('18 chocolates') || lastLower.includes('show me how') || lastLower.includes('after 18')) {
      if (lower.includes('yes') && !lower.includes('no')) {
        return {
          tutorMessage:
            'You could count from 1, and it would work — though it takes a while! Wait: if you already know for sure there are 18 in the jar, what number comes right after 18 when you drop the first new chocolate in?',
          assessment: {
            whatUnderstood: 'Knows recounting from 1 is always safe',
            whatMisunderstood: 'Does not yet see you can skip recounting the known group of 18',
            answerCorrect: false,
            reasoningCorrect: false,
            activeMisconception: 'Believes every sum must be recounted from 1',
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Nudge student to start counting at 19',
            strategyUsed: 'visual_scaffold',
            understandingDelta: 2,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'counting-on',
          studentExplanationSummary: null,
          visualHint: { type: 'chocolates', groupA: 18, groupB: 5, labelA: 'Jar (18)', labelB: 'New (5)' },
          rewardAction: null,
        };
      }
      if ((lower.includes('no') || lower.includes('continue') || lower.includes('from 18')) && !lower.includes('19')) {
        return {
          tutorMessage: 'Can you show me how you would count forward from 18 for those 5 new chocolates?',
          assessment: {
            whatUnderstood: 'Knows recounting from 1 is unnecessary',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: null,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Have student demonstrate counting on (19, 20, 21, 22, 23)',
            strategyUsed: 'socratic_probe',
            understandingDelta: 8,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'counting-on',
          studentExplanationSummary: null,
          visualHint: { type: 'chocolates', groupA: 18, groupB: 5, labelA: 'Jar (18)', labelB: 'New (5)' },
          rewardAction: null,
        };
      }
      // Demonstrated counting on!
      return {
        tutorMessage:
          'Exactly — starting right from 18 saves all that recounting! Now here is a tricky question: you have 4 apples and your friend is 10 years old. Does adding 4 + 10 make sense here? Why or why not?',
        assessment: {
          whatUnderstood: 'Understands counting forward from a known total',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: true,
          nextPedagogicalGoal: 'Explore when quantities can meaningfully be combined',
          strategyUsed: 'counterexample',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['counting-on'],
        exploringConceptId: 'when-to-combine',
        studentExplanationSummary: 'Instead of recounting from 1, you can count forward from the group you already know.',
        visualHint: { type: 'context_blocks', groupA: 4, groupB: 10, unit: '?', labelA: '4 apples', labelB: '10 years old' },
        rewardAction: 'explained_reasoning',
      };
    }

    // 4) When should quantities be combined?
    if (lastLower.includes('4 apples') || lastLower.includes('10 years old')) {
      if (lower.includes('no') || lower.includes('differ') || lower.includes('not the same') || lower.includes('sense')) {
        return {
          tutorMessage:
            'Spot on — apples and years of age do not belong to the same kind of thing! Now imagine you have 7 chocolates and someone hands you an empty box with 0 chocolates inside. Why does adding 0 leave you with 7 instead of changing the number?',
          assessment: {
            whatUnderstood: 'Recognizes quantities need a meaningful shared category to combine',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Discover why adding zero does not change a quantity',
            strategyUsed: 'real_world_analogy',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['when-to-combine'],
          exploringConceptId: 'zero-no-change',
          studentExplanationSummary: 'You should only add quantities that share a meaningful common group or unit.',
          visualHint: { type: 'chocolates', groupA: 7, groupB: 0, labelA: 'Your hand (7)', labelB: 'Empty box (0)' },
          rewardAction: 'explained_reasoning',
        };
      }
      return {
        tutorMessage:
          'Wait — if you added 4 apples and 10 years, what would "14" even be? 14 apple-years?! So when does combining two numbers actually make sense?',
        assessment: {
          whatUnderstood: 'Attempted to combine numbers',
          whatMisunderstood: 'Tried adding mismatched quantities (apples and age)',
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: 'Adding numbers without checking if units/categories match',
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Use absurdity counterexample to prompt unit/category awareness',
          strategyUsed: 'counterexample',
          understandingDelta: 2,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'when-to-combine',
        studentExplanationSummary: null,
        visualHint: { type: 'context_blocks', groupA: 4, groupB: 10, unit: '?', labelA: '4 apples', labelB: '10 years' },
        rewardAction: null,
      };
    }

    // 5) Zero leaves unchanged
    if (lastLower.includes('empty box') || lastLower.includes('0 chocolates')) {
      if (num === 0) {
        return {
          tutorMessage:
            'Wait — if you already held 7 chocolates in your hand and I handed you an empty box with 0 inside, did your 7 chocolates vanish? How many are still in your hand?',
          assessment: {
            whatUnderstood: 'Thinking about zero',
            whatMisunderstood: 'Confusing adding 0 with multiplying by 0 (thinking 7 + 0 = 0)',
            answerCorrect: false,
            reasoningCorrect: false,
            activeMisconception: 'Confuses adding zero with getting zero',
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Contrast physical empty box with keeping original chocolates',
            strategyUsed: 'counterexample',
            understandingDelta: 0,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'zero-no-change',
          studentExplanationSummary: null,
          visualHint: { type: 'chocolates', groupA: 7, groupB: 0, labelA: 'Your hand (7)', labelB: 'Empty box (0)' },
          rewardAction: null,
        };
      }
      return {
        tutorMessage:
          'Exactly — combining 7 with nothing adds no new pieces and takes none away! You have uncovered every core idea in Stage 1. Ready to jump into Stage 2 to see how addition works when there are no objects to hold, or want to test another example first?',
        assessment: {
          whatUnderstood: 'Understands why adding zero leaves a number unchanged',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: true,
          nextPedagogicalGoal: 'Synthesize Stage 1 and invite Stage 2 exploration',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['zero-no-change'],
        exploringConceptId: 'abstract-quantities',
        studentExplanationSummary: 'Adding zero combines with nothing, so the starting amount stays completely unchanged.',
        visualHint: { type: 'chocolates', groupA: 7, groupB: 0, labelA: '7', labelB: '0' },
        rewardAction: 'explained_reasoning',
      };
    }
  }

  if (req.stageId === 'stage-2') {
    if (lastLower.includes('morning') && lastLower.includes('evening')) {
      return {
        tutorMessage:
          'Yes! Even though your morning walk is already over, addition tracks the total journey across time. Now suppose someone walks 500 meters and then 2 kilometers, and writes 500 + 2 = 502. What went wrong with their reasoning?',
        assessment: {
          whatUnderstood: 'Understands addition combines non-physical quantities like distance across time',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: explained,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Test why units and context matter (meters vs kilometers)',
          strategyUsed: 'counterexample',
          understandingDelta: 14,
        },
        discoveredConceptIds: ['abstract-quantities'],
        exploringConceptId: 'context-matters',
        studentExplanationSummary: 'Addition works for invisible quantities like distance, time, or money spread across different moments.',
        visualHint: { type: 'context_blocks', groupA: 500, groupB: 2, unit: 'm vs km', labelA: '500 meters', labelB: '2 kilometers' },
        rewardAction: explained ? 'explained_reasoning' : null,
      };
    }

    if (lastLower.includes('500 meters') || lastLower.includes('502')) {
      if (lower.includes('meter') || lower.includes('km') || lower.includes('unit') || lower.includes('same') || lower.includes('2000') || lower.includes('convert')) {
        return {
          tutorMessage:
            'Sharp catch! You noticed the units do not match yet. One more puzzle for this stage: people often say "addition always makes numbers bigger." Can you think of a real-life situation — maybe with temperature or money — where adding something does NOT make the total bigger?',
          assessment: {
            whatUnderstood: 'Recognizes units must match before adding numbers',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Challenge assumption that addition always increases a quantity',
            strategyUsed: 'socratic_probe',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['context-matters'],
          exploringConceptId: 'non-increasing-addition',
          studentExplanationSummary: 'Units and context matter: 500 m and 2 km cannot be added directly as 502 without matching units.',
          visualHint: { type: 'bank_ledger', start: 50, addend: -20, unit: '₹', labelA: 'Wallet', labelB: 'Added expense' },
          rewardAction: 'explained_reasoning',
        };
      }
      return {
        tutorMessage:
          'Look closely at the labels: 500 is in meters, and 2 is in kilometers. Is 2 kilometers the same size as 2 meters?',
        assessment: {
          whatUnderstood: 'Looking at the calculation',
          whatMisunderstood: 'Did not yet flag the mismatch between meters and kilometers',
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: 'Ignoring units during addition',
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Highlight the unit mismatch',
          strategyUsed: 'socratic_probe',
          understandingDelta: 2,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'context-matters',
        studentExplanationSummary: null,
        visualHint: { type: 'context_blocks', groupA: 500, groupB: 2, unit: 'm vs km', labelA: '500 m', labelB: '2 km' },
        rewardAction: null,
      };
    }

    if (lastLower.includes('bigger') || lastLower.includes('not make')) {
      return {
        tutorMessage:
          'Exactly right — adding a zero, a drop in temperature, or a new debt keeps the total the same or even lowers it! You are ready to explore Stage 3 (Negative Numbers) whenever you want to switch stages, or try another real-world example here.',
        assessment: {
          whatUnderstood: 'Understands addition does not always mean physically making something larger',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: true,
          nextPedagogicalGoal: 'Bridge to Stage 3 negative numbers',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['non-increasing-addition'],
        exploringConceptId: 'zero-reference-point',
        studentExplanationSummary: 'Adding zero or a loss/debt means addition does not always increase a value.',
        visualHint: { type: 'bank_ledger', start: 50, addend: -20, unit: '₹', labelA: 'Balance', labelB: 'Debt added' },
        rewardAction: 'explained_reasoning',
      };
    }
  }

  if (req.stageId === 'stage-3') {
    // 1) Bank balance 0, borrow 50
    if (lastLower.includes('borrow ₹50') || lastLower.includes('what does 0 mean')) {
      if (lower.includes('-50') || lower.includes('minus 50') || lower.includes('negative')) {
        return {
          tutorMessage:
            'Yes, -50 captures owing ₹50, with 0 acting as the neutral line between having money and owing money! Now test this: which is mathematically greater, -1 or -100, and why?',
          assessment: {
            whatUnderstood: 'Uses negative numbers for debt and understands 0 as the reference point',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Probe comparison of -1 vs -100',
            strategyUsed: 'socratic_probe',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['zero-reference-point', 'debt-and-negatives'],
          exploringConceptId: 'comparing-negatives',
          studentExplanationSummary: 'Zero is the break-even reference point; owing ₹50 is represented below zero as -50.',
          visualHint: {
            type: 'bank_ledger',
            compareA: -100,
            compareB: -1,
            unit: '₹',
            labelA: 'Balance -100',
            labelB: 'Balance -1',
          },
          rewardAction: 'explained_reasoning',
        };
      }
      return {
        tutorMessage:
          'Good start thinking about ₹0 as having neither cash nor debt! If having ₹50 is written as +50, how might we write *owing* ₹50 on the opposite side of 0?',
        assessment: {
          whatUnderstood: 'Exploring how debt relates to 0',
          whatMisunderstood: null,
          answerCorrect: null,
          reasoningCorrect: null,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Elicit negative notation (-50)',
          strategyUsed: 'real_world_analogy',
          understandingDelta: 5,
        },
        discoveredConceptIds: ['zero-reference-point'],
        exploringConceptId: 'debt-and-negatives',
        studentExplanationSummary: 'Zero marks the break-even point between surplus and owing.',
        visualHint: { type: 'bank_ledger', start: 0, addend: -50, unit: '₹', labelA: 'Start', labelB: 'Borrowed' },
        rewardAction: null,
      };
    }

    // 2) Counterexample loop: Who has the better financial position?
    if (lastLower.includes('better financial position')) {
      if (lower.includes('friend') || lower.includes('-1')) {
        return {
          tutorMessage: 'So which balance is mathematically greater, -100 or -1?',
          assessment: {
            whatUnderstood: 'Intuitively sees owing ₹1 is better than owing ₹100',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: null,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Connect financial intuition to inequality (-1 > -100)',
            strategyUsed: 'socratic_probe',
            understandingDelta: 8,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'comparing-negatives',
          studentExplanationSummary: null,
          visualHint: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹' },
          rewardAction: null,
        };
      }
      return {
        tutorMessage:
          'Wait — if you owe ₹100 you have to pay back ₹100 before reaching ₹0, whereas your friend only has to pay back ₹1. Who is closer to being debt-free?',
        assessment: {
          whatUnderstood: 'Comparing two debts',
          whatMisunderstood: 'Thought owing ₹100 was better or equal',
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: 'Confuses larger debt magnitude with better position',
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Clarify closeness to ₹0',
          strategyUsed: 'counterexample',
          understandingDelta: 0,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'comparing-negatives',
        studentExplanationSummary: null,
        visualHint: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹' },
        rewardAction: null,
      };
    }

    // 3) Which balance is mathematically greater, -100 or -1?
    if (lastLower.includes('mathematically greater') || lastLower.includes('greater, -1 or -100')) {
      if (num === -1 && bareNum) {
        return {
          tutorMessage: 'Why do you think -1 is greater than -100 even though 100 is bigger than 1?',
          assessment: {
            whatUnderstood: 'Correctly identified -1 as greater than -100',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: null,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Ensure conceptual distinction between magnitude and value',
            strategyUsed: 'socratic_probe',
            understandingDelta: 8,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'comparing-negatives',
          studentExplanationSummary: null,
          visualHint: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹' },
          rewardAction: null,
        };
      }
      if (num === -100) {
        return {
          tutorMessage:
            'Suppose you owe ₹100 and your friend owes ₹1. Who has the better financial position?',
          assessment: {
            whatUnderstood: 'Looking at digit sizes',
            whatMisunderstood: 'Believes -100 > -1 because 100 > 1',
            answerCorrect: false,
            reasoningCorrect: false,
            activeMisconception: '-100 is greater than -1 because 100 > 1',
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Introduce debt counterexample',
            strategyUsed: 'counterexample',
            understandingDelta: 0,
          },
          discoveredConceptIds: [],
          exploringConceptId: 'comparing-negatives',
          studentExplanationSummary: null,
          visualHint: { type: 'bank_ledger', compareA: -100, compareB: -1, unit: '₹' },
          rewardAction: null,
        };
      }
    }

    // 4) "Why do you think..." -> move to adding positive + negative
    if (lastLower.includes('why do you think') || (num === -1 && explained)) {
      return {
        tutorMessage:
          'Brilliant insight — the size of the debt (100) is larger, which pushes -100 much further below zero than -1! Now suppose your balance is -50 and you earn +80. What happens to your debt and what is your new balance?',
        assessment: {
          whatUnderstood: 'Distinguishes magnitude from mathematical value below zero',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: true,
          nextPedagogicalGoal: 'Combine positive income with negative debt (-50 + 80)',
          strategyUsed: 'socratic_probe',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['comparing-negatives'],
        exploringConceptId: 'adding-signed-numbers',
        studentExplanationSummary: '-1 is greater than -100 because owing ₹1 leaves you much closer to zero than owing ₹100.',
        visualHint: { type: 'bank_ledger', start: -50, addend: 80, unit: '₹', labelA: 'Debt (-50)', labelB: 'Earned (+80)' },
        rewardAction: 'corrected_misconception',
      };
    }

    // 5) -50 + 80
    if (lastLower.includes('-50') && lastLower.includes('80')) {
      if (num === 30) {
        return {
          tutorMessage:
            'Yes! The first ₹50 pays off the debt back to zero, leaving +₹30 in your pocket. Ready to watch how positive and negative additions actually move along a number line in Stage 4?',
          assessment: {
            whatUnderstood: 'Understands opposite signs partially cancel through zero',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Transition to Stage 4 Number Line',
            strategyUsed: 'concept_synthesis',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['adding-signed-numbers'],
          exploringConceptId: 'number-line-direction',
          studentExplanationSummary: 'Adding positive earnings to a negative debt first clears the debt to 0, leaving the remaining positive amount.',
          visualHint: { type: 'number_line', start: -50, addend: 80 },
          rewardAction: 'applied_in_context',
        };
      }
      return {
        tutorMessage:
          'Think of it in two moments: out of the ₹80 you earned, how much goes straight to clearing the ₹50 debt to zero, and how much is left for you?',
        assessment: {
          whatUnderstood: 'Working on combining -50 and +80',
          whatMisunderstood: num !== null ? `Answered ${num}` : null,
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: 'Added magnitudes instead of cancelling debt against earnings',
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Scaffold clearing debt to 0 first',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 2,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'adding-signed-numbers',
        studentExplanationSummary: null,
        visualHint: { type: 'bank_ledger', start: -50, addend: 80, unit: '₹' },
        rewardAction: null,
      };
    }
  }

  if (req.stageId === 'stage-4') {
    // -5 + 7 = 2
    if (lastLower.includes('-5') && lastLower.includes('+7')) {
      if (num === 2 && !explained) {
        return {
          tutorMessage:
            'You landed right at +2! How did those 7 steps carry you from -5 across 0 to +2?',
          assessment: {
            whatUnderstood: 'Correctly found -5 + 7 = 2',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: null,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Ask student to articulate direction and crossing zero',
            strategyUsed: 'socratic_probe',
            understandingDelta: 8,
          },
          discoveredConceptIds: ['number-line-direction'],
          exploringConceptId: 'crossing-zero',
          studentExplanationSummary: 'Adding a positive number moves right along the number line.',
          visualHint: { type: 'number_line', start: -5, addend: 7, caption: 'Notice how 5 steps reach 0, then 2 more reach +2!' },
          rewardAction: null,
        };
      }
      if (num === 2 || lower.includes('right') || lower.includes('zero')) {
        return {
          tutorMessage:
            'Beautifully reasoned — 5 steps bring you to 0, and the remaining 2 steps carry you right to +2! Now test the reverse: if you stand at +3 and add -8, which way do you walk and where do you land?',
          assessment: {
            whatUnderstood: 'Understands right direction for positive and crossing zero',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Test adding negative number crossing zero to the left (3 + (-8))',
            strategyUsed: 'socratic_probe',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['number-line-direction', 'crossing-zero'],
          exploringConceptId: 'crossing-zero',
          studentExplanationSummary: 'Adding +7 moves 7 steps right: 5 steps reach zero and 2 more land on +2.',
          visualHint: { type: 'number_line', start: 3, addend: -8, caption: 'Try starting at +3 and adding -8.' },
          rewardAction: 'explained_reasoning',
        };
      }
      return {
        tutorMessage:
          'Try running -5 + 7 on the number line above! Since +7 is positive, do we walk toward larger numbers (right) or smaller numbers (left)?',
        assessment: {
          whatUnderstood: 'Exploring number line',
          whatMisunderstood: num !== null ? `Predicted ${num}` : null,
          answerCorrect: false,
          reasoningCorrect: false,
          activeMisconception: 'Uncertain of direction or step count across zero',
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Clarify direction before final position',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 2,
        },
        discoveredConceptIds: [],
        exploringConceptId: 'number-line-direction',
        studentExplanationSummary: null,
        visualHint: { type: 'number_line', start: -5, addend: 7 },
        rewardAction: null,
      };
    }

    if (lastLower.includes('+3') && lastLower.includes('-8')) {
      if (num === -5) {
        return {
          tutorMessage:
            'Spot on: 3 steps left reach 0, and 5 more steps left land on -5! You have mastered moving across zero in both directions — ready for Stage 5 to uncover hidden patterns?',
          assessment: {
            whatUnderstood: 'Accurately moves left for negative addition across zero',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: true,
            nextPedagogicalGoal: 'Bridge to Stage 5 pattern discovery',
            strategyUsed: 'concept_synthesis',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['number-line-direction', 'crossing-zero'],
          exploringConceptId: 'order-independence',
          studentExplanationSummary: 'Adding negative moves left across zero: 3 + (-8) takes 3 steps to 0 and 5 more to -5.',
          visualHint: { type: 'number_line', start: 3, addend: -8 },
          rewardAction: 'explained_reasoning',
        };
      }
    }
  }

  if (req.stageId === 'stage-5') {
    // Pattern 1: Order independence (Commutative) — DO NOT NAME IT BEFORE DISCOVERY!
    if (lastLower.includes('₹4') && lastLower.includes('₹9')) {
      return {
        tutorMessage:
          'Exactly — both earn ₹13, because swapping the order you combine two amounts never changes the total! Mathematicians call that discovery the **Commutative Property**. Now test three amounts: does (₹2 + ₹5) + ₹3 give the same total as ₹2 + (₹5 + ₹3), and why?',
        assessment: {
          whatUnderstood: 'Discovered order independence of addition before hearing the formal name',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Explore grouping independence (Associative) without naming it yet',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['order-independence'],
        exploringConceptId: 'grouping-independence',
        studentExplanationSummary: 'Changing the order of two numbers being added never changes their sum.',
        visualHint: { type: 'property_tiles', groupA: 2, groupB: 5, groupC: 3, unit: '₹', caption: 'Compare (2 + 5) + 3 vs 2 + (5 + 3).' },
        rewardAction: 'discovered_pattern',
      };
    }

    // Pattern 2: Grouping independence (Associative)
    if (lastLower.includes('(₹2 + ₹5)') || lastLower.includes('2 + (₹5 + ₹3)')) {
      return {
        tutorMessage:
          'Yes! Whether you group the first two or the last two first, all three pieces still join into ₹10 — that pattern is called the **Associative Property**. Next puzzle: if you start at -6 and add 0, what happens and why?',
        assessment: {
          whatUnderstood: 'Discovered grouping independence before formal name',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Explore zero with negative numbers (Additive Identity)',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['grouping-independence'],
        exploringConceptId: 'additive-identity',
        studentExplanationSummary: 'Changing how numbers are grouped with parentheses does not change the final sum.',
        visualHint: { type: 'number_line', start: -6, addend: 0, caption: 'Start at -6 and take 0 steps.' },
        rewardAction: 'discovered_pattern',
      };
    }

    // Pattern 3: Additive Identity
    if (lastLower.includes('-6') && lastLower.includes('add 0')) {
      return {
        tutorMessage:
          'Right — taking 0 steps keeps -6 completely unchanged, which is why 0 is called the **Additive Identity**! Final hidden pattern: if you climb +8 floors and then go -8 floors, where do you end up, and what happens for ANY number combined with its opposite?',
        assessment: {
          whatUnderstood: 'Discovered additive identity across signed numbers',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Discover opposite cancellation (Additive Inverse)',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['additive-identity'],
        exploringConceptId: 'additive-inverse',
        studentExplanationSummary: 'Adding 0 leaves any positive or negative number identical.',
        visualHint: { type: 'number_line', start: 8, addend: -8, caption: 'Watch +8 and its opposite -8.' },
        rewardAction: 'discovered_pattern',
      };
    }

    // Pattern 4: Additive Inverse
    if (lastLower.includes('+8') && lastLower.includes('-8')) {
      return {
        tutorMessage:
          'They cancel straight back to 0! Any pair like +8 and -8 is an **Additive Inverse** pair because their equal opposite movements always bring you home to zero. Ready for Stage 6 to apply all of your discoveries to real-world mysteries?',
        assessment: {
          whatUnderstood: 'Discovered additive inverses cancel to zero',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Transition to Stage 6 application',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['additive-inverse'],
        exploringConceptId: 'real-world-modeling',
        studentExplanationSummary: 'A number and its opposite are equal distances from zero in opposite directions, so adding them always returns 0.',
        visualHint: { type: 'number_line', start: 8, addend: -8 },
        rewardAction: 'discovered_pattern',
      };
    }
  }

  if (req.stageId === 'stage-6') {
    if (lastLower.includes('-4°c') || lastLower.includes('mountain camp')) {
      if (num === -2) {
        return {
          tutorMessage:
            'Spot on (-4 + 9 = +5, then +5 + (-7) = -2°C)! Now try one last discernment check: "4 shirts cost ₹500 each." Should we use addition 4 + 500 to find the total bill? Why or why not?',
          assessment: {
            whatUnderstood: 'Accurately modeled multi-step temperature swings across zero',
            whatMisunderstood: null,
            answerCorrect: true,
            reasoningCorrect: true,
            activeMisconception: null,
            misconceptionResolved: false,
            nextPedagogicalGoal: 'Check ability to judge when addition is NOT appropriate',
            strategyUsed: 'counterexample',
            understandingDelta: 15,
          },
          discoveredConceptIds: ['real-world-modeling', 'multi-step-reasoning'],
          exploringConceptId: 'addition-appropriateness',
          studentExplanationSummary: 'Multi-step temperature changes can be tracked sequentially across zero (-4 + 9 - 7 = -2°C).',
          visualHint: { type: 'context_blocks', groupA: 4, groupB: 500, unit: 'shirts vs ₹', labelA: '4 shirts', labelB: '₹500 each' },
          rewardAction: 'applied_in_context',
        };
      }
      return {
        tutorMessage:
          'Let’s take just the first jump together: starting at -4°C, the temperature rises by +9°C. Where does it reach at noon before the midnight drop?',
        assessment: {
          whatUnderstood: 'Working through multi-step temperature scenario',
          whatMisunderstood: null,
          answerCorrect: null,
          reasoningCorrect: null,
          activeMisconception: null,
          misconceptionResolved: false,
          nextPedagogicalGoal: 'Solve first step (-4 + 9)',
          strategyUsed: 'visual_scaffold',
          understandingDelta: 5,
        },
        discoveredConceptIds: ['real-world-modeling'],
        exploringConceptId: 'multi-step-reasoning',
        studentExplanationSummary: null,
        visualHint: { type: 'elevation_temp', start: -4, addend: 9, unit: '°C' },
        rewardAction: null,
      };
    }

    if (lastLower.includes('4 shirts')) {
      return {
        tutorMessage:
          'Exactly — 4 is the count of shirts and ₹500 is the price *per* shirt, so adding 4 + 500 mixes mismatched meanings (you would either add 500 four times or multiply!). What everyday situation of your own could you invent where signed addition genuinely shines?',
        assessment: {
          whatUnderstood: 'Judges accurately when addition does and does not apply',
          whatMisunderstood: null,
          answerCorrect: true,
          reasoningCorrect: true,
          activeMisconception: null,
          misconceptionResolved: true,
          nextPedagogicalGoal: 'Encourage creative transfer of signed addition',
          strategyUsed: 'concept_synthesis',
          understandingDelta: 15,
        },
        discoveredConceptIds: ['addition-appropriateness'],
        exploringConceptId: null,
        studentExplanationSummary: 'Knowing when NOT to add prevents combining mismatched rates, counts, or units.',
        visualHint: { type: 'elevation_temp', start: -4, addend: 9, groupC: -7, unit: '°C' },
        rewardAction: 'applied_in_context',
      };
    }
  }

  // Generic intelligent Socratic continuation for open-ended dialogue in any stage
  const nextConcept = nextUndiscoveredInStage(state, req.stageId);
  if (bareNum && !explained) {
    return {
      tutorMessage: `I see your answer of ${text}! Can you explain *why* or *how* you arrived at that in your own words?`,
      assessment: {
        whatUnderstood: `Proposed numerical answer ${text}`,
        whatMisunderstood: null,
        answerCorrect: null,
        reasoningCorrect: null,
        activeMisconception: null,
        misconceptionResolved: false,
        nextPedagogicalGoal: 'Verify reasoning behind bare number',
        strategyUsed: 'socratic_probe',
        understandingDelta: 3,
      },
      discoveredConceptIds: [],
      exploringConceptId: nextConcept?.id ?? null,
      studentExplanationSummary: null,
      visualHint: getStageById(req.stageId).openingVisualHint,
      rewardAction: null,
    };
  }

  // Student gave a thoughtful explanation on follow-up / open turn
  const unlocked = nextConcept && explained ? [nextConcept.id] : [];
  const nextAfter =
    unlocked.length > 0
      ? CONCEPTS.find((c) => c.stageId === req.stageId && c.id !== nextConcept?.id && state.conceptProgress[c.id]?.status !== 'discovered')
      : nextConcept;

  const revealText =
    nextConcept && unlocked.length > 0 && nextConcept.revealNameAfterDiscovery
      ? ` Notice how you just discovered **${nextConcept.discoveredTitle}** on your own!`
      : '';

  const followUpPrompt = nextAfter
    ? `Now let's test another angle: think about "${nextAfter.realWorldExample}" — how would you predict what happens there?`
    : `You have explored all the core ideas in this stage! Want to test a wild edge case together, or head to the next stage?`;

  return {
    tutorMessage: `That is thoughtful reasoning.${revealText} ${followUpPrompt}`,
    assessment: {
      whatUnderstood: explained ? 'Articulated reasoning clearly in own words' : 'Engaged in discussion',
      whatMisunderstood: null,
      answerCorrect: true,
      reasoningCorrect: explained,
      activeMisconception: null,
      misconceptionResolved: false,
      nextPedagogicalGoal: nextAfter ? `Explore ${nextAfter.id}` : 'Encourage synthesis or stage advance',
      strategyUsed: explained ? 'concept_synthesis' : 'socratic_probe',
      understandingDelta: explained ? 12 : 4,
    },
    discoveredConceptIds: unlocked,
    exploringConceptId: nextAfter?.id ?? null,
    studentExplanationSummary: explained ? text.slice(0, 180) : null,
    visualHint: getStageById(req.stageId).openingVisualHint,
    rewardAction: explained ? 'explained_reasoning' : null,
  };
}

// ============================================================================
// Orchestration: Apply Tutor Output to StudentState & Unlock Badges
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
    state.conceptProgress['zero-no-change']?.status === 'discovered' &&
    state.conceptProgress['zero-reference-point']?.status === 'discovered'
  ) {
    award('zero-explorer');
  }
  if (state.patternsDiscovered >= 2) award('pattern-discoverer');

  const totalDiscovered = Object.values(state.conceptProgress).filter(
    (c) => c.status === 'discovered'
  ).length;
  if (totalDiscovered >= 12) award('addition-master');

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
  state.currentStageId = req.stageId;

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
      stageId: req.stageId,
      role: 'student',
      content,
      createdAt: now,
    };
    state.messages.push(studentMessage);
  }

  let output: TutorStructuredOutput;
  if (hasGeminiKey()) {
    try {
      output = await callGeminiSocraticTutor(state, req);
    } catch (err) {
      console.warn('Gemini call failed, falling back to Demo Socratic Engine:', err);
      output = generateDemoSocraticTurn(state, req);
    }
  } else {
    output = generateDemoSocraticTurn(state, req);
  }

  // Update conceptual progress
  const newlyDiscoveredConcepts: ConceptDefinition[] = [];
  for (const cid of output.discoveredConceptIds) {
    const def = getConceptById(cid);
    const prog = state.conceptProgress[cid];
    if (def && prog && prog.status !== 'discovered') {
      prog.status = 'discovered';
      prog.mastery = Math.max(prog.mastery, 85);
      prog.activeMisconception = null;
      prog.discoveredAt = now;
      if (output.studentExplanationSummary) {
        prog.studentExplanation = output.studentExplanationSummary;
      }
      newlyDiscoveredConcepts.push(def);

      // Auto-add discovery to reflection journal
      state.journal.unshift({
        id: `journal-disc-${cid}-${Date.now()}`,
        stageId: def.stageId,
        conceptId: cid,
        entryType: 'discovery',
        title: `Discovered: ${def.discoveredTitle}`,
        content: output.studentExplanationSummary || def.intuitionSummary,
        createdAt: now,
      });
    }
  }

  if (output.exploringConceptId && state.conceptProgress[output.exploringConceptId]) {
    const target = state.conceptProgress[output.exploringConceptId];
    if (target.status === 'undiscovered') {
      target.status = 'exploring';
    }
    target.mastery = Math.min(100, Math.max(0, target.mastery + Math.max(0, output.assessment.understandingDelta)));
    if (output.assessment.activeMisconception) {
      target.activeMisconception = output.assessment.activeMisconception;
    } else if (output.assessment.misconceptionResolved) {
      target.activeMisconception = null;
    }
  }

  // Update gamification metrics (never reward blind guessing!)
  if (output.rewardAction === 'asked_why' || req.action === 'ask_why') {
    state.questionsAsked += 1;
    state.reasoningScore += 10;
  }
  if (output.rewardAction === 'explained_reasoning' || output.assessment.reasoningCorrect) {
    state.explanationsGiven += 1;
    state.reasoningScore += 15;
  }
  if (output.rewardAction === 'corrected_misconception' || output.assessment.misconceptionResolved) {
    state.misconceptionsResolved += 1;
    state.reasoningScore += 20;
  }
  if (output.rewardAction === 'discovered_pattern') {
    state.reasoningScore += 20;
  }
  if (output.rewardAction === 'applied_in_context') {
    state.reasoningScore += 15;
  }

  state.patternsDiscovered = CONCEPTS.filter(
    (c) => c.stageId === 'stage-5' && state.conceptProgress[c.id]?.status === 'discovered'
  ).length;

  const tutorMessage: ConversationMessage = {
    id: `msg-tut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    stageId: req.stageId,
    role: 'tutor',
    content: output.tutorMessage,
    assessment: output.assessment,
    visualHint: output.visualHint ?? undefined,
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
