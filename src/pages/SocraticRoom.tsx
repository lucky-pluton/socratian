import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lightbulb, Loader2, Send } from 'lucide-react';
import type {
  ConceptDefinition,
  SequentialQuestion,
  StageDefinition,
  StageId,
  StudentState,
  VisualHint,
} from '../types/socratic';
import { StageVisualDock } from '../components/visuals/StageVisualDock';

interface SocraticRoomProps {
  state: StudentState;
  stages: StageDefinition[];
  concepts: ConceptDefinition[];
  questions: SequentialQuestion[];
  loading: boolean;
  error: string | null;
  onSelectStage: (stageId: StageId) => void;
  onSendTurn: (
    message: string,
    action?: 'answer' | 'ask_why' | 'hint' | 'simplify'
  ) => Promise<void>;
  onPauseToHome: () => void;
  onSaveToJournal: (title: string, content: string) => Promise<void>;
}

export const SocraticRoom: React.FC<SocraticRoomProps> = ({
  state,
  stages,
  questions,
  loading,
  error,
  onSelectStage,
  onSendTurn,
}) => {
  const [input, setInput] = useState('');
  const [showVisual, setShowVisual] = useState<boolean>(
    state.currentStageId === 'stage-8'
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stage = stages.find((s) => s.id === state.currentStageId) ?? stages[0];
  const stageMessages = state.messages.filter((m) => m.stageId === stage.id);

  useEffect(() => {
    if (stage.id === 'stage-8') {
      setShowVisual(true);
    }
  }, [stage.id]);

  const activeVisualHint: VisualHint | undefined =
    [...stageMessages].reverse().find((m) => m.visualHint)?.visualHint ??
    stage.openingVisualHint;

  const ls = state.learningState;
  const totalQuestions = questions.length || 34;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stageMessages.length, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    await onSendTurn(trimmed, 'answer');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Subtle Single-Line Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <select
            aria-label="Choose stage"
            value={stage.id}
            onChange={(e) => onSelectStage(e.target.value as StageId)}
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.number} of {stages.length}: {s.title}
              </option>
            ))}
          </select>
          <span className="font-math text-[11px] text-stone-400">
            {ls.completed_questions.length}/{totalQuestions}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowVisual((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 transition cursor-pointer"
        >
          {showVisual ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showVisual ? 'Hide visual' : 'Visual'}
        </button>
      </div>

      {/* Optional Visual Aid */}
      {showVisual && (
        <StageVisualDock stageId={stage.id} visualHint={activeVisualHint} />
      )}

      {/* Calm Conversation Area */}
      <div className="rounded-3xl border border-stone-200/80 bg-white shadow-xs flex flex-col min-h-[460px] max-h-[620px]">
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 space-y-4">
          {stageMessages.map((msg, idx) => {
            const isTutor = msg.role === 'tutor';
            const isLast = idx === stageMessages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex ${isTutor ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ${
                    isTutor
                      ? isLast
                        ? 'bg-[#FFFBF3] border border-amber-200/70 text-stone-900 font-display text-base sm:text-lg'
                        : 'bg-[#F8F5EE] text-stone-700 text-sm'
                      : 'bg-stone-900 text-white text-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-stone-400 px-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
              Thinking...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* One Simple Response Box + Send + Optional Hint */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-stone-100 p-3.5 sm:p-4 bg-[#FDFBF8] rounded-b-3xl flex items-center gap-2"
        >
          <button
            type="button"
            disabled={loading}
            onClick={() => onSendTurn('Hint please', 'hint')}
            title="Get a small hint"
            className="inline-flex h-11 px-3 items-center gap-1 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your answer..."
            className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="inline-flex h-11 px-4 items-center justify-center gap-1.5 rounded-2xl bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
