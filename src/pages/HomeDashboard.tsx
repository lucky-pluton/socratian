import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
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
  onContinueLearning,
  onStartChallenge,
  onOpenMap,
}) => {
  const currentStage =
    stages.find((s) => s.id === state.currentStageId) ?? stages[0];

  const discoveredCount = concepts.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  ).length;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Calm Welcome & Single Clear Action */}
      <section className="rounded-3xl border border-amber-200/70 bg-white p-7 sm:p-9 shadow-xs">
        <div className="text-xs font-semibold text-amber-700 mb-2">
          Addition · Stage {currentStage?.number} of {stages.length}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
          Discover why math works.
        </h1>
        <p className="mt-2.5 text-base text-stone-600">
          One small question at a time. No rules to memorize.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onContinueLearning(currentStage?.id)}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
          >
            Continue Learning
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenMap}
            className="rounded-2xl px-4 py-3.5 text-sm font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            {discoveredCount} of {concepts.length} ideas discovered
          </button>
        </div>
      </section>

      {/* Clean Learning Path */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
          Your Path
        </h2>
        <div className="divide-y divide-stone-200/70 rounded-3xl border border-stone-200/80 bg-white overflow-hidden">
          {stages.map((stage) => {
            const done = stage.conceptIds.every(
              (cid) => state.conceptProgress[cid]?.status === 'discovered'
            );
            const isCurrent = stage.id === state.currentStageId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onContinueLearning(stage.id)}
                className={`w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left transition hover:bg-stone-50 cursor-pointer ${
                  isCurrent ? 'bg-amber-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : stage.number}
                  </span>
                  <span className="text-sm font-medium text-stone-900 truncate">
                    {stage.title}
                  </span>
                </div>
                <span className="text-xs text-stone-400 shrink-0">
                  {isCurrent ? 'Current →' : done ? 'Done' : 'Start'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* One Gentle Daily Puzzle */}
      <section className="rounded-3xl border border-stone-200/80 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700">
            Today’s Puzzle
          </div>
          <div className="font-display text-lg font-bold text-stone-900 mt-0.5">
            {dailyChallenge.title}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onStartChallenge(dailyChallenge)}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition cursor-pointer shrink-0"
        >
          Try Puzzle
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
};
