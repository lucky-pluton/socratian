import type {
  BadgeDefinition,
  ChallengeItem,
  ConceptDefinition,
  StageDefinition,
  StageId,
} from '../src/types/socratic.js';

export const STAGES: StageDefinition[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Discovering Addition',
    subtitle: 'Combining, counting forward, and nothingness',
    description:
      'Explore why humans needed addition in the first place, how counting forward saves effort, when combining makes sense, and what happens when you add nothing.',
    openingQuestion:
      'You have 3 chocolates in your pocket, and your friend hands you 2 more. How many chocolates do you have altogether?',
    openingVisualHint: {
      type: 'chocolates',
      groupA: 3,
      groupB: 2,
      labelA: 'Your pocket',
      labelB: 'From your friend',
      caption: 'Tap or explore the two groups of chocolates.',
    },
    accentColor: '#D97706',
    conceptIds: [
      'need-for-addition',
      'counting-on',
      'when-to-combine',
      'zero-no-change',
    ],
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Addition Beyond Objects',
    subtitle: 'Money, distance, time, and context',
    description:
      'Discover how combining works even when nothing is sitting side by side in front of you — and why addition does not always mean piling up physical things.',
    openingQuestion:
      'You walk 4 km in the morning to a library and 3 km in the evening to a friend’s house. You cannot hold kilometers in your hand like chocolates — so what does 4 + 3 actually mean here?',
    openingVisualHint: {
      type: 'context_blocks',
      groupA: 4,
      groupB: 3,
      unit: 'km',
      labelA: 'Morning walk',
      labelB: 'Evening walk',
      caption: 'Combining distances that happened at different times.',
    },
    accentColor: '#0D9488',
    conceptIds: [
      'abstract-quantities',
      'context-matters',
      'non-increasing-addition',
    ],
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Negative Numbers',
    subtitle: 'Debt, zero as reference, and comparing below zero',
    description:
      'Meet numbers below zero through bank balances and owing money. Discover why -1 is greater than -100 and what happens when savings meet debt.',
    openingQuestion:
      'Suppose your bank balance is ₹0, and you borrow ₹50 from a friend for lunch. How could we write your financial position using a number, and what does 0 mean here?',
    openingVisualHint: {
      type: 'bank_ledger',
      start: 0,
      addend: -50,
      unit: '₹',
      labelA: 'Starting balance',
      labelB: 'Borrowed for lunch',
      caption: 'Explore balance vs debt around ₹0.',
    },
    accentColor: '#E11D48',
    conceptIds: [
      'zero-reference-point',
      'debt-and-negatives',
      'comparing-negatives',
      'adding-signed-numbers',
    ],
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Number Line Exploration',
    subtitle: 'Direction, distance, and crossing zero',
    description:
      'Turn addition into movement! See why adding positive numbers walks right, adding negative numbers walks left, and how jumps cross zero.',
    openingQuestion:
      'Imagine standing at -5 on the number line below. If you add +7, which direction will you walk, and where do you think you will land?',
    openingVisualHint: {
      type: 'number_line',
      start: -5,
      addend: 7,
      caption: 'Try moving from -5 by +7 on the interactive number line!',
    },
    accentColor: '#4F46E5',
    conceptIds: ['number-line-direction', 'crossing-zero'],
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Discovering Hidden Patterns',
    subtitle: 'Uncovering the deeper laws of combining numbers',
    description:
      'Experiment with order, grouping, zero, and opposites. Discover why these patterns always hold before ever hearing their formal names.',
    openingQuestion:
      'Suppose you earn ₹4 in the morning and ₹9 in the evening. Your friend earns ₹9 in the morning and ₹4 in the evening. Will either of you end up with more money, and why?',
    openingVisualHint: {
      type: 'property_tiles',
      groupA: 4,
      groupB: 9,
      unit: '₹',
      caption: 'Compare the two orders without rushing to any rule.',
    },
    accentColor: '#7C3AED',
    conceptIds: [
      'order-independence',
      'grouping-independence',
      'additive-identity',
      'additive-inverse',
    ],
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Real-World Mastery',
    subtitle: 'Shopping, temperature, elevation, and knowing when to add',
    description:
      'Apply everything you discovered to multi-step everyday situations — and learn to spot traps where addition is NOT the right tool.',
    openingQuestion:
      'A mountain camp starts the morning at -4°C. By noon the temperature rises by 9°C, and by midnight it drops by 7°C. How would you track the temperature step by step?',
    openingVisualHint: {
      type: 'elevation_temp',
      start: -4,
      addend: 9,
      groupC: -7,
      unit: '°C',
      caption: 'Track temperature swings above and below 0°C.',
    },
    accentColor: '#059669',
    conceptIds: [
      'real-world-modeling',
      'multi-step-reasoning',
      'addition-appropriateness',
    ],
  },
];

