import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CONCEPTS, SEQUENTIAL_QUESTIONS, STAGES } from './curriculum.js';
import {
  createDefaultStudent,
  loadStudentState,
  saveStudentState,
  syncLearningPositionToStage,
} from './storage.js';
import { runSocraticTurn } from './tutorEngine.js';

function makeFreshState(id: string) {
  const base = createDefaultStudent(id);
  return { ...base, aiMode: 'demo' as const, persistenceMode: 'local' as const };
}

test('Scenario A: Student answers correctly with sound reasoning -> moves to next sequential question', async () => {
  const state = makeFreshState('scenario-a');
  assert.equal(state.learningState.current_stage, 1);
  assert.equal(state.learningState.current_question, 1);

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-a',
    stageId: 'stage-1',
    message: '4 chocolates because 2 plus 2 more makes 4',
    action: 'answer',
  });
  assert.deepEqual(state.learningState.completed_questions, [1]);
  assert.equal(state.learningState.current_question, 2);
  assert.equal(state.learningState.pending_followup, false);
  assert.match(t1.tutorMessage.content, /How did you calculate the total\?/i);

  const t2 = await runSocraticTurn(state, {
    studentId: 'scenario-a',
    stageId: 'stage-1',
    message: 'I counted 2 and then counted 2 more together to get 4',
    action: 'answer',
  });
  assert.deepEqual(state.learningState.completed_questions, [1, 2]);
  assert.equal(state.learningState.current_question, 3);
  assert.match(t2.tutorMessage.content, /18 objects/i);
});

test('Scenario B: Student answers correctly without explaining why -> asks ONE reasoning question without advancing', async () => {
  const state = makeFreshState('scenario-b');
  syncLearningPositionToStage(state, 'stage-3'); // Q8: 5 chocolates + 0 more

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-b',
    stageId: 'stage-3',
    message: '5',
    action: 'answer',
  });

  assert.equal(state.learningState.current_question, 8);
  assert.equal(state.learningState.pending_followup, true);
  assert.equal(state.learningState.pending_followup_type, 'reasoning');
  assert.match(t1.tutorMessage.content, /why|how did you figure/i);
  assert.ok(!state.learningState.completed_questions.includes(8));

  // Once student explains why, sequence resumes and advances to Q9
  const t2 = await runSocraticTurn(state, {
    studentId: 'scenario-b',
    stageId: 'stage-3',
    message: 'Because receiving zero means nothing new was added to the 5 chocolates',
    action: 'answer',
  });
  assert.equal(state.learningState.current_question, 9);
  assert.equal(state.learningState.pending_followup, false);
  assert.match(t2.tutorMessage.content, /Did the addition operation still happen/i);
});

test('Scenario C: Student gives partially correct answer -> asks targeted follow-up without advancing', async () => {
  const state = makeFreshState('scenario-c');
  syncLearningPositionToStage(state, 'stage-10'); // Q32 multi-part temperature problem

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-c',
    stageId: 'stage-10',
    message: '-2°C',
    action: 'answer',
  });

  assert.equal(state.learningState.current_question, 32);
  assert.equal(state.learningState.pending_followup, true);
  assert.match(t1.tutorMessage.content, /why|how|which quantities|figure it out/i);
});

test('Scenario D: Student gives wrong answer / misconception -> explores misconception without jumping ahead', async () => {
  const state = makeFreshState('scenario-d');
  syncLearningPositionToStage(state, 'stage-6');
  // Move to Q20 (-3 vs -8)
  state.learningState.completed_questions = [17, 18, 19];
  state.learningState.current_question = 20;
  state.learningState.next_question = 20;

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-d',
    stageId: 'stage-6',
    message: '-8 is greater because 8 is bigger than 3',
    action: 'answer',
  });

  assert.equal(state.learningState.current_question, 20);
  assert.equal(state.learningState.pending_followup, true);
  assert.equal(state.learningState.pending_followup_type, 'misconception');
  assert.ok(state.learningState.misconceptions.length >= 1);
  assert.match(t1.tutorMessage.content, /owing ₹3.*owing ₹8|-3 or -8/i);

  // Resolving misconception advances cleanly to Stage 7 Q21
  const t2 = await runSocraticTurn(state, {
    studentId: 'scenario-d',
    stageId: 'stage-6',
    message: '-3 is greater because owing 3 is closer to 0 than owing 8',
    action: 'answer',
  });
  assert.equal(state.learningState.current_stage, 7);
  assert.equal(state.learningState.current_question, 21);
  assert.equal(state.learningState.pending_followup, false);
  assert.ok(state.misconceptionsResolved >= 1);
  assert.match(t2.tutorMessage.content, /have ₹5 and spend ₹8/i);
});

