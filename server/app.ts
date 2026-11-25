import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import {
  BADGES,
  CONCEPTS,
  SEQUENTIAL_QUESTIONS,
  STAGES,
  getDailyChallenge,
  getWeeklyChallenge,
} from './curriculum.js';
import {
  getTodayKey,
  loadStudentState,
  resetStudentState,
  saveStudentState,
  syncLearningPositionToStage,
} from './storage.js';
import { hasGeminiKey, runSocraticTurn } from './tutorEngine.js';
import type { StageId } from '../src/types/socratic.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const StageIdSchema = z.enum([
  'stage-1',
  'stage-2',
  'stage-3',
  'stage-4',
  'stage-5',
  'stage-6',
  'stage-7',
  'stage-8',
  'stage-9',
  'stage-10',
]);

function getAiMode(): 'gemini' | 'demo' {
  return hasGeminiKey() ? 'gemini' : 'demo';
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiMode: getAiMode(),
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ),
  });
});

app.get('/api/curriculum', (_req, res) => {
  res.json({
    stages: STAGES,
    concepts: CONCEPTS,
    questions: SEQUENTIAL_QUESTIONS,
    badges: BADGES,
  });
});

app.get('/api/state', async (req, res) => {
  try {
    const studentId = String(req.query.studentId || 'default-student');
    const state = await loadStudentState(studentId, getAiMode());
    const today = getTodayKey();
    res.json({
      state,
      dailyChallenge: getDailyChallenge(today, state.dailyChallengeCompletedDate),
      weeklyChallenge: getWeeklyChallenge(state.weeklyChallengeCompleted),
    });
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load student state' });
  }
});

const StageSwitchSchema = z.object({
  studentId: z.string().min(1),
  stageId: StageIdSchema,
  fallbackState: z.any().optional(),
});

app.post('/api/stage', async (req, res) => {
  try {
    const parsed = StageSwitchSchema.parse(req.body);
    const state = await loadStudentState(
      parsed.studentId,
      getAiMode(),
      parsed.fallbackState
    );
    syncLearningPositionToStage(state, parsed.stageId);
    await saveStudentState(state);
    res.json({ state });
  } catch (err) {
    console.error('POST /api/stage error:', err);
    res.status(400).json({ error: 'Invalid stage switch request' });
  }
});

const TutorTurnSchema = z.object({
  studentId: z.string().min(1),
  stageId: StageIdSchema,
  message: z.string(),
  action: z.enum(['answer', 'ask_why', 'hint', 'simplify', 'challenge_start']).optional(),
  challengePrompt: z.string().optional(),
  challengeKind: z.enum(['daily', 'weekly']).optional(),
  fallbackState: z.any().optional(),
});

app.post('/api/tutor/turn', async (req, res) => {
  try {
    const parsed = TutorTurnSchema.parse(req.body);
    const state = await loadStudentState(
      parsed.studentId,
      getAiMode(),
      parsed.fallbackState
    );

    const result = await runSocraticTurn(state, {
      studentId: parsed.studentId,
      stageId: parsed.stageId,
      message: parsed.message,
      action: parsed.action,
      challengePrompt: parsed.challengePrompt,
    });

    if (parsed.challengeKind === 'daily' && result.tutorMessage.assessment?.reasoningCorrect) {
      state.dailyChallengeCompletedDate = getTodayKey();
    }
    if (parsed.challengeKind === 'weekly' && result.tutorMessage.assessment?.reasoningCorrect) {
      state.weeklyChallengeCompleted = true;
    }

    await saveStudentState(state);

    res.json({
      ...result,
      state,
    });
  } catch (err) {
    console.error('POST /api/tutor/turn error:', err);
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to process Socratic turn',
    });
  }
});

const JournalCreateSchema = z.object({
  studentId: z.string().min(1),
  stageId: StageIdSchema,
  conceptId: z.string().nullable().optional(),
  entryType: z.enum(['discovery', 'explanation', 'question', 'reflection']),
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(2000),
});

app.post('/api/journal', async (req, res) => {
  try {
    const parsed = JournalCreateSchema.parse(req.body);
    const state = await loadStudentState(parsed.studentId, getAiMode());
    const entry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stageId: parsed.stageId as StageId,
      conceptId: parsed.conceptId ?? null,
      entryType: parsed.entryType,
      title: parsed.title.trim(),
      content: parsed.content.trim(),
      createdAt: new Date().toISOString(),
    };
    state.journal.unshift(entry);
    if (parsed.conceptId && state.conceptProgress[parsed.conceptId]) {
      state.conceptProgress[parsed.conceptId].studentExplanation = parsed.content.trim();
    }
    if (parsed.entryType === 'explanation') {
      state.explanationsGiven += 1;
      state.reasoningScore += 10;
    } else if (parsed.entryType === 'question') {
      state.questionsAsked += 1;
      state.reasoningScore += 5;
    }
    await saveStudentState(state);
    res.json({ entry, state });
  } catch (err) {
    console.error('POST /api/journal error:', err);
    res.status(400).json({ error: 'Invalid journal entry' });
  }
});

const ChallengeCompleteSchema = z.object({
  studentId: z.string().min(1),
  kind: z.enum(['daily', 'weekly']),
});

app.post('/api/challenge/complete', async (req, res) => {
  try {
    const parsed = ChallengeCompleteSchema.parse(req.body);
    const state = await loadStudentState(parsed.studentId, getAiMode());
    if (parsed.kind === 'daily') {
      state.dailyChallengeCompletedDate = getTodayKey();
      state.reasoningScore += 25;
    } else {
      state.weeklyChallengeCompleted = true;
      state.reasoningScore += 40;
    }
    await saveStudentState(state);
    const today = getTodayKey();
    res.json({
      state,
      dailyChallenge: getDailyChallenge(today, state.dailyChallengeCompletedDate),
      weeklyChallenge: getWeeklyChallenge(state.weeklyChallengeCompleted),
    });
  } catch (err) {
    console.error('POST /api/challenge/complete error:', err);
    res.status(400).json({ error: 'Invalid challenge completion request' });
  }
});

app.post('/api/tutor/reset', async (req, res) => {
  try {
    const studentId = String(req.body?.studentId || 'default-student');
    const state = await resetStudentState(studentId, getAiMode());
    const today = getTodayKey();
    res.json({
      state,
      dailyChallenge: getDailyChallenge(today, state.dailyChallengeCompletedDate),
      weeklyChallenge: getWeeklyChallenge(state.weeklyChallengeCompleted),
    });
  } catch (err) {
    console.error('POST /api/tutor/reset error:', err);
    res.status(500).json({ error: 'Failed to reset student journey' });
  }
});

// Serve built React app when running as standalone Node server
if (!process.env.VERCEL) {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}