export const CONCEPTS: ConceptDefinition[] = [
  // Stage 1
  {
    id: 'need-for-addition',
    stageId: 'stage-1',
    mysteryTitle: 'Why Combine Separate Amounts?',
    discoveredTitle: 'Combining Separate Quantities',
    intuitionSummary:
      'Addition lets us find the total of separate groups without losing track of where each piece came from.',
    realWorldExample: 'Putting 3 pocket chocolates and 2 gifted chocolates into one total count.',
    prerequisites: [],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Confusing total with only the newly added group'],
  },
  {
    id: 'counting-on',
    stageId: 'stage-1',
    mysteryTitle: 'A Faster Way to Count',
    discoveredTitle: 'Counting Forward (Counting On)',
    intuitionSummary:
      'Once you already know a group has 18 items, you do not need to recount from 1 — you can continue forward from 18.',
    realWorldExample: 'Starting at 18 chocolates and counting 19, 20, 21, 22, 23.',
    prerequisites: ['need-for-addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking you must recount every object from 1'],
  },
  {
    id: 'when-to-combine',
    stageId: 'stage-1',
    mysteryTitle: 'Can Anything Be Combined?',
    discoveredTitle: 'Meaningful Combination',
    intuitionSummary:
      'Addition makes sense only when quantities share a meaningful common group or unit (like total fruits, not apples + shoe size).',
    realWorldExample: '3 apples + 2 oranges = 5 fruits, whereas 3 apples + 10 years old makes no sense.',
    prerequisites: ['need-for-addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Blindly adding any two numbers that appear in a story'],
  },
  {
    id: 'zero-no-change',
    stageId: 'stage-1',
    mysteryTitle: 'The Mystery of Adding Nothing',
    discoveredTitle: 'Zero Leaves a Quantity Unchanged',
    intuitionSummary:
      'Adding 0 means combining a group with an empty group — nothing enters and nothing leaves, so the count stays identical.',
    realWorldExample: '7 chocolates plus an empty box of 0 chocolates is still 7 chocolates.',
    prerequisites: ['need-for-addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking adding 0 makes 0 or changes the number'],
  },

  // Stage 2
  {
    id: 'abstract-quantities',
    stageId: 'stage-2',
    mysteryTitle: 'Combining Invisible Things',
    discoveredTitle: 'Adding Non-Physical Quantities',
    intuitionSummary:
      'Even when quantities are separated in time or invisible (kilometers, minutes, rupees), addition tracks the combined measure.',
    realWorldExample: 'Walking 4 km in the morning and 3 km at night equals 7 km walked today.',
    prerequisites: ['counting-on', 'when-to-combine'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking addition only works for touchable objects'],
  },
  {
    id: 'context-matters',
    stageId: 'stage-2',
    mysteryTitle: 'Why Labels & Units Matter',
    discoveredTitle: 'Context & Unit Consistency',
    intuitionSummary:
      'The numbers alone do not tell the story — units must align or translate into a shared meaning before adding.',
    realWorldExample: '500 meters + 1 kilometer requires matching units before combining.',
    prerequisites: ['abstract-quantities', 'when-to-combine'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Adding 500 m + 1 km to get 501'],
  },
  {
    id: 'non-increasing-addition',
    stageId: 'stage-2',
    mysteryTitle: 'Does Adding Always Make Bigger?',
    discoveredTitle: 'Addition Can Decrease or Balance',
    intuitionSummary:
      'Adding a loss, drop, or debt to a situation combines the effects — which can reduce the total rather than increase it.',
    realWorldExample: 'Adding a ₹30 expense or a 4°C drop in temperature lowers the total.',
    prerequisites: ['abstract-quantities', 'zero-no-change'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Believing addition always makes the result larger'],
  },

  // Stage 3
  {
    id: 'zero-reference-point',
    stageId: 'stage-3',
    mysteryTitle: 'What Does Zero Actually Stand For?',
    discoveredTitle: 'Zero as a Reference Point',
    intuitionSummary:
      'Zero is not just "nothing" — it is a neutral starting line (sea level, freezing point, break-even ₹0) separating surplus from deficit.',
    realWorldExample: '₹0 means neither having spare cash nor owing anyone.',
    prerequisites: ['zero-no-change', 'non-increasing-addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking 0 is the smallest possible number'],
  },
  {
    id: 'debt-and-negatives',
    stageId: 'stage-3',
    mysteryTitle: 'Numbers Below Zero',
    discoveredTitle: 'Negative Values & Debt',
    intuitionSummary:
      'Negative numbers represent positions below the reference point — such as owing money, depth below sea level, or sub-zero cold.',
    realWorldExample: 'Owing ₹50 means a balance of -50.',
    prerequisites: ['zero-reference-point'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking negative numbers are impossible or unreal'],
  },
  {
    id: 'comparing-negatives',
    stageId: 'stage-3',
    mysteryTitle: 'Which Debt Is Better: -1 or -100?',
    discoveredTitle: 'Magnitude vs. Value Below Zero',
    intuitionSummary:
      'Although 100 is larger in size than 1, owing ₹100 (-100) puts you further below zero than owing ₹1 (-1), so -1 > -100.',
    realWorldExample: 'A friend owing ₹1 is closer to ₹0 (better off) than someone owing ₹100.',
    prerequisites: ['debt-and-negatives'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: [
      'Thinking -100 is greater than -1 because 100 > 1',
      'Thinking all negative numbers are equally small',
    ],
  },
  {
    id: 'adding-signed-numbers',
    stageId: 'stage-3',
    mysteryTitle: 'When Savings Meet Debt',
    discoveredTitle: 'Combining Positive & Negative Values',
    intuitionSummary:
      'Combining a positive amount and a negative amount partially or fully cancels out, leaving whichever side has more.',
    realWorldExample: 'Owing ₹50 (-50) and earning ₹80 (+80) pays off the debt and leaves +₹30.',
    prerequisites: ['comparing-negatives'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Adding magnitudes without cancelling opposite directions'],
  },

  // Stage 4
  {
    id: 'number-line-direction',
    stageId: 'stage-4',
    mysteryTitle: 'Turning Numbers Into Steps',
    discoveredTitle: 'Direction on the Number Line',
    intuitionSummary:
      'Adding a positive number moves right (toward greater values); adding a negative number moves left (toward lesser values).',
    realWorldExample: 'Starting at 2 and adding -5 takes 5 steps left to -3.',
    prerequisites: ['adding-signed-numbers'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Always moving right whenever the operation is addition'],
  },
  {
    id: 'crossing-zero',
    stageId: 'stage-4',
    mysteryTitle: 'Walking Past Zero',
    discoveredTitle: 'Crossing Zero During Addition',
    intuitionSummary:
      'A jump can spend part of its steps reaching zero and the remaining steps continuing onto the other side.',
    realWorldExample: 'From -5, 5 steps reach 0, and 2 more steps land at +2 (-5 + 7 = 2).',
    prerequisites: ['number-line-direction', 'zero-reference-point'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Stopping at zero or miscounting zero as an extra step'],
  },

  // Stage 5 — IMPORTANT: mysteryTitle hides the formal names until discovered!
  {
    id: 'order-independence',
    stageId: 'stage-5',
    mysteryTitle: 'Mystery Pattern 1: Swapping Order',
    discoveredTitle: 'Commutative Property of Addition',
    intuitionSummary:
      'Swapping the order of quantities being combined (a + b = b + a) gives the exact same total, even with negative numbers.',
    realWorldExample: 'Walking 4 steps right then 9 steps right lands at the same spot as 9 then 4.',
    prerequisites: ['crossing-zero'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Thinking order changes the sum when negatives are involved'],
  },
  {
    id: 'grouping-independence',
    stageId: 'stage-5',
    mysteryTitle: 'Mystery Pattern 2: Changing Grouping',
    discoveredTitle: 'Associative Property of Addition',
    intuitionSummary:
      'When combining three or more quantities, grouping the first pair or the last pair first ((a + b) + c = a + (b + c)) never changes the sum.',
    realWorldExample: 'Combining (₹20 + ₹50) + ₹30 gives the same ₹100 as ₹20 + (₹50 + ₹30).',
    prerequisites: ['order-independence'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Confusing grouping order with changing the numbers themselves'],
  },
  {
    id: 'additive-identity',
    stageId: 'stage-5',
    mysteryTitle: 'Mystery Pattern 3: The Unchanging Partner',
    discoveredTitle: 'Additive Identity (Zero)',
    intuitionSummary:
      'Zero is the unique number that leaves every positive or negative number unchanged when added (a + 0 = a).',
    realWorldExample: 'Standing at -6 on the number line and taking 0 steps keeps you at -6.',
    prerequisites: ['zero-no-change', 'number-line-direction'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Thinking -6 + 0 becomes 6 or 0'],
  },
  {
    id: 'additive-inverse',
    stageId: 'stage-5',
    mysteryTitle: 'Mystery Pattern 4: Returning to Zero',
    discoveredTitle: 'Additive Inverse (Opposites)',
    intuitionSummary:
      'Every number has an opposite partner at equal distance on the other side of zero; adding them cancels back to 0 (a + (-a) = 0).',
    realWorldExample: 'Climbing up 8 floors (+8) and going down 8 floors (-8) returns you to ground level (0).',
    prerequisites: ['crossing-zero', 'additive-identity'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Thinking 8 + (-8) equals 16 or -16'],
  },

  // Stage 6
  {
    id: 'real-world-modeling',
    stageId: 'stage-6',
    mysteryTitle: 'Translating Stories Into Jumps',
    discoveredTitle: 'Real-World Signed Modeling',
    intuitionSummary:
      'Everyday gains, drops, elevations, scores, and bills map cleanly onto positive and negative additions around a chosen zero point.',
    realWorldExample: 'A diver at -12 m rising +7 m arrives at -5 m below sea level.',
    prerequisites: ['additive-inverse', 'context-matters'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Losing track of sign direction in word problems'],
  },
  {
    id: 'multi-step-reasoning',
    stageId: 'stage-6',
    mysteryTitle: 'Chaining Changes Together',
    discoveredTitle: 'Multi-Step Change Tracking',
    intuitionSummary:
      'Complex journeys are just sequential or flexibly regrouped additions — you can track step-by-step or group opposites first.',
    realWorldExample: '-4°C + 9°C + (-7°C) = 5°C + (-7°C) = -2°C.',
    prerequisites: ['real-world-modeling', 'grouping-independence'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Dropping intermediate signs across multiple steps'],
  },
  {
    id: 'addition-appropriateness',
    stageId: 'stage-6',
    mysteryTitle: 'Knowing When NOT to Add',
    discoveredTitle: 'Judging When Addition Applies',
    intuitionSummary:
      'True mathematical fluency means recognizing when combining works — and when a problem asks for comparison, repetition, or mismatched units instead.',
    realWorldExample: 'If 4 shirts cost ₹500 each, adding 4 + 500 makes no sense.',
    prerequisites: ['real-world-modeling', 'when-to-combine'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Adding every number given in a word problem automatically'],
  },
];

export const BADGES: BadgeDefinition[] = [
  {
    id: 'why-seeker',
    title: 'Curious Questioner',
    description: 'Asked "Why?" to look beneath the surface of an idea.',
    criteria: 'Ask at least 2 curiosity questions ("Why?").',
    icon: 'Compass',
    color: 'amber',
  },
  {
    id: 'reasoning-voice',
    title: 'Reasoning Voice',
    description: 'Explained your thinking in your own words instead of just giving a number.',
    criteria: 'Share 3 thoughtful reasoning explanations.',
    icon: 'MessageSquareHeart',
    color: 'teal',
  },
  {
    id: 'self-corrector',
    title: 'Plot Twist Thinker',
    description: 'Refined an assumption after testing a counterexample!',
    criteria: 'Resolve a misconception through Socratic dialogue.',
    icon: 'Sparkles',
    color: 'rose',
  },
  {
    id: 'zero-explorer',
    title: 'Zero Navigator',
    description: 'Discovered how zero works both as "nothing added" and as a reference point.',
    criteria: 'Discover both Zero Leaves Unchanged and Zero as a Reference Point.',
    icon: 'CircleDot',
    color: 'indigo',
  },
  {
    id: 'pattern-discoverer',
    title: 'Pattern Architect',
    description: 'Uncovered a hidden mathematical law on your own before seeing its name.',
    criteria: 'Discover 2 concepts in Stage 5 (Hidden Patterns).',
    icon: 'Shapes',
    color: 'violet',
  },
  {
    id: 'addition-master',
    title: 'Addition Philosopher',
    description: 'Built deep, connected understanding across all 6 stages of the journey.',
    criteria: 'Discover at least 12 concepts across the map.',
    icon: 'Award',
    color: 'emerald',
  },
];

export function getDailyChallenge(dateKey: string, completedDate: string | null): ChallengeItem {
  const pool: Array<Omit<ChallengeItem, 'completed'>> = [
    {
      id: 'daily-elevator',
      kind: 'daily',
      title: 'The Underground Elevator',
      prompt:
        'An elevator starts 3 floors below ground (-3). It goes up 7 floors, then down 6 floors. Without rushing to a formula, where do you think it stops and why?',
      stageId: 'stage-4',
      visualHint: {
        type: 'number_line',
        start: -3,
        addend: 7,
        caption: 'Trace the elevator from -3 up 7 floors, then down 6.',
      },
    },
    {
      id: 'daily-debt-swap',
      kind: 'daily',
      title: 'The Two Wallets Puzzle',
      prompt:
        'Asha has ₹20 and owes ₹35. Ravi owes ₹35 and then earns ₹20. Who ends up better off, and what does that tell you about the order of combining?',
      stageId: 'stage-5',
      visualHint: {
        type: 'bank_ledger',
        start: 20,
        addend: -35,
        unit: '₹',
        labelA: 'Cash',
        labelB: 'Debt',
        caption: 'Test whether order changes the final balance.',
      },
    },
    {
      id: 'daily-trick-story',
      kind: 'daily',
      title: 'The Sneaky Story Trap',
      prompt:
        'A bus leaves at 8 AM with 14 passengers. At the first stop, 5 more get on. The bus travels 12 km. Someone tries to find the total by doing 14 + 5 + 12. Would you agree with them? Why or why not?',
      stageId: 'stage-2',
      visualHint: {
        type: 'context_blocks',
        groupA: 14,
        groupB: 5,
        unit: 'people',
        labelA: 'On bus',
        labelB: 'Got on',
        caption: 'Should 12 km be added to passengers?',
      },
    },
  ];
  const dayNum = parseInt(dateKey.replace(/-/g, ''), 10) || 0;
  const pick = pool[dayNum % pool.length];
  return {
    ...pick,
    completed: completedDate === dateKey,
  };
}

export function getWeeklyChallenge(completed: boolean): ChallengeItem {
  return {
    id: 'weekly-zero-journey',
    kind: 'weekly',
    title: 'Weekly Reasoning Challenge: The Zero Return',
    prompt:
      'A submarine dives to -18 meters, rises 11 meters, then dives 5 meters. What single movement from there would bring it right back to sea level (0 meters), and how can you prove it?',
    stageId: 'stage-6',
    visualHint: {
      type: 'elevation_temp',
      start: -18,
      addend: 11,
      groupC: -5,
      unit: 'm',
      caption: 'Submarine depth relative to sea level (0 m).',
    },
    completed,
  };
}

export function getStageById(stageId: StageId): StageDefinition {
  return STAGES.find((s) => s.id === stageId) ?? STAGES[0];
}

export function getConceptById(conceptId: string): ConceptDefinition | undefined {
  return CONCEPTS.find((c) => c.id === conceptId);
}
