import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Compass, Lock, Sparkles } from 'lucide-react';
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
    concepts[0]?.id ?? 'need-for-addition'
  );

  const selectedConcept =
    concepts.find((c) => c.id === selectedId) ?? concepts[0];
  const selectedProg = state.conceptProgress[selectedConcept.id];
  const selectedDiscovered = selectedProg?.status === 'discovered';
  const showFormalTitle =
    selectedDiscovered || !selectedConcept.revealNameAfterDiscovery;

  const discoveredTotal = concepts.filter(
    (c) => state.conceptProgress[c.id]?.status === 'discovered'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Concept Discovery Map
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Watch how everyday intuitions connect into deeper mathematical laws. Hidden pattern
            names unlock only after you discover why they work.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
          {discoveredTotal} of {concepts.length} Discovered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Connected Stage Graph */}
        <div className="lg:col-span-8 space-y-4">
          {stages.map((stage, stageIdx) => {
            const stageConcepts = concepts.filter((c) => c.stageId === stage.id);
            return (
              <div key={stage.id} className="relative">
                <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: stage.accentColor }}
                      >
                        {stage.number}
                      </span>
                      <h2 className="font-display text-base font-bold text-stone-900">
                        {stage.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => onExploreStage(stage.id)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      Open in Room →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {stageConcepts.map((concept) => {
                      const prog = state.conceptProgress[concept.id];
                      const status = prog?.status ?? 'undiscovered';
                      const isSelected = concept.id === selectedId;
                      const displayTitle =
                        status === 'discovered' || !concept.revealNameAfterDiscovery
                          ? concept.discoveredTitle
                          : concept.mysteryTitle;

                      return (
                        <motion.button
                          key={concept.id}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedId(concept.id)}
                          className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                            isSelected ? 'ring-2 ring-stone-900' : ''
                          } ${
                            status === 'discovered'
                              ? 'border-emerald-200 bg-emerald-50/70'
                              : status === 'exploring'
                                ? 'border-amber-300 bg-amber-50/70'
                                : 'border-stone-200 bg-stone-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              {displayTitle}
                            </span>
                            {status === 'discovered' ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            ) : status === 'exploring' ? (
                              <Compass className="h-4 w-4 shrink-0 text-amber-600" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            )}
                          </div>
                          {concept.prerequisites.length > 0 && (
                            <div className="mt-1.5 text-[10px] text-stone-500">
                              Builds on:{' '}
                              {concept.prerequisites
                                .map((pid) => {
                                  const pDef = concepts.find((x) => x.id === pid);
                                  const pDisc =
                                    state.conceptProgress[pid]?.status === 'discovered';
                                  return pDisc || !pDef?.revealNameAfterDiscovery
                                    ? pDef?.discoveredTitle
                                    : pDef?.mysteryTitle;
                                })
                                .join(', ')}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {stageIdx < stages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="h-4 w-0.5 bg-stone-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Concept Detail Inspector */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                selectedDiscovered
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedProg?.status === 'exploring'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-stone-100 text-stone-600'
              }`}
            >
              {selectedProg?.status ?? 'undiscovered'}
            </span>
            <span className="font-math text-xs text-stone-500">
              Mastery: {selectedProg?.mastery ?? 0}%
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-stone-900">
              {showFormalTitle
                ? selectedConcept.discoveredTitle
                : selectedConcept.mysteryTitle}
            </h3>
            {!showFormalTitle && (
              <p className="mt-1 text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
                Formal name stays hidden until you discover the pattern in Stage 5!
              </p>
            )}
          </div>

          {selectedDiscovered ? (
            <>
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Why It Works
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {selectedConcept.intuitionSummary}
                </p>
              </div>

              {selectedProg?.studentExplanation && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Your Discovery Note
                  </div>
                  <p className="text-xs text-emerald-950 italic">
                    “{selectedProg.studentExplanation}”
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 text-xs text-stone-600 space-y-2">
              <p>
                <strong>Real-world clue:</strong> {selectedConcept.realWorldExample}
              </p>
              <p>
                Explore this idea with Socratia in the Learning Room to unlock its full insight.
              </p>
            </div>
          )}

          {selectedProg?.activeMisconception && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <strong>Currently untangling:</strong> {selectedProg.activeMisconception}
            </div>
          )}

          <button
            type="button"
            onClick={() => onExploreStage(selectedConcept.stageId)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
          >
            Explore in Socratic Room
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
