import React from 'react';
import { Award, Check } from 'lucide-react';
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
  const earnedSet = new Set(state.badges.map((b) => b.badgeId));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold text-stone-900">
          Milestones
        </h1>
        <span className="text-sm font-medium text-emerald-700">
          {discoveredCount}/{concepts.length} ideas
        </span>
      </div>

      <div className="rounded-3xl border border-stone-200/80 bg-white p-5 space-y-3">
        {stages.map((stage) => {
          const stageConcepts = concepts.filter((c) => c.stageId === stage.id);
          const done = stageConcepts.filter(
            (c) => state.conceptProgress[c.id]?.status === 'discovered'
          ).length;
          return (
            <div key={stage.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-800">
                {stage.number}. {stage.title}
              </span>
              <span className="font-math text-xs text-stone-500">
                {done}/{stageConcepts.length}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map((badge) => {
          const unlocked = earnedSet.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`rounded-2xl border p-4 ${
                unlocked
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-stone-200 bg-white opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-sm font-bold text-stone-900">
                  {badge.title}
                </span>
                {unlocked ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Award className="h-4 w-4 text-stone-400" />
                )}
              </div>
              <p className="text-xs text-stone-600">{badge.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