test('Scenario E: Student asks unrelated doubt -> answers briefly and returns to exact pending question', async () => {
  const state = makeFreshState('scenario-e');
  syncLearningPositionToStage(state, 'stage-4'); // Q10: 3 chocolates + 4

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-e',
    stageId: 'stage-4',
    message: 'Wait, what is multiplication?',
    action: 'answer',
  });

  assert.equal(state.learningState.current_question, 10);
  assert.equal(state.learningState.pending_followup, true);
  assert.equal(state.learningState.pending_followup_type, 'unrelated_doubt');
  assert.match(t1.tutorMessage.content, /repeated addition/i);
  assert.match(t1.tutorMessage.content, /3 chocolates and then 4/i);
});

test('Scenario F: Persisted state resumes from exact saved learning position across reload', async () => {
  const id = `scenario-f-${Date.now()}`;
  const state = makeFreshState(id);
  await runSocraticTurn(state, {
    studentId: id,
    stageId: 'stage-1',
    message: '4',
    action: 'answer',
  });
  await saveStudentState(state);

  const reloaded = await loadStudentState(id, 'demo');
  assert.equal(reloaded.learningState.current_stage, 1);
  assert.equal(reloaded.learningState.current_question, 2);
  assert.deepEqual(reloaded.learningState.completed_questions, [1]);

  // Cleanup local store test artifact if created
  const storePath = path.resolve(process.cwd(), 'server', 'data', 'store.json');
  if (fs.existsSync(storePath)) {
    const raw = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    delete raw.students[id];
    fs.writeFileSync(storePath, JSON.stringify(raw, null, 2), 'utf-8');
  }
  assert.ok(os.tmpdir());
});

test('Scenario G: Alternative valid explanation is accepted and advances sequentially', async () => {
  const state = makeFreshState('scenario-g');
  syncLearningPositionToStage(state, 'stage-8');
  state.learningState.completed_questions = [25, 26];
  state.learningState.current_question = 27; // -5 + 3 = -2

  const t1 = await runSocraticTurn(state, {
    studentId: 'scenario-g',
    stageId: 'stage-8',
    message: 'If I owe 5 rupees and get 3 rupees back, I still owe 2 rupees so -2 on the number line',
    action: 'answer',
  });

  assert.equal(state.learningState.current_question, 28);
  assert.ok(state.learningState.completed_questions.includes(27));
  assert.match(t1.tutorMessage.content, /Start at -5 and add \+7/i);
});

