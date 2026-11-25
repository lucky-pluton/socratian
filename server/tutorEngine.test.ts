import assert from 'node:assert/strict';
import test from 'node:test';
import { CONCEPTS, STAGES } from './curriculum.js';
import { createDefaultStudent, ensureStageOpeningMessage } from './storage.js';
import { runSocraticTurn } from './tutorEngine.js';

test('Stage 1: asks for reasoning after bare correct number instead of advancing immediately', async () => {
  const base = createDefaultStudent('test-1');
  const state = { ...base, aiMode: 'demo' as const, persistenceMode: 'local' as const };

  const turn1 = await runSocraticTurn(state, {
    studentId: 'test-1',
    stageId: 'stage-1',
    message: '5',
    action: 'answer',
  });

  assert.match(turn1.tutorMessage.content, /how did you arrive at 5/i);
  assert.equal(turn1.newlyDiscoveredConcepts.length, 0);

  const turn2 = await runSocraticTurn(state, {
    studentId: 'test-1',
    stageId: 'stage-1',
    message: 'I counted them together',
    action: 'answer',
  });

  assert.match(turn2.tutorMessage.content, /18 chocolates/i);
  assert.ok(
    turn2.newlyDiscoveredConcepts.some((c) => c.id === 'need-for-addition'),
    'Should unlock need-for-addition after student explains how they combined 3 and 2'
  );
});

test('Stage 3: challenges negative number misconception with real-world debt counterexample', async () => {
  const base = createDefaultStudent('test-2');
  const state = { ...base, aiMode: 'demo' as const, persistenceMode: 'local' as const };
  ensureStageOpeningMessage(state, 'stage-3');

  const turn1 = await runSocraticTurn(state, {
    studentId: 'test-2',
    stageId: 'stage-3',
    message: 'Negative numbers are always smaller because debt is bad',
    action: 'answer',
  });

  assert.equal(turn1.tutorMessage.assessment?.strategyUsed, 'counterexample');
  assert.match(turn1.tutorMessage.content, /₹100.*₹1/i);
  assert.equal(turn1.tutorMessage.visualHint?.type, 'bank_ledger');

  const turn2 = await runSocraticTurn(state, {
    studentId: 'test-2',
    stageId: 'stage-3',
    message: 'My friend',
    action: 'answer',
  });
  assert.match(turn2.tutorMessage.content, /-100 or -1/i);

  const turn3 = await runSocraticTurn(state, {
    studentId: 'test-2',
    stageId: 'stage-3',
    message: '-1',
    action: 'answer',
  });
  assert.match(turn3.tutorMessage.content, /why do you think/i);

  const turn4 = await runSocraticTurn(state, {
    studentId: 'test-2',
    stageId: 'stage-3',
    message: 'Because owing 1 rupee is much closer to 0 than owing 100 rupees',
    action: 'answer',
  });
  assert.ok(turn4.newlyDiscoveredConcepts.some((c) => c.id === 'comparing-negatives'));
  assert.ok(state.misconceptionsResolved >= 1);
});

test('Stage 5: hides formal property names before discovery and reveals after', async () => {
  const stage5 = STAGES.find((s) => s.id === 'stage-5')!;
  const stage5Concepts = CONCEPTS.filter((c) => c.stageId === 'stage-5');

  // Opening question must not leak formal terminology
  for (const forbidden of ['commutative', 'associative', 'identity', 'inverse']) {
    assert.ok(
      !stage5.openingQuestion.toLowerCase().includes(forbidden),
      `Opening question leaked "${forbidden}"`
    );
  }
  for (const c of stage5Concepts) {
    assert.equal(c.revealNameAfterDiscovery, true);
    assert.ok(!c.mysteryTitle.toLowerCase().includes('commutative'));
    assert.ok(!c.mysteryTitle.toLowerCase().includes('associative'));
  }

  const base = createDefaultStudent('test-3');
  const state = { ...base, aiMode: 'demo' as const, persistenceMode: 'local' as const };
  ensureStageOpeningMessage(state, 'stage-5');

  const turn1 = await runSocraticTurn(state, {
    studentId: 'test-3',
    stageId: 'stage-5',
    message: 'Neither, both end up with 13 because changing the order gives the same total',
    action: 'answer',
  });

  assert.ok(turn1.newlyDiscoveredConcepts.some((c) => c.id === 'order-independence'));
  assert.match(turn1.tutorMessage.content, /Commutative Property/i);
});

test('Ask Why rewards curiosity and responds with real-world intuition', async () => {
  const base = createDefaultStudent('test-4');
  const state = { ...base, aiMode: 'demo' as const, persistenceMode: 'local' as const };
  ensureStageOpeningMessage(state, 'stage-4');

  const turn = await runSocraticTurn(state, {
    studentId: 'test-4',
    stageId: 'stage-4',
    message: 'Why does adding a negative move left?',
    action: 'ask_why',
  });

  assert.equal(state.questionsAsked, 1);
  assert.ok(state.reasoningScore >= 10);
  assert.equal(turn.tutorMessage.visualHint?.type, 'number_line');
});
