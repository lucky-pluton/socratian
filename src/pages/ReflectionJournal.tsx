import React, { useState } from 'react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import type {
  ConceptDefinition,
  JournalEntry,
  StageDefinition,
  StageId,
  StudentState,
} from '../types/socratic';

interface ReflectionJournalProps {
  state: StudentState;
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  onAddEntry: (payload: {
    stageId: StageId;
    conceptId: string | null;
    entryType: JournalEntry['entryType'];
    title: string;
    content: string;
  }) => Promise<void>;
}

export const ReflectionJournal: React.FC<ReflectionJournalProps> = ({
  state,
  stages,
  concepts,
  onAddEntry,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stageId, setStageId] = useState<StageId>(state.currentStageId);
  const [entryType, setEntryType] = useState<JournalEntry['entryType']>('explanation');
  const [conceptId, setConceptId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddEntry({
        stageId,
        conceptId: conceptId || null,
        entryType,
        title: title.trim(),
        content: content.trim(),
      });
      setTitle('');
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleEntries = state.journal.filter((j) =>
    filterType === 'all' ? true : j.entryType === filterType
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
          Reflection & Discovery Journal
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Mathematics sticks when you express it in your own words. Record discoveries,
          explanations, and curious questions here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* New Entry Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 font-display text-lg font-bold text-stone-900">
            <Plus className="h-5 w-5 text-amber-600" />
            Record a New Thought
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                Entry Type
              </label>
              <select
                value={entryType}
                onChange={(e) =>
                  setEntryType(e.target.value as JournalEntry['entryType'])
                }
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800"
              >
                <option value="explanation">My Explanation</option>
                <option value="discovery">Discovery</option>
                <option value="question">Curious Question</option>
                <option value="reflection">Reflection</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                Stage
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value as StageId)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    Stage {s.number}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Related Concept (Optional)
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800"
            >
              <option value="">General insight</option>
              {concepts
                .filter((c) => c.stageId === stageId)
                .map((c) => {
                  const disc = state.conceptProgress[c.id]?.status === 'discovered';
                  return (
                    <option key={c.id} value={c.id}>
                      {disc || !c.revealNameAfterDiscovery
                        ? c.discoveredTitle
                        : c.mysteryTitle}
                    </option>
                  );
                })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Why -1 is greater than -100"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              In Your Own Words
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain why it works or what surprised you..."
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="w-full rounded-2xl bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save to Journal'}
          </button>
        </form>

        {/* Journal Feed */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Notes' },
              { id: 'discovery', label: 'Discoveries' },
              { id: 'explanation', label: 'Explanations' },
              { id: 'question', label: 'Questions' },
              { id: 'reflection', label: 'Reflections' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  filterType === f.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visibleEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-sm text-stone-500">
              No journal entries in this category yet.
            </div>
          ) : (
            visibleEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      entry.entryType === 'discovery'
                        ? 'bg-emerald-100 text-emerald-800'
                        : entry.entryType === 'question'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {entry.entryType === 'discovery' ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <BookOpen className="h-3 w-3" />
                    )}
                    {entry.entryType}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Stage {entry.stageId.replace('stage-', '')} ·{' '}
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-stone-900">
                  {entry.title}
                </h3>
                <p className="mt-1 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