test('Full 10-Stage Addition Journey traverses Q1 through Q34 sequentially without premature terminology', async () => {
  assert.equal(STAGES.length, 10);
  assert.equal(SEQUENTIAL_QUESTIONS.length, 34);

  // Verify Stage 4 & Stage 5 hide formal names before discovery
  const commConcept = CONCEPTS.find((c) => c.id === 'commutative_property')!;
  const assocConcept = CONCEPTS.find((c) => c.id === 'associative_property')!;
  const invConcept = CONCEPTS.find((c) => c.id === 'additive_inverse')!;
  assert.equal(commConcept.revealNameAfterDiscovery, true);
  assert.equal(assocConcept.revealNameAfterDiscovery, true);
  assert.equal(invConcept.revealNameAfterDiscovery, true);

  const state = makeFreshState('full-journey');
  const answers: Record<number, string> = {
    1: '4',
    2: 'I counted 2 chocolates and then 2 more together to get 4',
    3: 'No because I already know there are 18 so I can count on from 18',
    4: 'Counting forward saves time because I start at 18 and count 19 20 21 22 23',
    5: 'Yes because both collections are books so we can combine them',
    6: 'No because balloons are not books and have a different category',
    7: 'Context tells us which quantities are relevant to answer the same question',
    8: '5 chocolates because zero means nothing new was added',
    9: 'Yes addition still happened because we combined 5 with 0 even though it stayed the same',
    10: '7 chocolates because 3 and 4 combined count to 7',
    11: '7 chocolates because combining 4 and 3 gives the same total',
    12: 'Because the same chocolates are combined and swapping order creates or removes nothing',
    13: '9 objects because 2, 3, and 4 combined count to 9',
    14: '2 plus 3 makes 5 and then 5 plus 4 makes 9',
    15: '3 plus 4 makes 7 and then 2 plus 7 still makes 9',
    16: 'Because grouping pairs differently still combines the same three collections',
    17: 'You still owe 3 rupees after paying the 5 rupees you have',
    18: 'Represent owing 3 below zero as -3',
    19: 'The person who owes 3 has the better position because they owe less debt',
    20: '-3 is greater because owing 3 is closer to 0 than owing 8',
    21: 'Represent it as 5 + (-8) = -3 because spending adds a negative amount',
    22: 'The 3 rupee debt clears to 0 and you have 4 rupees left',
    23: 'It depends which direction is larger, or if gains and debts are equal they cancel to zero',
    24: 'Zero means balanced and completely free of debt with nothing extra left',
    25: 'Adding a negative decreases the value toward smaller numbers on the left',
    26: 'Adding a positive increases the value and moves right on the number line',
    27: 'Moving 3 steps right from -5 lands at -2',
    28: '5 steps reach 0 and the remaining 2 steps cross past zero to positive 2',
    29: 'The 5 rupee debt is paid off leaving 0 rupees',
    30: '5 and -5 are opposites at equal distance from zero so they cancel out',
    31: 'No they both equal zero because order does not change the opposite cancellation',
    32: '-4 + 9 + (-7) = -2 because warming reaches +5 above zero then drops 7 below to -2',
    33: 'Only 14 and 5 passengers are relevant giving 19 people because 12 km is distance',
    34: '-12 + 15 = 3 meters above sea level because 3 oxygen tanks do not affect depth',
  };

  for (let qid = 1; qid <= 34; qid++) {
    assert.equal(state.learningState.current_question, qid, `Expected to be on Q${qid}`);
    const res = await runSocraticTurn(state, {
      studentId: 'full-journey',
      stageId: state.currentStageId,
      message: answers[qid],
      action: 'answer',
    });

    // Check Stage 4 does NOT reveal "Commutative" before Q12
    if (qid === 10 || qid === 11) {
      assert.ok(
        !/commutative/i.test(res.tutorMessage.content),
        `Prematurely revealed Commutative on Q${qid}`
      );
    }
    // Check Stage 5 does NOT reveal "Associative" before Q16
    if (qid >= 13 && qid <= 15) {
      assert.ok(
        !/associative/i.test(res.tutorMessage.content),
        `Prematurely revealed Associative on Q${qid}`
      );
    }
    // Check Q12 reveals Commutative after discovery
    if (qid === 12) {
      assert.match(res.tutorMessage.content, /Commutative Property/i);
    }
    // Check Q16 reveals Associative after discovery
    if (qid === 16) {
      assert.match(res.tutorMessage.content, /Associative Property/i);
    }
  }

  assert.equal(state.learningState.completed_questions.length, 34);
  assert.equal(state.learningState.mastered_concepts.length, CONCEPTS.length);
});

