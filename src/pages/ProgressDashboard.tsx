import React from 'react';
import {
  Award,
  Brain,
  CheckCircle2,
  Compass,
  Flame,
  HelpCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import type {
  BadgeDefinition,
  ConceptDefinition,
  StageDefinition,
  StudentState,
} from '../types/socratic';

interface ProgressDashboardProps {
  state: StudentState;
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  badges: BadgeDefinition[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  state,
  stages,
  concepts,
  badges,
}) => {
  const discoveredCount = concepts.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  ).length;
  const avgMastery = Math.round(
    concepts.reduce((acc, c) => acc + (state.conceptProgress[c.id]?.mastery ?? 0), 0) /
      Math.max(1, concepts.length)
  );

  const earnedSet = new Set(state.badges.map((b) => b.badgeId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
          Conceptual Progress & Milestones
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Socratia measures genuine understanding — explaining why, asking meaningful questions,
          and resolving misconceptions — never blind guessing.
        </p>
      </div>

      {/* Conceptual Depth Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Conceptual Mastery',
            val: `${avgMastery}%`,
            icon: Brain,
            tone: 'bg-indigo-50 text-indigo-700',
          },
          {
            label: 'Ideas Discovered',
            val: `${discoveredCount}/${concepts.length}`,
            icon: Sparkles,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Explanations Given',
            val: state.explanationsGiven,
            icon: Compass,
            tone: 'bg-teal-50 text-teal-700',
          },
          {
            label: 'Why Questions',
            val: state.questionsAsked,
            icon: HelpCircle,
            tone: 'bg-amber-50 text-amber-700',
          },
          {
            label: 'Curiosity Streak',
            val: `${state.curiosityStreak}d`,
            icon: Flame,
            tone: 'bg-rose-50 text-rose-700',
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs"
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${m.tone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="mt-2 font-display text-2xl font-bold text-stone-900">
                {m.val}
              </div>
              <div className="text-xs text-stone-500">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Stage-by-stage Mastery */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-display text-lg font-bold text-stone-900">
          Understanding Across the 6 Stages
        </h2>
        <div className="space-y-3">
          {stages.map((stage) => {
            const stageConcepts = concepts.filter((c) => c.stageId === stage.id);
            const avgStage = Math.round(
              stageConcepts.reduce(
                (acc, c) => acc + (state.conceptProgress[c.id]?.mastery ?? 0),
                0
              ) / Math.max(1, stageConcepts.length)
            );
            const done = stageConcepts.filter(
              (c) => state.conceptProgress[c.id]?.status === 'discovered'
            ).length;

            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-800">
                    Stage {stage.number}: {stage.title}
                  </span>
                  <span className="font-math text-stone-600">
                    {done}/{stageConcepts.length} discovered · {avgStage}% depth
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(3, avgStage)}%`,
                      backgroundColor: stage.accentColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Discovery Badges */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-stone-900">
            Discovery Badges
          </h2>
          <span className="text-xs font-semibold text-stone-500">
            {earnedSet.size} of {badges.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const unlocked = earnedSet.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4 transition ${
                  unlocked
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 to-white shadow-xs'
                    : 'border-stone-200 bg-stone-50/70 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                      unlocked
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </span>
                  {unlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Unlocked
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-bold text-stone-900">
                  {badge.title}
                </h3>
                <p className="mt-1 text-xs text-stone-600">{badge.description}</p>
                <div className="mt-2 text-[11px] font-medium text-stone-500">
                  How: {badge.criteria}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
