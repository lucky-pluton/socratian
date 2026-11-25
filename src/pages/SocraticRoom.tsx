import React, { useEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  BrainCircuit,
  Eye,
  EyeOff,
  Feather,
  HelpCircle,
  Lightbulb,
  Loader2,
  PauseCircle,
  Send,
  Sparkles,
} from 'lucide-react';
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
  concepts,
  questions,
  loading,
  error,
  onSelectStage,
  onSendTurn,
  onPauseToHome,
  onSaveToJournal,
}) => {
  const [input, setInput] = useState('');
  const [showVisual, setShowVisual] = useState<boolean>(
    state.currentStageId === 'stage-8'
  );
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stage = stages.find((s) => s.id === state.currentStageId) ?? stages[0];
  const stageMessages = state.messages.filter((m) => m.stageId === stage.id);

  // Auto-open visual aid when entering the Number Line stage (Stage 8)
  useEffect(() => {
    if (stage.id === 'stage-8') {
      setShowVisual(true);
    }
  }, [stage.id]);

  const activeVisualHint: VisualHint | undefined =
    [...stageMessages].reverse().find((m) => m.visualHint)?.visualHint ??
    stage.openingVisualHint;

  const ls = state.learningState;
  const activeQuestion =
    questions.find((q) => q.id === ls.current_question) ?? questions[0];
  const currentConceptDef = concepts.find(
    (c) => c.id === activeQuestion?.conceptId
  );
  const currentConceptName =
    state.conceptProgress[activeQuestion?.conceptId ?? '']?.status === 'discovered' ||
    !currentConceptDef?.revealNameAfterDiscovery
      ? currentConceptDef?.discoveredTitle
      : currentConceptDef?.mysteryTitle;

  const nextStage = stages.find((s) => s.number === stage.number + 1);
  const upcomingConceptDef = nextStage
    ? concepts.find((c) => c.id === nextStage.conceptIds[0])
    : undefined;
  const upcomingConceptName = upcomingConceptDef
    ? state.conceptProgress[upcomingConceptDef.id]?.status === 'discovered' ||
      !upcomingConceptDef.revealNameAfterDiscovery
      ? upcomingConceptDef.discoveredTitle
      : upcomingConceptDef.mysteryTitle
    : 'Independent Mastery';

  const totalDiscoveredConcepts = Object.values(state.conceptProgress).filter(
    (c) => c.status === 'discovered'
  ).length;
  const totalQuestions = questions.length || 34;
  const progressPercent = Math.round(
    (ls.completed_questions.length / totalQuestions) * 100
  );

  // Latest tutor question is highlighted prominently above the quiet history
  const latestTutorMessage = [...stageMessages]
    .reverse()
    .find((m) => m.role === 'tutor');

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

  const handleSave = async (msgId: string, content: string) => {
    await onSaveToJournal(`Thought from ${stage.title}`, content);
    setSavedMsgId(msgId);
    window.setTimeout(() => setSavedMsgId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Subtle Top Journey Bar */}
      <div className="rounded-2xl border border-stone-200/80 bg-[#FDFBF7] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="rounded-full bg-amber-100/90 px-2.5 py-1 font-semibold text-amber-900">
              {ls.topic}
            </span>
            <select
              aria-label="Choose learning stage"
              value={stage.id}
              onChange={(e) => onSelectStage(e.target.value as StageId)}
              className="rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  Stage {s.number} of {stages.length}: {s.title}
                </option>
              ))}
            </select>
            <span className="text-stone-500 hidden sm:inline">
              · Exploring <strong className="text-stone-700">{currentConceptName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowVisual((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition cursor-pointer ${
                showVisual
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {showVisual ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showVisual ? 'Hide visual' : 'Show visual'}
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnostics((v) => !v)}
              title="Toggle mentor insight notes"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition cursor-pointer ${
                showDiagnostics
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-500 border border-stone-200 hover:text-stone-800'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onPauseToHome}
              title="Pause and return later"
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          </div>
        </div>

        {/* Quiet Journey Progress Line */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-stone-500">
          <div className="flex-1 min-w-[140px] h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
          <span>
            Step <strong className="font-math text-stone-700">{ls.completed_questions.length}/{totalQuestions}</strong>
          </span>
          <span>
            Discovered <strong className="font-math text-emerald-700">{totalDiscoveredConcepts}/{concepts.length}</strong>
          </span>
          <span className="hidden md:inline text-stone-400">
            Next up: {upcomingConceptName}
          </span>
        </div>
      </div>

      {/* Main Calm Workspace */}
      <div
        className={`grid grid-cols-1 gap-6 items-start ${
          showVisual ? 'xl:grid-cols-12' : ''
        }`}
      >
        {/* Optional Visual Aid */}
        {showVisual && (
          <div className="xl:col-span-5 xl:sticky xl:top-6">
            <StageVisualDock stageId={stage.id} visualHint={activeVisualHint} />
          </div>
        )}

        {/* Prominent Conversation Space */}
        <div
          className={`${
            showVisual ? 'xl:col-span-7' : 'max-w-3xl mx-auto w-full'
          } rounded-3xl border border-stone-200/90 bg-white shadow-sm flex flex-col min-h-[540px] max-h-[680px]`}
        >
          {/* Prominent Active Question Header */}
          {latestTutorMessage && (
            <div className="border-b border-stone-100 bg-[#FFFDF9] px-6 py-5 rounded-t-3xl">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Socratia asks
                </span>
                {ls.pending_followup && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                    Exploring together
                  </span>
                )}
              </div>
              <p className="font-display text-lg sm:text-xl font-medium text-stone-900 leading-relaxed">
                {latestTutorMessage.content}
              </p>
            </div>
          )}

          {/* Quiet Scrollable Conversation History */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
            {stageMessages.map((msg) => {
              const isTutor = msg.role === 'tutor';
              const isLatestTutor = latestTutorMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`group max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isTutor
                        ? isLatestTutor
                          ? 'bg-amber-50/50 text-stone-700 border border-amber-200/60 rounded-tl-sm'
                          : 'bg-[#F8F5EE] text-stone-800 rounded-tl-sm'
                        : 'bg-stone-900 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(msg.id, msg.content)}
                        className={`inline-flex items-center gap-1 text-[10px] opacity-60 group-hover:opacity-100 transition cursor-pointer ${
                          isTutor ? 'text-stone-500 hover:text-amber-700' : 'text-stone-300 hover:text-amber-300'
                        }`}
                      >
                        <BookmarkPlus className="h-3 w-3" />
                        {savedMsgId === msg.id ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {isTutor && showDiagnostics && msg.assessment && (
                    <div className="mt-1 max-w-[85%] rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] text-stone-600">
                      <span className="font-semibold text-stone-800">Noticed:</span>{' '}
                      {msg.assessment.whatUnderstood}
                      {msg.assessment.activeMisconception && (
                        <span className="text-rose-700">
                          {' '}· Untangling: {msg.assessment.activeMisconception}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-stone-400 px-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                Thinking with you...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* One Clear Response Area */}
          <div className="border-t border-stone-100 p-4 bg-[#FDFBF8] rounded-b-3xl space-y-2.5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Share your thought in your own words..."
                className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send response"
                className="inline-flex h-11 px-4 items-center justify-center gap-1.5 rounded-2xl bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 px-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendTurn('Could I get a small hint?', 'hint')}
                className="inline-flex items-center gap-1 hover:text-teal-700 disabled:opacity-50 transition cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Need a hint?
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendTurn(input.trim() || 'Why does this work?', 'ask_why')}
                className="inline-flex items-center gap-1 hover:text-amber-700 disabled:opacity-50 transition cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Ask why
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendTurn('Can we make this simpler?', 'simplify')}
                className="inline-flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50 transition cursor-pointer"
              >
                <Feather className="h-3.5 w-3.5" />
                Make this simpler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