test('Cognitive fatigue & simplify action offer lighter step without advancing or shaming', async () => {
  const state = makeFreshState('fatigue-test');
  syncLearningPositionToStage(state, 'stage-6'); // Q17

  const t1 = await runSocraticTurn(state, {
    studentId: 'fatigue-test',
    stageId: 'stage-6',
    message: "I don't understand",
    action: 'answer',
  });
  assert.equal(state.learningState.current_question, 17);
  assert.equal(state.learningState.struggle_count, 1);
  assert.ok(!/partially correct|next learning objective|conceptual mastery/i.test(t1.tutorMessage.content));

  const t2 = await runSocraticTurn(state, {
    studentId: 'fatigue-test',
    stageId: 'stage-6',
    message: 'Can we make this simpler?',
    action: 'simplify',
  });
  assert.equal(state.learningState.current_question, 17);
  assert.equal(state.learningState.struggle_count, 2);
  assert.match(t2.tutorMessage.content, /no rush|super light|together/i);
});

test('Inline Visual Learning: beginner who does not know addition gets interactive visual message in chat', async () => {
  const state = makeFreshState('beginner-visual');
  // Initial state starts with Q1 tutor message + Q1 visual message
  assert.equal(state.messages[0].role, 'tutor');
  assert.equal(state.messages[1].role, 'visual');
  assert.equal(state.messages[1].visualHint?.type, 'combine_objects');

  await runSocraticTurn(state, {
    studentId: 'beginner-visual',
    stageId: 'stage-1',
    message: "I don't know what addition is",
    action: 'answer',
  });

  const lastMsg = state.messages[state.messages.length - 1];
  assert.equal(lastMsg.role, 'visual');
  assert.equal(lastMsg.visualHint?.interactive, true);
  assert.equal(state.learningState.current_question, 1);

  // Child counts objects from visual and answers "4" -> advances to Q2 and still receives an inline visual
  const prevLen = state.messages.length;
  await runSocraticTurn(state, {
    studentId: 'beginner-visual',
    stageId: 'stage-1',
    message: '4',
    action: 'answer',
  });
  assert.equal(state.learningState.current_question, 2);
  const newMsgs = state.messages.slice(prevLen);
  assert.ok(newMsgs.some((m) => m.role === 'visual'), 'Every tutor turn includes an inline visual');
});

test('Idempotency & Anti-Repetition: duplicate clientTurnId creates only one response; concise answers & ? replies progress cleanly', async () => {
  const state = makeFreshState('idempotency-test');

  // 1. On-topic reply ending with "?" is not misclassified as unrelated doubt
  const r1 = await runSocraticTurn(state, {
    studentId: 'idempotency-test',
    stageId: 'stage-1',
    message: 'Is it 4?',
    action: 'answer',
    clientTurnId: 'turn-abc-1',
  });
  assert.equal(state.learningState.current_question, 2);
  const msgCountAfterFirst = state.messages.length;

  // 2. Submitting same clientTurnId again does NOT duplicate messages or advance again
  const r1Dup = await runSocraticTurn(state, {
    studentId: 'idempotency-test',
    stageId: 'stage-1',
    message: 'Is it 4?',
    action: 'answer',
    clientTurnId: 'turn-abc-1',
  });
  assert.equal(r1Dup.tutorMessage.id, r1.tutorMessage.id);
  assert.equal(state.messages.length, msgCountAfterFirst);
  assert.equal(state.learningState.current_question, 2);

  // 3. Concise 2-word explanation on Q2 ("I counted") advances cleanly to Q3
  await runSocraticTurn(state, {
    studentId: 'idempotency-test',
    stageId: 'stage-1',
    message: 'I counted',
    action: 'answer',
    clientTurnId: 'turn-abc-2',
  });
  assert.equal(state.learningState.current_question, 3);

  // 4. Anti-duplicate guard varies consecutive identical follow-ups
  const w1 = await runSocraticTurn(state, {
    studentId: 'idempotency-test',
    stageId: 'stage-1',
    message: 'idk',
    action: 'answer',
    clientTurnId: 'turn-abc-3',
  });
  const w2 = await runSocraticTurn(state, {
    studentId: 'idempotency-test',
    stageId: 'stage-1',
    message: 'idk',
    action: 'answer',
    clientTurnId: 'turn-abc-4',
  });
  assert.notEqual(
    w1.tutorMessage.content.trim().toLowerCase(),
    w2.tutorMessage.content.trim().toLowerCase()
  );
});
