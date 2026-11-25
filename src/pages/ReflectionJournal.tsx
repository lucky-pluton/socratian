import React, { useState } from 'react';
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
  onAddEntry,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddEntry({
        stageId: state.currentStageId,
        conceptId: null,
        entryType: 'reflection',
        title: title.trim(),
        content: content.trim(),
      });
      setTitle('');
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-stone-900">
        Journal
      </h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-stone-200/80 bg-white p-5 space-y-3"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you notice?"
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
        />
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write it in your own words..."
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="rounded-2xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
        >
          {submitting ? 'Saving...' : 'Save Note'}
        </button>
      </form>

      <div className="space-y-3">
        {state.journal.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-stone-200/80 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-stone-400 mb-1">
              <span>Stage {entry.stageId.replace('stage-', '')}</span>
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            </div>
            <h2 className="font-display text-base font-bold text-stone-900">
              {entry.title}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
