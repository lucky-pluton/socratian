import type {
  BadgeDefinition,
  ChallengeItem,
  ConceptDefinition,
  SequentialQuestion,
  StageDefinition,
  StageId,
  TopicLearningProgress,
} from '../src/types/socratic.js';

export const DEFAULT_TOPIC = 'Addition';

export const STAGES: StageDefinition[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Why Addition Exists',
    subtitle: 'Combining quantities and counting forward efficiently',
    description:
      'Discover why we combine quantities and how counting forward saves recounting everything from 1.',
    learningObjective:
      'Understand that addition combines separate quantities and counting forward avoids recounting known totals.',
    expectedDiscovery:
      'Addition helps us combine quantities and calculate totals efficiently.',
    progressionCriteria:
      'Complete Questions 1–4 by finding totals and explaining how counting forward works.',
    openingQuestion:
      'A shopkeeper gives you two chocolates and then two more. How many chocolates do you have?',
    openingVisualHint: {
      type: 'chocolates',
      groupA: 2,
      groupB: 2,
      labelA: 'First chocolates',
      labelB: 'Two more',
      caption: 'Explore the two groups of chocolates.',
    },
    accentColor: '#D97706',
    conceptIds: ['combining_quantities', 'counting_forward'],
    questionIds: [1, 2, 3, 4],
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Understanding What Can Be Added',
    subtitle: 'Relevance, matching categories, and context',
    description:
      'Explore when quantities belong together and why combining mismatched things breaks meaning.',
    learningObjective:
      'Recognize that we only combine quantities relevant to the same question and context.',
    expectedDiscovery: 'We combine quantities relevant to the same question.',
    progressionCriteria:
      'Complete Questions 5–7 by distinguishing matching quantities from irrelevant ones.',
    openingQuestion:
      'If you and your friend have separate collections of books, can you calculate the total number of books?',
    openingVisualHint: {
      type: 'context_blocks',
      groupA: 5,
      groupB: 4,
      unit: 'books',
      labelA: 'Your books',
      labelB: "Friend's books",
      caption: 'Check whether both quantities belong to the same question.',
    },
    accentColor: '#0D9488',
    conceptIds: ['relevant_quantities'],
    questionIds: [5, 6, 7],
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Zero and Addition',
    subtitle: 'Adding nothing and understanding identity',
    description:
      'Examine what happens when zero is added and whether an addition still occurred.',
    learningObjective:
      'Understand that adding zero leaves a quantity unchanged while still being a valid addition.',
    expectedDiscovery: 'Adding zero does not change a number.',
    progressionCriteria:
      'Complete Questions 8–9 with clear reasoning about why zero leaves amounts unchanged.',
    openingQuestion:
      'If you have 5 chocolates and receive zero more, what happens?',
    openingVisualHint: {
      type: 'chocolates',
      groupA: 5,
      groupB: 0,
      labelA: 'Your chocolates (5)',
      labelB: 'Received (0)',
      caption: 'Notice what happens when you combine 5 with 0.',
    },
    accentColor: '#0284C7',
    conceptIds: ['zero_identity'],
    questionIds: [8, 9],
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Changing the Order',
    subtitle: 'Exploring whether order alters the combined total',
    description:
      'Test swapping the order of two quantities and uncover why the total stays identical.',
    learningObjective:
      'Discover independently that swapping the order of two addends does not change the sum.',
    expectedDiscovery: 'Commutative property.',
    progressionCriteria:
      'Complete Questions 10–12 by verifying both orders and explaining why the sum is unchanged.',
    openingQuestion:
      'What happens if you add 3 chocolates and then 4?',
    openingVisualHint: {
      type: 'property_tiles',
      groupA: 3,
      groupB: 4,
      unit: 'chocolates',
      caption: 'Test combining 3 and 4, then compare orders.',
    },
    accentColor: '#7C3AED',
    conceptIds: ['commutative_property'],
    questionIds: [10, 11, 12],
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Changing the Grouping',
    subtitle: 'Combining three collections in different groupings',
    description:
      'Experiment with grouping the first pair vs. the last pair of three collections.',
    learningObjective:
      'Discover independently that changing how addends are grouped never changes the total.',
    expectedDiscovery: 'Associative property.',
    progressionCriteria:
      'Complete Questions 13–16 and explain why regrouping leaves the total intact.',
    openingQuestion:
      'Imagine three collections containing 2, 3, and 4 objects. How many objects are there altogether?',
    openingVisualHint: {
      type: 'property_tiles',
      groupA: 2,
      groupB: 3,
      groupC: 4,
      unit: 'objects',
      caption: 'Explore three collections: 2, 3, and 4.',
    },
    accentColor: '#9333EA',
    conceptIds: ['associative_property'],
    questionIds: [13, 14, 15, 16],
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Understanding Negative Numbers',
    subtitle: 'Debt, owing money, and values below zero',
    description:
      'Use financial balances to understand values below zero and compare negative numbers.',
    learningObjective:
      'Represent debt below zero and distinguish mathematical value from digit size (-3 > -8).',
    expectedDiscovery: 'Negative numbers represent values below zero.',
    progressionCriteria:
      'Complete Questions 17–20 and justify why -3 is mathematically greater than -8.',
    openingQuestion:
      'Imagine you have ₹5 but owe ₹8. What is your financial position?',
    openingVisualHint: {
      type: 'bank_ledger',
      start: 5,
      addend: -8,
      unit: '₹',
      labelA: 'Cash you have',
      labelB: 'Amount owed',
      caption: 'Explore having ₹5 while owing ₹8.',
    },
    accentColor: '#E11D48',
    conceptIds: ['negative_numbers', 'negative_comparison'],
    questionIds: [17, 18, 19, 20],
  },
  {
    id: 'stage-7',
    number: 7,
    title: 'Adding Positive and Negative Numbers',
    subtitle: 'Combining gains, spending, and clearing debt',
    description:
      'See how adding directed quantities can yield positive, negative, or zero results.',
    learningObjective:
      'Understand addition as combining directed quantities rather than only physical collections.',
    expectedDiscovery:
      'Addition combines directed quantities, not just physical collections.',
    progressionCriteria:
      'Complete Questions 21–24 with clear explanations of cancellation and zero.',
    openingQuestion:
      'If you have ₹5 and spend ₹8, how could you represent this using addition?',
    openingVisualHint: {
      type: 'bank_ledger',
      start: 5,
      addend: -8,
      unit: '₹',
      labelA: 'Have ₹5',
      labelB: 'Spend ₹8',
      caption: 'Represent spending as adding a negative amount.',
    },
    accentColor: '#DB2777',
    conceptIds: ['directed_addition', 'zero_balance'],
    questionIds: [21, 22, 23, 24],
  },
  {
    id: 'stage-8',
    number: 8,
    title: 'Number Line',
    subtitle: 'Movement direction and crossing zero',
    description:
      'Connect positive and negative addition to rightward and leftward movement on a number line.',
    learningObjective:
      'Visualize positive addition as moving right, negative addition as moving left, and track crossing zero.',
    expectedDiscovery:
      'Positive addition moves right; negative addition moves left.',
    progressionCriteria:
      'Complete Questions 25–28 accurately, explaining what happens when crossing zero.',
    openingQuestion:
      'Why might adding a negative number mean moving left?',
    openingVisualHint: {
      type: 'number_line',
      start: 0,
      addend: -4,
      caption: 'Watch how negative steps move left on the number line.',
    },
    accentColor: '#4F46E5',
    conceptIds: ['number_line_direction', 'crossing_zero'],
    questionIds: [25, 26, 27, 28],
  },
  {
    id: 'stage-9',
    number: 9,
    title: 'Opposites and Zero',
    subtitle: 'Canceling debts and equal opposite jumps',
    description:
      'Discover how opposite numbers cancel to zero regardless of the order you add them.',
    learningObjective:
      'Discover additive inverses and recognize that commutativity still holds with negatives.',
    expectedDiscovery: 'Additive inverse and commutativity.',
    progressionCriteria:
      'Complete Questions 29–31 and explain why -5 + 5 and 5 + (-5) both give 0.',
    openingQuestion:
      'What happens when you owe ₹5 and receive ₹5?',
    openingVisualHint: {
      type: 'bank_ledger',
      start: -5,
      addend: 5,
      unit: '₹',
      labelA: 'Owe ₹5 (-5)',
      labelB: 'Receive ₹5 (+5)',
      caption: 'See what happens when an opposite amount arrives.',
    },
    accentColor: '#2563EB',
    conceptIds: ['additive_inverse'],
    questionIds: [29, 30, 31],
  },
  {
    id: 'stage-10',
    number: 10,
    title: 'Independent Application',
    subtitle: 'Unfamiliar real-world modeling and critical judgment',
    description:
      'Decide which quantities matter, how to represent them, and why the answer makes sense.',
    learningObjective:
      'Apply addition independently to unfamiliar real-world scenarios and filter out irrelevant quantities.',
    expectedDiscovery:
      'Real-world modeling requires selecting relevant quantities, choosing the right signed addition, and verifying sense.',
    progressionCriteria:
      'Complete Questions 32–34 by modeling each scenario and justifying relevance and meaning.',
    openingQuestion:
      'A mountain camp starts at -4°C, warms up by 9°C by noon, and then drops 7°C by midnight. Which quantities are relevant, how would you represent this using addition, and why does your result make sense?',
    openingVisualHint: {
      type: 'elevation_temp',
      start: -4,
      addend: 9,
      groupC: -7,
      unit: '°C',
      caption: 'Track the mountain camp temperature across zero.',
    },
    accentColor: '#059669',
    conceptIds: ['real_world_modeling', 'operation_appropriateness'],
    questionIds: [32, 33, 34],
  },
];

