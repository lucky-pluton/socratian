import React, { useState } from 'react';
import { ArrowRight, Check, Lock } from 'lucide-react';
import type {
  ConceptDefinition,
  StageDefinition,
  StageId,
  StudentState,
} from '../types/socratic';

interface ConceptMapProps {
  state: StudentState;
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  onExploreStage: (stageId: StageId) => void;
}

export const ConceptMap: React.FC<ConceptMapProps> = ({
  state,
  stages,
  concepts,
  onExploreStage,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    concepts[0]?.id ?? 'combining_quantities'
  );

  const selected = concepts.find((c) => c.id === selectedId) ?? concepts[0];
  const selectedProg = state.conceptProgress[selected.id];
  const isDiscovered = selectedProg?.status === 'discovered';
  const showName = isDiscovered || !selected.revealNameAfterDiscovery;

  const discoveredTotal = concepts.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-stone-900">
          Concept Map
        </h1>
        <span className="text-sm font-medium text-emerald-700">
          {discoveredTotal} / {concepts.length} discovered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-2.5">
          {stages.map((stage) => {
            const stageConcepts = concepts.filter((c) => c.stageId === stage.id);
            return (
              <div
                key={stage.id}
                className="rounded-2xl border border-stone-200/80 bg-white p-3.5"
              >
                <div className="text-xs font-semibold text-stone-500 mb-2">
                  {stage.number}. {stage.title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {stageConcepts.map((c) => {
                    const status = state.conceptProgress[c.id]?.status ?? 'undiscovered';
                    const title =
                      status === 'discovered' || !c.revealNameAfterDiscovery
                        ? c.discoveredTitle
                        : c.mysteryTitle;
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition cursor-pointer ${
                          active ? 'ring-2 ring-stone-900' : ''
                        } ${
                          status === 'discovered'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : status === 'exploring'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-stone-50 border-stone-200 text-stone-500'
                        }`}
                      >
                        {status === 'discovered' ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : status === 'undiscovered' ? (
                          <Lock className="h-3 w-3 text-stone-400" />
                        ) : null}
                        {title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Detail Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 rounded-3xl border border-stone-200/80 bg-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-stone-900">
            {showName ? selected.discoveredTitle : selected.mysteryTitle}
          </h2>

          <p className="text-sm text-stone-600 leading-relaxed">
            {isDiscovered ? selected.intuitionSummary : selected.realWorldExample}
          </p>

          {selectedProg?.studentExplanation && (
            <p className="rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-900 italic">
              “{selectedProg.studentExplanation}”
            </p>
          )}

          <button
            type="button"
            onClick={() => onExploreStage(selected.stageId)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
