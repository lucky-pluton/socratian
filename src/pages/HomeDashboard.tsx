import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  Flame,
  Lightbulb,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type {
  ChallengeItem,
  ConceptDefinition,
  StageDefinition,
  StageId,
  StudentState,
} from '../types/socratic';

interface HomeDashboardProps {
  state: StudentState;
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  dailyChallenge: ChallengeItem;
  weeklyChallenge: ChallengeItem;
  onContinueLearning: (stageId?: StageId) => void;
  onStartChallenge: (challenge: ChallengeItem) => void;
  onOpenMap: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  state,
  stages,
  concepts,
  dailyChallenge,
  weeklyChallenge,
  onContinueLearning,
  onStartChallenge,
  onOpenMap,
}) => {
  const currentStage =
    stages.find((s) => s.id === state.currentStageId) ?? stages[0];

  const discoveredConcepts = concepts.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  );
  const progressPct = Math.round(
    (discoveredConcepts.length / Math.max(1, concepts.length)) * 100
  );

  const lastTutorMsg = [...state.messages]
    .reverse()
    .find((m) => m.stageId === currentStage?.id && m.role === 'tutor');

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-[#FFFDF9] via-[#FEF7E8] to-[#FDEFD9] p-6 sm:p-8 shadow-sm"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200 mb-3">
              <Compass className="h-3.5 w-3.5 text-amber-600" />
              Socratic Mathematics Studio
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Don’t memorize rules.{' '}
              <span className="text-amber-700">Discover why math works.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
              Every rule in mathematics started as someone’s curiosity about real life — chocolates,
              debts, footsteps, and balance. Pick up your conversation with Socratia right where
              you left off.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onContinueLearning(currentStage?.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition cursor-pointer"
              >
                Continue Learning — Stage {currentStage?.number}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenMap}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-800 border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
              >
                Explore Concept Map
              </button>
            </div>
          </div>

          {/* Current Question Preview Card */}
          <div className="lg:w-88 rounded-2xl border border-amber-200/90 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-2">
              <span>Active Question · Stage {currentStage?.number}</span>
              <span className="font-math">{progressPct}% Map</span>
            </div>
            <p className="text-sm font-medium text-stone-800 leading-relaxed line-clamp-4">
              “{lastTutorMsg?.content || currentStage?.openingQuestion}”
            </p>
            <div className="mt-4 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Concepts Discovered',
            value: `${discoveredConcepts.length} / ${concepts.length}`,
            sub: 'Through your own reasoning',
            icon: Sparkles,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Reasoning Score',
            value: `${state.reasoningScore}`,
            sub: 'Earned via explanations & why?',
            icon: Brain,
            tone: 'bg-indigo-50 text-indigo-700',
          },
          {
            label: 'Curiosity Streak',
            value: `${state.curiosityStreak} day${state.curiosityStreak === 1 ? '' : 's'}`,
            sub: `${state.questionsAsked} "Why?" questions asked`,
            icon: Flame,
            tone: 'bg-amber-50 text-amber-700',
          },
          {
            label: 'Badges Earned',
            value: `${state.badges.length} / 6`,
            sub: `${state.misconceptionsResolved} twists resolved`,
            icon: Trophy,
            tone: 'bg-rose-50 text-rose-700',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">{card.label}</span>
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-stone-900">
                {card.value}
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">{card.sub}</div>
            </div>
          );
        })}
      </section>

      {/* Daily & Weekly Curiosity Challenges */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[dailyChallenge, weeklyChallenge].map((challenge) => (
          <div
            key={challenge.id}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    challenge.kind === 'daily'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-violet-100 text-violet-900'
                  }`}
                >
                  <Lightbulb className="h-3 w-3" />
                  {challenge.kind === 'daily' ? 'Daily Curiosity Challenge' : 'Weekly Reasoning Challenge'}
                </span>
                {challenge.completed && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Explored
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg font-bold text-stone-900">
                {challenge.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                {challenge.prompt}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Opens in Socratic Room · Stage {challenge.stageId.replace('stage-', '')}
              </span>
              <button
                type="button"
                onClick={() => onStartChallenge(challenge)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                Explore Puzzle
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* 6-Stage Addition Learning Journey */}
      <section className="rounded-3xl border border-stone-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              Your Addition Discovery Journey
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Jump into any stage to converse with Socratia or deepen your understanding.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => {
            const total = stage.conceptIds.length;
            const done = stage.conceptIds.filter(
              (cid) => state.conceptProgress[cid]?.status === 'discovered'
            ).length;
            const isCurrent = stage.id === state.currentStageId;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onContinueLearning(stage.id)}
                className={`text-left rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300/60'
                    : 'border-stone-200 bg-[#FDFBF8] hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: stage.accentColor }}
                  >
                    Stage {stage.number}
                  </span>
                  <span className="font-math text-xs font-semibold text-stone-600">
                    {done}/{total} discovered
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-stone-900">
                  {stage.title}
                </h3>
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                  {stage.description}
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-stone-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(done / Math.max(1, total)) * 100}%`,
                      backgroundColor: stage.accentColor,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