export const CONCEPTS: ConceptDefinition[] = [
  {
    id: 'combining_quantities',
    stageId: 'stage-1',
    mysteryTitle: 'Why Combine Separate Groups?',
    discoveredTitle: 'Combining Quantities',
    intuitionSummary:
      'Addition joins separate quantities together to find a combined total.',
    realWorldExample: '2 chocolates plus 2 more chocolates makes 4 chocolates.',
    prerequisites: [],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Confusing total with only the newly given items'],
  },
  {
    id: 'counting_forward',
    stageId: 'stage-1',
    mysteryTitle: 'Skipping the Recount',
    discoveredTitle: 'Counting Forward',
    intuitionSummary:
      'When one group is already counted (like 18), counting forward avoids recounting everything from 1.',
    realWorldExample: 'Starting at 18 and counting 19, 20, 21, 22, 23.',
    prerequisites: ['combining_quantities'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking you must always recount from 1'],
  },
  {
    id: 'relevant_quantities',
    stageId: 'stage-2',
    mysteryTitle: 'What Belongs Together?',
    discoveredTitle: 'Relevant Quantities & Context',
    intuitionSummary:
      'We only combine quantities that belong to the same question and share a meaningful category.',
    realWorldExample: 'Books + books gives total books, whereas books + balloons does not.',
    prerequisites: ['combining_quantities'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Adding unrelated numbers just because they appear together'],
  },
  {
    id: 'zero_identity',
    stageId: 'stage-3',
    mysteryTitle: 'Adding Nothing at All',
    discoveredTitle: 'Zero and Addition',
    intuitionSummary:
      'Adding zero is still a valid addition operation, and it leaves the starting quantity unchanged.',
    realWorldExample: '5 chocolates + 0 chocolates = 5 chocolates.',
    prerequisites: ['combining_quantities'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking +0 turns the number into 0 or means no operation happened'],
  },
  {
    id: 'commutative_property',
    stageId: 'stage-4',
    mysteryTitle: 'Mystery Pattern: Swapping Order',
    discoveredTitle: 'Commutative Property',
    intuitionSummary:
      'Swapping the order of two numbers being added (3 + 4 vs 4 + 3) leaves the sum unchanged because the same quantities are combined.',
    realWorldExample: '3 chocolates + 4 chocolates equals 4 chocolates + 3 chocolates.',
    prerequisites: ['combining_quantities'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Thinking order changes the combined total'],
  },
  {
    id: 'associative_property',
    stageId: 'stage-5',
    mysteryTitle: 'Mystery Pattern: Changing Grouping',
    discoveredTitle: 'Associative Property',
    intuitionSummary:
      'Grouping the first two collections or the last two collections first ((2 + 3) + 4 vs 2 + (3 + 4)) leaves the final total unchanged.',
    realWorldExample: 'Combining (2 + 3) + 4 or 2 + (3 + 4) always yields 9 objects.',
    prerequisites: ['commutative_property'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Believing grouping changes which objects are included'],
  },
  {
    id: 'negative_numbers',
    stageId: 'stage-6',
    mysteryTitle: 'Balances Below Zero',
    discoveredTitle: 'Negative Numbers',
    intuitionSummary:
      'Negative numbers represent values below zero, such as owing money when debt exceeds cash.',
    realWorldExample: 'Having ₹5 while owing ₹8 puts you at -3.',
    prerequisites: ['zero_identity'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking values cannot go below zero'],
  },
  {
    id: 'negative_comparison',
    stageId: 'stage-6',
    mysteryTitle: 'Comparing Two Debts',
    discoveredTitle: 'Comparing Negative Values',
    intuitionSummary:
      'Further below zero means a smaller mathematical value: -3 is greater than -8 because owing ₹3 is better than owing ₹8.',
    realWorldExample: 'Owing ₹3 (-3) is closer to ₹0 than owing ₹8 (-8), so -3 > -8.',
    prerequisites: ['negative_numbers'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking -8 > -3 because 8 > 3'],
  },
  {
    id: 'directed_addition',
    stageId: 'stage-7',
    mysteryTitle: 'Combining Gains & Losses',
    discoveredTitle: 'Directed Addition',
    intuitionSummary:
      'Addition combines directed quantities (gains and debts), which can produce a positive, negative, or zero outcome.',
    realWorldExample: '5 + (-8) = -3, while -3 + 7 = 4.',
    prerequisites: ['negative_comparison'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Thinking addition always makes a number larger'],
  },
  {
    id: 'zero_balance',
    stageId: 'stage-7',
    mysteryTitle: 'When Debt Clears',
    discoveredTitle: 'Zero as Cleared Balance',
    intuitionSummary:
      'When gains and debts exactly balance out, zero represents being debt-free and even.',
    realWorldExample: 'Owing ₹5 (-5) and receiving ₹5 (+5) clears the debt to 0.',
    prerequisites: ['directed_addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Treating zero only as empty objects rather than balanced state'],
  },
  {
    id: 'number_line_direction',
    stageId: 'stage-8',
    mysteryTitle: 'Direction of Movement',
    discoveredTitle: 'Number Line Direction',
    intuitionSummary:
      'On a number line, adding a positive number moves right (increasing) and adding a negative number moves left (decreasing).',
    realWorldExample: 'Starting at -5 and adding +3 moves 3 steps right to -2.',
    prerequisites: ['directed_addition'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Always moving right when adding'],
  },
  {
    id: 'crossing_zero',
    stageId: 'stage-8',
    mysteryTitle: 'Crossing Zero on the Line',
    discoveredTitle: 'Crossing Zero',
    intuitionSummary:
      'Part of a jump moves from the negative side up to zero, and the remaining steps cross into positive values (or vice versa).',
    realWorldExample: 'From -5, 5 steps of +7 reach 0 and 2 more land at +2.',
    prerequisites: ['number_line_direction'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Stopping at zero or miscounting zero'],
  },
  {
    id: 'additive_inverse',
    stageId: 'stage-9',
    mysteryTitle: 'Mystery Pattern: Opposites Returning to Zero',
    discoveredTitle: 'Additive Inverse',
    intuitionSummary:
      'A number and its opposite (like 5 and -5) sit equal distances from zero and always sum to 0 in either order.',
    realWorldExample: '-5 + 5 = 0 and 5 + (-5) = 0.',
    prerequisites: ['crossing_zero', 'commutative_property'],
    revealNameAfterDiscovery: true,
    keyMisconceptions: ['Thinking -5 + 5 equals 10 or -10'],
  },
  {
    id: 'real_world_modeling',
    stageId: 'stage-10',
    mysteryTitle: 'Modeling Unfamiliar Situations',
    discoveredTitle: 'Independent Real-World Modeling',
    intuitionSummary:
      'Real-world problems require translating changes into positive and negative additions and checking if the result fits reality.',
    realWorldExample: '-4°C + 9°C + (-7°C) = -2°C.',
    prerequisites: ['additive_inverse'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Dropping signs across multi-step stories'],
  },
  {
    id: 'operation_appropriateness',
    stageId: 'stage-10',
    mysteryTitle: 'Filtering Relevant Quantities',
    discoveredTitle: 'Choosing Relevant Quantities',
    intuitionSummary:
      'Before adding, decide which numbers answer the actual question and ignore distractors.',
    realWorldExample: 'Counting passengers: add 14 + 5 people, ignore 12 km distance.',
    prerequisites: ['real_world_modeling', 'relevant_quantities'],
    revealNameAfterDiscovery: false,
    keyMisconceptions: ['Adding every number in a word problem'],
  },
];

export const SEQUENTIAL_QUESTIONS: SequentialQuestion[] = [
  // Stage 1: Why Addition Exists
  {
    id: 1,
    stageId: 'stage-1',
    stageNumber: 1,
    conceptId: 'combining_quantities',
    prompt:
      'A shopkeeper gives you two chocolates and then two more. How many chocolates do you have?',
    learningObjective: 'Find the total of two small separate quantities.',
    expectedDiscovery: 'Two chocolates and two more combine to 4 chocolates.',
    requiresReasoning: false, // Q2 explicitly asks how they calculated it
    acceptedNumbers: [4],
    reasoningKeywords: ['2', 'two', 'count', 'combine', 'add', 'together', 'more'],
    misconceptions: [
      {
        id: 'only_second_group',
        label: 'Counted only the newly added chocolates instead of both groups',
        keywords: ['only 2', 'two left'],
        wrongNumbers: [2],
        simplerExamplePrompt:
          'Wait — you already had 2 chocolates in one hand, and the shopkeeper put 2 more in your other hand. If you look at BOTH hands together, how many chocolates are there?',
      },
    ],
    adaptiveHint:
      'Picture holding 2 chocolates in your left hand and 2 new chocolates in your right hand — count them all together.',
    visualHint: {
      type: 'chocolates',
      groupA: 2,
      groupB: 2,
      labelA: 'First chocolates',
      labelB: 'Two more',
      caption: '2 chocolates and 2 more.',
    },
  },
  {
    id: 2,
    stageId: 'stage-1',
    stageNumber: 1,
    conceptId: 'combining_quantities',
    prompt: 'How did you calculate the total?',
    learningObjective: 'Articulate the act of combining or counting two groups.',
    expectedDiscovery: 'We combine or count both quantities together to get 4.',
    requiresReasoning: true,
    reasoningKeywords: [
      'count',
      'combine',
      'add',
      'put',
      'together',
      'plus',
      '2',
      'two',
      'after',
      'finger',
      'both',
      'start',
    ],
    misconceptions: [],
    adaptiveHint:
      'Think about what your mind or fingers did with the first 2 chocolates and the next 2 chocolates.',
    visualHint: {
      type: 'chocolates',
      groupA: 2,
      groupB: 2,
      labelA: 'First 2',
      labelB: 'Next 2',
    },
  },
  {
    id: 3,
    stageId: 'stage-1',
    stageNumber: 1,
    conceptId: 'counting_forward',
    prompt:
      'If you already counted 18 objects and receive 5 more, must you count everything again?',
    learningObjective: 'Recognize that an already counted group does not need recounting from 1.',
    expectedDiscovery: 'No — you already know there are 18, so you only count the new 5 forward.',
    requiresReasoning: true,
    acceptedBoolean: 'no',
    reasoningKeywords: [
      'already',
      'know',
      '18',
      'forward',
      'on',
      'continue',
      'skip',
      'save',
      'from',
      '19',
      '23',
      'need',
    ],
    misconceptions: [
      {
        id: 'recount_from_one',
        label: 'Believes you must recount all 18 objects from 1',
        keywords: ['yes', 'count all', 'from 1', 'from one', 'start over'],
        simplerExamplePrompt:
          'Suppose 18 chocolates are already sealed in a jar with "18" written on it. If you drop 1 new chocolate next to the jar, what number comes right after 18 without opening the jar?',
      },
    ],
    adaptiveHint:
      'Since you already verified there are 18 in the first pile, what is the very next number after 18?',
    visualHint: {
      type: 'chocolates',
      groupA: 18,
      groupB: 5,
      labelA: 'Already counted (18)',
      labelB: '5 more',
      caption: 'Do you need to recount the 18 from 1?',
    },
  },
  {
    id: 4,
    stageId: 'stage-1',
    stageNumber: 1,
    conceptId: 'counting_forward',
    prompt: 'Can you explain how counting forward helps?',
    learningObjective: 'Explain efficiency and accuracy of counting on from a known amount.',
    expectedDiscovery:
      'Addition helps us combine quantities and calculate totals efficiently.',
    requiresReasoning: true,
    reasoningKeywords: [
      'fast',
      'save',
      'time',
      'easy',
      'already',
      'start',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      'recount',
      'continue',
      'forward',
      'step',
      'next',
      'combine',
      'effort',
    ],
    misconceptions: [],
    adaptiveHint:
      'Compare counting 23 items one by one from 1 versus starting at 18 and counting 19, 20, 21, 22, 23.',
    visualHint: {
      type: 'chocolates',
      groupA: 18,
      groupB: 5,
      labelA: 'Start at 18',
      labelB: 'Count forward 5',
    },
  },

  // Stage 2: Understanding What Can Be Added
  {
    id: 5,
    stageId: 'stage-2',
    stageNumber: 2,
    conceptId: 'relevant_quantities',
    prompt:
      'If you and your friend have separate collections of books, can you calculate the total number of books?',
    learningObjective: 'Confirm two separate groups of the same kind of object can be combined.',
    expectedDiscovery: 'Yes, because both collections count books.',
    requiresReasoning: true,
    acceptedBoolean: 'yes',
    reasoningKeywords: [
      'same',
      'both',
      'book',
      'combine',
      'add',
      'total',
      'together',
      'count',
      'type',
      'kind',
    ],
    misconceptions: [
      {
        id: 'cannot_combine_separate_owners',
        label: 'Thought separate owners cannot be combined into one total',
        keywords: ['no', 'separate', "can't", 'cannot'],
        simplerExamplePrompt:
          'Suppose you put your 3 books and your friend’s 4 books onto the same shelf for a moment to count how many books are in the room. Are they still all books?',
      },
    ],
    adaptiveHint: 'Ask yourself what both your collection and your friend’s collection are made of.',
    visualHint: {
      type: 'context_blocks',
      groupA: 5,
      groupB: 4,
      unit: 'books',
      labelA: 'Your books',
      labelB: "Friend's books",
    },
  },
  {
    id: 6,
    stageId: 'stage-2',
    stageNumber: 2,
    conceptId: 'relevant_quantities',
    prompt:
      "Can you combine your books and your friend's balloons to calculate the total number of books?",
    learningObjective: 'Recognize that unrelated items do not answer the question about books.',
    expectedDiscovery: 'No, because balloons are not books and do not belong to the book total.',
    requiresReasoning: true,
    acceptedBoolean: 'no',
    reasoningKeywords: [
      'differ',
      'not',
      'balloon',
      'book',
      'same',
      'relev',
      'sense',
      'unit',
      'category',
      'only',
      'separate',
    ],
    misconceptions: [
      {
        id: 'add_unrelated_items',
        label: 'Thought any two groups of objects can be added to answer a specific count',
        keywords: ['yes', 'total objects', 'things'],
        simplerExamplePrompt:
          'Wait — if you have 3 books and your friend brings 4 balloons, and you add 3 + 4 = 7, do you suddenly have 7 books to read?',
      },
    ],
    adaptiveHint: 'If you have 3 books and 4 balloons, are there 7 books?',
    visualHint: {
      type: 'context_blocks',
      groupA: 3,
      groupB: 4,
      unit: 'books vs balloons',
      labelA: '3 books',
      labelB: '4 balloons',
    },
  },
  {
    id: 7,
    stageId: 'stage-2',
    stageNumber: 2,
    conceptId: 'relevant_quantities',
    prompt: 'Why does the context of a question matter?',
    learningObjective: 'Explain why we only combine quantities relevant to what is being asked.',
    expectedDiscovery: 'We combine quantities relevant to the same question.',
    requiresReasoning: true,
    reasoningKeywords: [
      'what',
      'ask',
      'same',
      'mean',
      'relev',
      'sense',
      'unit',
      'kind',
      'type',
      'match',
      'know',
      'depend',
      'answer',
      'right',
      'correct',
      'need',
      'group',
    ],
    misconceptions: [],
    adaptiveHint:
      'Think about how the question ("total books" vs "total items for a party") tells you which numbers to include.',
    visualHint: {
      type: 'context_blocks',
      groupA: 3,
      groupB: 4,
      unit: 'context check',
      labelA: 'Relevant',
      labelB: 'Irrelevant',
    },
  },

  // Stage 3: Zero and Addition
  {
    id: 8,
    stageId: 'stage-3',
    stageNumber: 3,
    conceptId: 'zero_identity',
    prompt: 'If you have 5 chocolates and receive zero more, what happens?',
    learningObjective: 'Observe that adding zero leaves the quantity at 5.',
    expectedDiscovery: 'You still have 5 chocolates because nothing was added.',
    requiresReasoning: true,
    acceptedNumbers: [5],
    reasoningKeywords: [
      'same',
      'nothing',
      'unchanged',
      'still',
      'no',
      'none',
      '5',
      'zero',
      'empty',
      'stay',
      'change',
    ],
    misconceptions: [
      {
        id: 'zero_wipes_out',
        label: 'Confused adding zero with multiplying by zero (thinking result becomes 0)',
        keywords: ['becomes 0', 'zero chocolates', 'nothing left'],
        wrongNumbers: [0],
        simplerExamplePrompt:
          'Imagine holding 5 chocolates in your hand while I hand you an empty box with 0 chocolates inside. Did your 5 chocolates disappear, or are they still in your hand?',
      },
    ],
    adaptiveHint: 'Zero more means nobody gave you any extra chocolates — and nobody took any away.',
    visualHint: {
      type: 'chocolates',
      groupA: 5,
      groupB: 0,
      labelA: 'Your hand (5)',
      labelB: 'Empty box (0)',
    },
  },
  {
    id: 9,
    stageId: 'stage-3',
    stageNumber: 3,
    conceptId: 'zero_identity',
    prompt: 'Did the addition operation still happen even though the quantity did not change?',
    learningObjective: 'Recognize that 5 + 0 is still an addition operation even when the output equals the input.',
    expectedDiscovery: 'Adding zero does not change a number.',
    requiresReasoning: true,
    acceptedBoolean: 'yes',
    reasoningKeywords: [
      'yes',
      'still',
      'add',
      'zero',
      '0',
      'combin',
      'nothing',
      'same',
      'change',
      'operat',
      '5 + 0',
      '5+0',
      'didn',
      'amount',
    ],
    misconceptions: [
      {
        id: 'zero_not_addition',
        label: 'Believed addition only counts as happening if the number changes',
        keywords: ['no', "didn't happen", 'not addition'],
        simplerExamplePrompt:
          'If you write down "5 + 0" on paper, we still combined 5 with 0 — just like adding a 0-rupee coin to a ₹5 coin. Does combining with zero still count as doing addition?',
      },
    ],
    adaptiveHint:
      'Think of adding as "combining two amounts" — even when the second amount happens to be 0.',
    visualHint: {
      type: 'chocolates',
      groupA: 5,
      groupB: 0,
      labelA: '5',
      labelB: '+ 0',
    },
  },

  // Stage 4: Changing the Order (DO NOT NAME Commutative Property until Q12 understood!)
  {
    id: 10,
    stageId: 'stage-4',
    stageNumber: 4,
    conceptId: 'commutative_property',
    prompt: 'What happens if you add 3 chocolates and then 4?',
    learningObjective: 'Establish the sum 3 + 4 = 7.',
    expectedDiscovery: 'You get 7 chocolates by combining 3 and 4.',
    requiresReasoning: true,
    acceptedNumbers: [7],
    reasoningKeywords: ['3', '4', '7', 'count', 'combine', 'add', 'together', 'more', 'total'],
    misconceptions: [],
    adaptiveHint: 'Start from 3 chocolates and count forward 4 more.',
    visualHint: {
      type: 'property_tiles',
      groupA: 3,
      groupB: 4,
      unit: 'chocolates',
    },
  },
  {
    id: 11,
    stageId: 'stage-4',
    stageNumber: 4,
    conceptId: 'commutative_property',
    prompt: 'What happens if you add 4 chocolates and then 3?',
    learningObjective: 'Test the reversed order 4 + 3 = 7.',
    expectedDiscovery: 'You still get 7 chocolates, the exact same total.',
    requiresReasoning: true,
    acceptedNumbers: [7],
    reasoningKeywords: ['same', '7', '4', '3', 'combine', 'order', 'equal', 'still', 'count'],
    misconceptions: [],
    adaptiveHint: 'Start with 4 chocolates first, then bring 3 more into the pile.',
    visualHint: {
      type: 'property_tiles',
      groupA: 4,
      groupB: 3,
      unit: 'chocolates',
    },
  },
  {
    id: 12,
    stageId: 'stage-4',
    stageNumber: 4,
    conceptId: 'commutative_property',
    prompt: 'Why is the total unchanged?',
    learningObjective: 'Articulate why order does not affect the sum before hearing the term "Commutative property".',
    expectedDiscovery: 'Commutative property.',
    requiresReasoning: true,
    reasoningKeywords: [
      'same',
      'amount',
      'number',
      'order',
      'matter',
      'swap',
      'switch',
      'both',
      'pile',
      'combine',
      'chocolate',
      'count',
      'appear',
      'disappear',
      'total',
      'change',
    ],
    misconceptions: [],
    adaptiveHint:
      'Think about the physical chocolates in the bowl: did swapping which hand dropped its chocolates first create or remove any chocolate?',
    visualHint: {
      type: 'property_tiles',
      groupA: 3,
      groupB: 4,
      unit: 'chocolates',
    },
  },

  // Stage 5: Changing the Grouping (DO NOT NAME Associative Property until Q16 understood!)
  {
    id: 13,
    stageId: 'stage-5',
    stageNumber: 5,
    conceptId: 'associative_property',
    prompt:
      'Imagine three collections containing 2, 3, and 4 objects. How many objects are there altogether?',
    learningObjective: 'Establish total of three collections (2 + 3 + 4 = 9).',
    expectedDiscovery: 'All three collections combine to 9 objects.',
    requiresReasoning: true,
    acceptedNumbers: [9],
    reasoningKeywords: ['2', '3', '4', '9', 'add', 'combine', 'count', 'total', 'together'],
    misconceptions: [],
    adaptiveHint: 'Combine any two collections first, then bring in the remaining collection.',
    visualHint: {
      type: 'property_tiles',
      groupA: 2,
      groupB: 3,
      groupC: 4,
      unit: 'objects',
    },
  },
  {
    id: 14,
    stageId: 'stage-5',
    stageNumber: 5,
    conceptId: 'associative_property',
    prompt: 'What if you combine the first two collections before adding the third?',
    learningObjective: 'Compute (2 + 3) + 4 = 5 + 4 = 9.',
    expectedDiscovery: 'First 2 + 3 makes 5, and then 5 + 4 makes 9.',
    requiresReasoning: true,
    acceptedNumbers: [9],
    reasoningKeywords: ['5', '9', '2', '3', '4', 'first', 'then', 'combine', 'add'],
    misconceptions: [],
    adaptiveHint: 'Combine 2 and 3 into one group first — how many is that, and what happens when you add 4?',
    visualHint: {
      type: 'property_tiles',
      groupA: 2,
      groupB: 3,
      groupC: 4,
      unit: 'objects',
    },
  },
  {
    id: 15,
    stageId: 'stage-5',
    stageNumber: 5,
    conceptId: 'associative_property',
    prompt: 'What if you combine the last two collections first?',
    learningObjective: 'Compute 2 + (3 + 4) = 2 + 7 = 9.',
    expectedDiscovery: 'Combining 3 + 4 makes 7, and 2 + 7 still makes 9.',
    requiresReasoning: true,
    acceptedNumbers: [9],
    reasoningKeywords: ['7', '9', '2', '3', '4', 'last', 'same', 'then', 'add', 'combine'],
    misconceptions: [],
    adaptiveHint: 'Join the 3 and 4 groups first to get 7, then combine that with 2.',
    visualHint: {
      type: 'property_tiles',
      groupA: 2,
      groupB: 3,
      groupC: 4,
      unit: 'objects',
    },
  },
  {
    id: 16,
    stageId: 'stage-5',
    stageNumber: 5,
    conceptId: 'associative_property',
    prompt: 'Why does the final total remain the same?',
    learningObjective: 'Explain why grouping does not change the sum before naming Associative property.',
    expectedDiscovery: 'Associative property.',
    requiresReasoning: true,
    reasoningKeywords: [
      'same',
      'group',
      'order',
      'matter',
      'object',
      'all',
      'three',
      'still',
      'combine',
      'pair',
      'change',
      'bracket',
      'first',
      'last',
    ],
    misconceptions: [],
    adaptiveHint:
      'Whether you put two bags together first or the other two first, did the objects inside the three bags change?',
    visualHint: {
      type: 'property_tiles',
      groupA: 2,
      groupB: 3,
      groupC: 4,
      unit: 'objects',
    },
  },

  // Stage 6: Understanding Negative Numbers
  {
    id: 17,
    stageId: 'stage-6',
    stageNumber: 6,
    conceptId: 'negative_numbers',
    prompt: 'Imagine you have ₹5 but owe ₹8. What is your financial position?',
    learningObjective: 'Reason about net debt when owed amount exceeds cash.',
    expectedDiscovery: 'After paying the ₹5 you have, you still owe ₹3.',
    requiresReasoning: true,
    acceptedNumbers: [-3, 3],
    reasoningKeywords: ['owe', 'debt', '3', 'less', 'short', 'minus', 'negative', 'pay', 'left', 'below'],
    misconceptions: [
      {
        id: 'added_cash_and_debt',
        label: 'Added 5 + 8 = 13 without distinguishing owning from owing',
        keywords: ['13'],
        wrongNumbers: [13],
        simplerExamplePrompt:
          'Wait — if you owe ₹8 to a friend and hand over all ₹5 you have, do you now have ₹13, or do you still owe some money?',
      },
    ],
    adaptiveHint:
      'If you hand over your ₹5 toward the ₹8 you owe, how much debt is still left?',
    visualHint: {
      type: 'bank_ledger',
      start: 5,
      addend: -8,
      unit: '₹',
      labelA: 'You have ₹5',
      labelB: 'You owe ₹8',
    },
  },
  {
    id: 18,
    stageId: 'stage-6',
    stageNumber: 6,
    conceptId: 'negative_numbers',
    prompt: 'How could you represent this balance mathematically?',
    learningObjective: 'Represent owing ₹3 below zero as -3.',
    expectedDiscovery: 'Write it as -3 to show 3 below zero.',
    requiresReasoning: true,
    acceptedNumbers: [-3],
    reasoningKeywords: ['-3', 'minus', 'negative', 'below', 'zero', 'owe', 'debt', '0'],
    misconceptions: [
      {
        id: 'positive_three_for_debt',
        label: 'Used +3 instead of distinguishing debt below zero',
        keywords: ['+3', 'just 3'],
        wrongNumbers: [3],
        simplerExamplePrompt:
          'If having ₹3 in your pocket is written as +3, how can we tell the difference between *having* ₹3 and *owing* ₹3?',
      },
    ],
    adaptiveHint: 'If having ₹3 is +3 and breaking even is 0, what symbol sits on the opposite side of 0?',
    visualHint: {
      type: 'bank_ledger',
      start: 5,
      addend: -8,
      unit: '₹',
    },
  },
  {
    id: 19,
    stageId: 'stage-6',
    stageNumber: 6,
    conceptId: 'negative_comparison',
    prompt:
      'If someone owes ₹3 and another person owes ₹8, who has the better financial position?',
    learningObjective: 'Recognize intuitively that owing ₹3 is better than owing ₹8.',
    expectedDiscovery: 'The person who owes ₹3 has the better financial position.',
    requiresReasoning: true,
    reasoningKeywords: ['3', 'less', 'smaller debt', 'closer', 'zero', 'first', 'pay', 'better', 'owe'],
    misconceptions: [
      {
        id: 'bigger_debt_better',
        label: 'Picked owing ₹8 as better',
        keywords: ['the second', 'person who owes 8', 'person who owes ₹8', 'owes 8 is better'],
        wrongNumbers: [8, -8],
        simplerExamplePrompt:
          'Imagine both people earn ₹10 tomorrow. After paying back their debt, how much money does each person get to keep?',
      },
    ],
    adaptiveHint: 'Who needs less money to get back to ₹0 debt?',
    visualHint: {
      type: 'bank_ledger',
      compareA: -3,
      compareB: -8,
      unit: '₹',
      labelA: 'Owes ₹3 (-3)',
      labelB: 'Owes ₹8 (-8)',
    },
  },
  {
    id: 20,
    stageId: 'stage-6',
    stageNumber: 6,
    conceptId: 'negative_comparison',
    prompt: 'Which mathematical number is greater: -3 or -8? Why?',
    learningObjective: 'Connect financial intuition to mathematical order (-3 > -8).',
    expectedDiscovery: 'Negative numbers represent values below zero, so -3 > -8.',
    requiresReasoning: true,
    acceptedNumbers: [-3],
    reasoningKeywords: [
      'closer',
      'zero',
      '0',
      'better',
      'less',
      'owe',
      'debt',
      'right',
      'smaller',
      'below',
      'more',
    ],
    misconceptions: [
      {
        id: 'magnitude_confusion_neg3_neg8',
        label: 'Believed -8 > -3 because 8 > 3',
        keywords: ['-8 is greater', '-8 is bigger', '-8'],
        wrongNumbers: [-8],
        simplerExamplePrompt:
          'You just noticed that owing ₹3 puts you in a better position than owing ₹8! If -3 represents the better position closer to 0, which number is greater: -3 or -8?',
      },
    ],
    adaptiveHint: 'Think about which balance is closer to ₹0 (less deep in debt).',
    visualHint: {
      type: 'bank_ledger',
      compareA: -3,
      compareB: -8,
      unit: '₹',
      labelA: '-3',
      labelB: '-8',
    },
  },

  // Stage 7: Adding Positive and Negative Numbers
  {
    id: 21,
    stageId: 'stage-7',
    stageNumber: 7,
    conceptId: 'directed_addition',
    prompt: 'If you have ₹5 and spend ₹8, how could you represent this using addition?',
    learningObjective: 'Model spending as adding a negative number: 5 + (-8) = -3.',
    expectedDiscovery: 'Represent it as 5 + (-8) = -3.',
    requiresReasoning: true,
    reasoningKeywords: ['5 + (-8)', '5 + -8', '5+(-8)', '5+-8', 'negative', 'add', '-8', '-3', 'spend'],
    misconceptions: [
      {
        id: 'only_subtraction_or_positive_add',
        label: 'Added 5 + 8 instead of representing spending as -8',
        keywords: ['5 + 8', '5+8'],
        simplerExamplePrompt:
          'Notice that spending ₹8 moves your balance down by 8. How could we write "combining +5 with a debt/drop of -8" using a + sign?',
      },
    ],
    adaptiveHint: 'Start with +5, and use + to combine it with the negative change (-8).',
    visualHint: {
      type: 'bank_ledger',
      start: 5,
      addend: -8,
      unit: '₹',
      labelA: 'Have (+5)',
      labelB: 'Spend (-8)',
    },
  },
  {
    id: 22,
    stageId: 'stage-7',
    stageNumber: 7,
    conceptId: 'directed_addition',
    prompt: 'If you owe ₹3 and receive ₹7, what happens?',
    learningObjective: 'Combine a negative debt (-3) with a positive gain (+7) to reach +4.',
    expectedDiscovery: '₹3 pays off the debt to 0, leaving +₹4 (-3 + 7 = 4).',
    requiresReasoning: true,
    acceptedNumbers: [4],
    reasoningKeywords: ['pay', 'clear', 'debt', 'zero', '0', 'left', 'remain', '4', '3', '7', 'cancel'],
    misconceptions: [
      {
        id: 'added_3_and_7',
        label: 'Added 3 + 7 = 10 ignoring the negative debt',
        keywords: ['10'],
        wrongNumbers: [10],
        simplerExamplePrompt:
          'Wait — out of the ₹7 you received, you first have to hand ₹3 to the person you owe. Once that ₹3 debt is cleared, how much money is left in your hand?',
      },
    ],
    adaptiveHint: 'Use part of the ₹7 to clear the ₹3 debt first — how much remains?',
    visualHint: {
      type: 'bank_ledger',
      start: -3,
      addend: 7,
      unit: '₹',
      labelA: 'Owe (-3)',
      labelB: 'Receive (+7)',
    },
  },
  {
    id: 23,
    stageId: 'stage-7',
    stageNumber: 7,
    conceptId: 'directed_addition',
    prompt:
      'Why can adding a positive and negative number produce a positive number, a negative number, or zero?',
    learningObjective: 'Explain that opposite directions compete/cancel and the larger magnitude determines the sign.',
    expectedDiscovery:
      'Addition combines directed quantities: whichever direction is larger remains, or they cancel to zero if equal.',
    requiresReasoning: true,
    reasoningKeywords: [
      'big',
      'larg',
      'great',
      'cancel',
      'equal',
      'more',
      'debt',
      'gain',
      'posit',
      'negat',
      'zero',
      'depend',
      'direct',
      'balanc',
      'same',
    ],
    misconceptions: [],
    adaptiveHint:
      'Compare 5 + (-8) = -3, -3 + 7 = +4, and -5 + 5 = 0. What decides which side wins?',
    visualHint: {
      type: 'bank_ledger',
      start: -3,
      addend: 7,
      unit: '₹',
    },
  },
  {
    id: 24,
    stageId: 'stage-7',
    stageNumber: 7,
    conceptId: 'zero_balance',
    prompt: 'What does zero represent when a debt is completely cleared?',
    learningObjective: 'Understand zero as balanced/even — neither owing nor having surplus.',
    expectedDiscovery: 'Zero means balanced — no debt left and no extra surplus.',
    requiresReasoning: true,
    reasoningKeywords: [
      'no debt',
      'even',
      'balanc',
      'clear',
      'neither',
      'nothing',
      'owe',
      'neutral',
      'paid',
      'start',
      'break',
      'free',
    ],
    misconceptions: [],
    adaptiveHint:
      'If you owed ₹3 and paid back exactly ₹3, do you still owe anything, or do you have extra money left over?',
    visualHint: {
      type: 'bank_ledger',
      start: -3,
      addend: 3,
      unit: '₹',
    },
  },

  // Stage 8: Number Line
  {
    id: 25,
    stageId: 'stage-8',
    stageNumber: 8,
    conceptId: 'number_line_direction',
    prompt: 'Why might adding a negative number mean moving left?',
    learningObjective: 'Connect adding negative values (like debt or temperature drops) with moving toward smaller numbers on the left.',
    expectedDiscovery: 'Negative values pull toward smaller numbers (below zero), which sit to the left.',
    requiresReasoning: true,
    reasoningKeywords: [
      'small',
      'less',
      'decreas',
      'debt',
      'below',
      'drop',
      'left',
      'back',
      'lower',
      'opposit',
      'negat',
    ],
    misconceptions: [],
    adaptiveHint:
      'Look at the number line: where are the smaller numbers and debts like -3 and -8 located compared to 0 and +5?',
    visualHint: {
      type: 'number_line',
      start: 2,
      addend: -5,
      caption: 'Notice which direction values get smaller.',
    },
  },
  {
    id: 26,
    stageId: 'stage-8',
    stageNumber: 8,
    conceptId: 'number_line_direction',
    prompt: 'What happens when you add a positive number?',
    learningObjective: 'Recognize that adding a positive number moves right toward greater values.',
    expectedDiscovery: 'You move right toward larger values.',
    requiresReasoning: true,
    reasoningKeywords: ['right', 'increas', 'big', 'larg', 'great', 'up', 'forward', 'more', 'high'],
    misconceptions: [
      {
        id: 'moves_left_for_positive',
        label: 'Thought adding positive moves left',
        keywords: ['left', 'smaller'],
        simplerExamplePrompt:
          'When you earn +₹4, does your balance grow larger or smaller — and which side of the number line holds larger numbers?',
      },
    ],
    adaptiveHint: 'Look at which direction numbers grow larger on the number line.',
    visualHint: {
      type: 'number_line',
      start: -2,
      addend: 5,
      caption: 'Try moving right by adding a positive number.',
    },
  },
  {
    id: 27,
    stageId: 'stage-8',
    stageNumber: 8,
    conceptId: 'number_line_direction',
    prompt: 'Start at -5 and add +3. Where do you land?',
    learningObjective: 'Compute -5 + 3 = -2 via rightward movement without crossing zero.',
    expectedDiscovery: 'Moving 3 steps right from -5 lands at -2.',
    requiresReasoning: true,
    acceptedNumbers: [-2],
    reasoningKeywords: ['right', 'step', 'move', '-4', '-3', '-2', 'still', 'below', 'less', 'owe'],
    misconceptions: [
      {
        id: 'moved_left_instead_of_right',
        label: 'Moved left to -8 instead of right to -2',
        keywords: ['-8'],
        wrongNumbers: [-8],
        simplerExamplePrompt:
          'Careful on the direction! Adding +3 is positive, so we step RIGHT toward 0: -4, -3... where does the 3rd step right land?',
      },
      {
        id: 'dropped_negative_sign',
        label: 'Answered +2 instead of -2',
        keywords: [],
        wrongNumbers: [2],
        simplerExamplePrompt:
          'From -5, it takes 5 steps just to reach 0. Since we only stepped +3 to the right, have we reached 0 yet?',
      },
    ],
    adaptiveHint: 'Start at -5 and take 3 hops right: -4, -3, and one more...',
    visualHint: {
      type: 'number_line',
      start: -5,
      addend: 3,
      caption: 'Start at -5 and watch +3.',
    },
  },
  {
    id: 28,
    stageId: 'stage-8',
    stageNumber: 8,
    conceptId: 'crossing_zero',
    prompt: 'Start at -5 and add +7. What changes when you cross zero?',
    learningObjective: 'Explain how 5 steps reach zero and the remaining 2 steps enter positive territory (+2).',
    expectedDiscovery:
      'Positive addition moves right; negative addition moves left. From -5, 5 steps reach 0 and 2 more land at +2.',
    requiresReasoning: true,
    acceptedNumbers: [2],
    reasoningKeywords: [
      '0',
      'zero',
      'posit',
      'cross',
      'past',
      '5',
      '2',
      'remain',
      'leftover',
      'switch',
      'sign',
      'above',
      'right',
    ],
    misconceptions: [
      {
        id: 'miscounted_crossing_zero',
        label: 'Miscounted steps while crossing zero',
        keywords: [],
        wrongNumbers: [1, 3, -2],
        simplerExamplePrompt:
          'Count how many steps of your +7 jump are spent just getting from -5 up to 0. Once you reach 0, how many steps are still left?',
      },
    ],
    adaptiveHint: 'Split +7 into the 5 steps that bring you to 0, plus the remaining steps past 0.',
    visualHint: {
      type: 'number_line',
      start: -5,
      addend: 7,
      caption: 'Watch -5 + 7 cross zero!',
    },
  },

  // Stage 9: Opposites and Zero (DO NOT NAME Additive Inverse until Q30/Q31 discovered!)
  {
    id: 29,
    stageId: 'stage-9',
    stageNumber: 9,
    conceptId: 'additive_inverse',
    prompt: 'What happens when you owe ₹5 and receive ₹5?',
    learningObjective: 'Observe that equal debt and gain cancel to 0.',
    expectedDiscovery: 'The debt is completely paid off, leaving ₹0.',
    requiresReasoning: true,
    acceptedNumbers: [0],
    reasoningKeywords: ['zero', '0', 'clear', 'paid', 'cancel', 'even', 'nothing', 'debt', 'same'],
    misconceptions: [
      {
        id: 'sum_to_ten',
        label: 'Combined 5 and 5 to get 10 instead of cancelling debt',
        keywords: ['10'],
        wrongNumbers: [10],
        simplerExamplePrompt:
          'Wait — you owed ₹5 to someone. When you receive ₹5 and pay them back, do you get to keep ₹10, or are you back at ₹0?',
      },
    ],
    adaptiveHint: 'Every rupee you receive goes directly toward clearing the ₹5 you owed.',
    visualHint: {
      type: 'bank_ledger',
      start: -5,
      addend: 5,
      unit: '₹',
    },
  },
  {
    id: 30,
    stageId: 'stage-9',
    stageNumber: 9,
    conceptId: 'additive_inverse',
    prompt: 'What is the relationship between 5 and -5?',
    learningObjective: 'Articulate that 5 and -5 are opposites at equal distance from zero that cancel out.',
    expectedDiscovery: 'They are opposites on opposite sides of zero at the same distance, so they cancel to zero.',
    requiresReasoning: true,
    reasoningKeywords: [
      'opposit',
      'cancel',
      'same distance',
      'equal',
      'zero',
      '0',
      'mirror',
      'side',
      'invers',
      'negat',
      'posit',
      'undo',
    ],
    misconceptions: [],
    adaptiveHint:
      'Look at 5 and -5 on the number line: how far is each one from 0, and in which direction?',
    visualHint: {
      type: 'number_line',
      start: 5,
      addend: -5,
      caption: 'Compare 5 and -5 relative to 0.',
    },
  },
  {
    id: 31,
    stageId: 'stage-9',
    stageNumber: 9,
    conceptId: 'additive_inverse',
    prompt: 'Will -5 + 5 and 5 + (-5) have different answers?',
    learningObjective: 'Confirm opposite pairs sum to zero in both orders (additive inverse + commutativity).',
    expectedDiscovery: 'Additive inverse and commutativity.',
    requiresReasoning: true,
    acceptedBoolean: 'no',
    reasoningKeywords: [
      'same',
      'both',
      'zero',
      '0',
      'order',
      'opposit',
      'cancel',
      'no',
      'equal',
      'commut',
    ],
    misconceptions: [
      {
        id: 'order_changes_inverse',
        label: 'Thought -5 + 5 differs from 5 + (-5)',
        keywords: ['yes', 'different'],
        simplerExamplePrompt:
          'Test both stories: Story 1 — owe ₹5, then earn ₹5. Story 2 — have ₹5, then spend ₹5. Do you end up with different balances?',
      },
    ],
    adaptiveHint: 'Test both on the number line: start at -5 and go +5, vs start at +5 and go -5.',
    visualHint: {
      type: 'number_line',
      start: -5,
      addend: 5,
      caption: 'Compare -5 + 5 with 5 + (-5).',
    },
  },

  // Stage 10: Independent Application
  {
    id: 32,
    stageId: 'stage-10',
    stageNumber: 10,
    conceptId: 'real_world_modeling',
    prompt:
      'A mountain camp starts at -4°C, warms up 9°C by noon, and then drops 7°C by midnight. What temperature does it reach, and how did you trace it?',
    learningObjective: 'Model multi-step temperature swings with signed addition (-4 + 9 + (-7) = -2°C).',
    expectedDiscovery: '-4 + 9 + (-7) = -2°C, rising past 0°C to +5°C and dropping back below zero.',
    requiresReasoning: true,
    acceptedNumbers: [-2],
    reasoningKeywords: [
      '-4',
      '9',
      '-7',
      '-2',
      '5',
      'noon',
      'zero',
      'below',
      'rise',
      'warm',
      'drop',
      'add',
      'all',
      'temp',
    ],
    misconceptions: [
      {
        id: 'dropped_temp_sign',
        label: 'Treated 7°C drop as +7 or forgot starting -4°C',
        keywords: ['12', '20'],
        wrongNumbers: [12, 20],
        simplerExamplePrompt:
          'Let’s take just one small step first: starting at -4°C and warming up by 9°C reaches what temperature at noon?',
      },
    ],
    adaptiveHint:
      'Try one step at a time: first go from -4°C up by +9°C, then drop 7°C from there.',
    visualHint: {
      type: 'elevation_temp',
      start: -4,
      addend: 9,
      groupC: -7,
      unit: '°C',
    },
  },
  {
    id: 33,
    stageId: 'stage-10',
    stageNumber: 10,
    conceptId: 'operation_appropriateness',
    prompt:
      'A bus has 14 passengers, 5 more get on, and it drives 12 km. Someone adds 14 + 5 + 12 to count the passengers — what do you notice?',
    learningObjective: 'Filter irrelevant quantities (12 km) and justify why only 14 + 5 = 19 applies.',
    expectedDiscovery: 'Only 14 and 5 count passengers (14 + 5 = 19); 12 km is distance, not people.',
    requiresReasoning: true,
    acceptedNumbers: [19],
    reasoningKeywords: [
      '14',
      '5',
      '19',
      '12',
      'km',
      'distanc',
      'passenger',
      'people',
      'relev',
      'differ',
      'unit',
      'ignore',
      'not',
    ],
    misconceptions: [
      {
        id: 'added_km_to_passengers',
        label: 'Included 12 km in the passenger count (= 31)',
        keywords: ['31'],
        wrongNumbers: [31],
        simplerExamplePrompt:
          'Wait — when the bus drives 12 kilometers down the road, do 12 new people appear in the seats?',
      },
    ],
    adaptiveHint: 'Look at what each number counts: people or distance?',
    visualHint: {
      type: 'context_blocks',
      groupA: 14,
      groupB: 5,
      unit: 'passengers (ignore 12 km)',
      labelA: '14 passengers',
      labelB: '5 passengers',
    },
  },
  {
    id: 34,
    stageId: 'stage-10',
    stageNumber: 10,
    conceptId: 'real_world_modeling',
    prompt:
      'A diver at -12 m carries 3 oxygen tanks and swims up 15 m. Where is she now, and which numbers mattered?',
    learningObjective: 'Model signed elevation (-12 + 15 = +3 m) while ignoring irrelevant tank count.',
    expectedDiscovery: '-12 + 15 = +3 m above sea level; 3 oxygen tanks is irrelevant to depth.',
    requiresReasoning: true,
    acceptedNumbers: [3],
    reasoningKeywords: [
      '-12',
      '15',
      '3',
      'tank',
      'sea',
      'zero',
      'above',
      'depth',
      'elevat',
      'ignor',
      'relev',
      'meter',
      'm',
    ],
    misconceptions: [
      {
        id: 'included_oxygen_tanks',
        label: 'Added the 3 oxygen tanks to depth',
        keywords: ['6', '30'],
        wrongNumbers: [6, 30],
        simplerExamplePrompt:
          'Does carrying 3 oxygen tanks change how deep she is in the water, or only her depth (-12 m) and swim up (+15 m)?',
      },
    ],
    adaptiveHint:
      'Sea level is 0 m. She uses 12 m of her 15 m swim just to reach the surface — how far above 0 m does she go?',
    visualHint: {
      type: 'number_line',
      start: -12,
      addend: 15,
      caption: 'Sea level is 0 m: trace -12 + 15.',
    },
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
    description: 'Discovered how zero works both with addition and when debts clear.',
    criteria: 'Discover both Zero and Addition and Zero as Cleared Balance.',
    icon: 'CircleDot',
    color: 'indigo',
  },
  {
    id: 'pattern-discoverer',
    title: 'Pattern Architect',
    description: 'Uncovered Commutative or Associative structure before hearing its name.',
    criteria: 'Discover Commutative Property and Associative Property.',
    icon: 'Shapes',
    color: 'violet',
  },
  {
    id: 'addition-master',
    title: 'Addition Philosopher',
    description: 'Built deep, sequential understanding across the Addition journey.',
    criteria: 'Discover at least 10 concepts across the map.',
    icon: 'Award',
    color: 'emerald',
  },
];

export function createInitialTopicProgress(topic = DEFAULT_TOPIC): TopicLearningProgress {
  return {
    topic,
    current_stage: 1,
    current_question: 1,
    completed_questions: [],
    mastered_concepts: [],
    misconceptions: [],
    pending_followup: false,
    pending_followup_type: null,
    struggle_count: 0,
    next_question: 1,
    stage_summaries: {},
  };
}

export function getStageById(stageId: StageId): StageDefinition {
  return STAGES.find((s) => s.id === stageId) ?? STAGES[0];
}

export function getStageByNumber(num: number): StageDefinition {
  return STAGES.find((s) => s.number === num) ?? STAGES[0];
}

export function getConceptById(conceptId: string): ConceptDefinition | undefined {
  return CONCEPTS.find((c) => c.id === conceptId);
}

export function getQuestionById(questionId: number): SequentialQuestion {
  return (
    SEQUENTIAL_QUESTIONS.find((q) => q.id === questionId) ??
    SEQUENTIAL_QUESTIONS[0]
  );
}

export function getNextQuestion(currentQuestionId: number): SequentialQuestion | undefined {
  const idx = SEQUENTIAL_QUESTIONS.findIndex((q) => q.id === currentQuestionId);
  if (idx < 0 || idx + 1 >= SEQUENTIAL_QUESTIONS.length) return undefined;
  return SEQUENTIAL_QUESTIONS[idx + 1];
}

export function getDailyChallenge(
  dateKey: string,
  completedDate: string | null
): ChallengeItem {
  const pool: Array<Omit<ChallengeItem, 'completed'>> = [
    {
      id: 'daily-elevator',
      kind: 'daily',
      title: 'The Underground Elevator',
      prompt:
        'An elevator starts 3 floors below ground (-3). It goes up 7 floors, then down 6 floors. Where does it stop, and why?',
      stageId: 'stage-8',
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
        'Asha has ₹20 and owes ₹35. Ravi owes ₹35 and then earns ₹20. Who ends up better off, and why?',
      stageId: 'stage-9',
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
        'A bus leaves with 14 passengers, picks up 5 more, and travels 12 km. Someone writes 14 + 5 + 12. Would you agree? Why or why not?',
      stageId: 'stage-10',
      visualHint: {
        type: 'context_blocks',
        groupA: 14,
        groupB: 5,
        unit: 'passengers',
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
      'A submarine dives to -18 meters, rises 11 meters, then dives 5 meters. What single movement from there would bring it back to sea level (0 meters), and how can you prove it?',
    stageId: 'stage-10',
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
