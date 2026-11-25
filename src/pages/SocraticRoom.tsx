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
  ) => Promise<boolean>;
  onPauseToHome: () => void;
  onSaveToJournal: (title: string, content: string) => Promise<void>;
}

function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
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
  const [showPinnedVisual, setShowPinnedVisual] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const wasLoadingRef = useRef<boolean>(loading);

  const stage = stages.find((s) => s.id === state.currentStageId) ?? stages[0];
  const stageMessages = state.messages.filter((m) => m.stageId === stage.id);

  const activeVisualHint: VisualHint | undefined =
    [...stageMessages].reverse().find((m) => m.visualHint)?.visualHint ??
    stage.openingVisualHint;

  const latestTutorId = [...stageMessages]
    .reverse()
    .find((m) => m.role === 'tutor')?.id;

  const ls = state.learningState;
  const totalQuestions = questions.length || 34;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stageMessages.length, loading]);

  // Initial desktop focus when entering the room or switching stages
  useEffect(() => {
    if (loading || isTouchDevice()) return;
    const rafId = window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el || document.activeElement === el) return;
      el.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(rafId);
    // Run only on mount / stage switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id]);

  // Restore focus to chat input after tutor finishes responding (desktop only)
  useEffect(() => {
    const justFinishedLoading = wasLoadingRef.current && !loading;
    wasLoadingRef.current = loading;

    if (!justFinishedLoading || isTouchDevice()) return;

    const rafId = window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const active = document.activeElement;
      // If user is already typing in input, preserve cursor position untouched
      if (active === el) return;
      // Do not steal focus if user moved focus to an unrelated control outside the chat form
      const safeToFocus =
        !active ||
        active === document.body ||
        Boolean(formRef.current?.contains(active));
      if (safeToFocus) {
        el.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const ok = await onSendTurn(trimmed, 'answer');
    if (ok) {
      setInput('');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 gap-3">
      {/* Subtle Single-Line Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-500 shrink-0">
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
          onClick={() => setShowPinnedVisual((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 transition cursor-pointer"
        >
          {showPinnedVisual ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {showPinnedVisual ? 'Hide board' : 'Pin board'}
        </button>
      </div>

      {/* Optional Pinned Visual Board */}
      {showPinnedVisual && (
        <div className="shrink-0">
          <StageVisualDock stageId={stage.id} visualHint={activeVisualHint} />
        </div>
      )}

      {/* Full-Screen Conversation & Prominent Inline Visuals */}
      <div className="flex-1 min-h-0 rounded-3xl border border-stone-200/80 bg-white shadow-xs flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 space-y-5">
          {stageMessages.map((msg) => {
            if (msg.role === 'visual' && msg.visualHint) {
              return (
                <div key={msg.id} className="w-full max-w-3xl">
                  <StageVisualDock
                    stageId={msg.stageId}
                    visualHint={msg.visualHint}
                  />
                </div>
              );
            }

            const isTutor = msg.role === 'tutor';
            const isLatestTutor = msg.id === latestTutorId;
            return (
              <div
                key={msg.id}
                className={`flex ${isTutor ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-4 py-3 leading-relaxed ${
                    isTutor
                      ? isLatestTutor
                        ? 'bg-[#FFFBF3] border border-amber-200/70 text-stone-900 font-display text-base sm:text-xl'
                        : 'bg-[#F8F5EE] text-stone-700 text-sm sm:text-base'
                      : 'bg-stone-900 text-white text-sm sm:text-base'
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

        {/* Docked Simple Response Bar */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-stone-100 p-3.5 sm:p-4 bg-[#FDFBF8] flex items-center gap-2.5"
        >
          <button
            type="button"
            disabled={loading}
            onClick={() => void onSendTurn('Hint please', 'hint')}
            title="Show a helpful visual clue"
            className="inline-flex h-11 px-3.5 items-center gap-1.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <input
            ref={inputRef}
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
            className="inline-flex h-11 px-5 items-center justify-center gap-1.5 rounded-2xl bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
