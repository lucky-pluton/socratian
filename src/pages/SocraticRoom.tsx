import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkPlus,
  BrainCircuit,
  HelpCircle,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  ConceptDefinition,
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
  loading: boolean;
  error: string | null;
  onSelectStage: (stageId: StageId) => void;
  onSendTurn: (
    message: string,
    action?: 'answer' | 'ask_why' | 'hint'
  ) => Promise<void>;
  onSaveToJournal: (title: string, content: string) => Promise<void>;
}

export const SocraticRoom: React.FC<SocraticRoomProps> = ({
  state,
  stages,
  concepts,
  loading,
  error,
  onSelectStage,
  onSendTurn,
  onSaveToJournal,
}) => {
  const [input, setInput] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stage = stages.find((s) => s.id === state.currentStageId) ?? stages[0];
  const stageMessages = state.messages.filter((m) => m.stageId === stage.id);

  // Use the latest tutor visualHint in this stage, or fall back to stage opening visual
  const activeVisualHint: VisualHint | undefined =
    [...stageMessages].reverse().find((m) => m.visualHint)?.visualHint ??
    stage.openingVisualHint;

  const discoveredInStage = stage.conceptIds.filter(
    (cid) => state.conceptProgress[cid]?.status === 'discovered'
  ).length;

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
    await onSaveToJournal(`Insight from Stage ${stage.number}`, content);
    setSavedMsgId(msgId);
    window.setTimeout(() => setSavedMsgId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Stage Switcher Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {stages.map((s) => {
            const active = s.id === stage.id;
            const doneCount = s.conceptIds.filter(
              (cid) => state.conceptProgress[cid]?.status === 'discovered'
            ).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStage(s.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                style={active ? { backgroundColor: s.accentColor } : undefined}
              >
                {s.number}. {s.title.split(' ')[0]}{' '}
                <span className="opacity-75 font-math">
                  ({doneCount}/{s.conceptIds.length})
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDiagnostics((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
            showDiagnostics
              ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          {showDiagnostics ? 'Mentor Mind: Visible' : 'Show Mentor Mind'}
        </button>
      </div>

      {/* Stage Banner & Concept Progress */}
      <div className="rounded-2xl border border-stone-200/80 bg-[#FDFBF7] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Stage {stage.number} · {stage.subtitle}
          </div>
          <h1 className="font-display text-xl font-bold text-stone-900">
            {stage.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stage.conceptIds.map((cid) => {
            const def = concepts.find((c) => c.id === cid);
            const prog = state.conceptProgress[cid];
            const status = prog?.status ?? 'undiscovered';
            const label =
              status === 'discovered' || !def?.revealNameAfterDiscovery
                ? def?.discoveredTitle
                : def?.mysteryTitle;
            return (
              <span
                key={cid}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                  status === 'discovered'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : status === 'exploring'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-white text-stone-400 border-stone-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {status === 'undiscovered' && def?.revealNameAfterDiscovery
                  ? 'Hidden Pattern ?'
                  : label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Interactive Visual Dock + Socratic Conversation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Interactive Math Visual Dock */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-3">
          <StageVisualDock stageId={stage.id} visualHint={activeVisualHint} />
          <div className="rounded-2xl border border-stone-200/70 bg-white/80 p-3.5 text-xs text-stone-600 flex items-center justify-between">
            <span>
              Stage Mastery:{' '}
              <strong className="text-stone-900">
                {discoveredInStage} of {stage.conceptIds.length}
              </strong>{' '}
              ideas discovered
            </span>
            <span className="text-amber-700 font-medium">One question at a time</span>
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="xl:col-span-7 rounded-3xl border border-stone-200/90 bg-white shadow-sm flex flex-col h-[640px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {stageMessages.map((msg) => {
              const isTutor = msg.role === 'tutor';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isTutor
                        ? 'bg-[#F8F5EE] text-stone-900 border border-stone-200/80 rounded-tl-sm'
                        : 'bg-stone-900 text-white rounded-tr-sm shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isTutor ? 'text-amber-700' : 'text-stone-300'
                        }`}
                      >
                        {isTutor ? 'Socratia · Mentor' : 'You'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSave(msg.id, msg.content)}
                        title="Save to Reflection Journal"
                        className={`inline-flex items-center gap-1 text-[10px] transition cursor-pointer ${
                          isTutor
                            ? 'text-stone-400 hover:text-amber-700'
                            : 'text-stone-400 hover:text-amber-300'
                        }`}
                      >
                        <BookmarkPlus className="h-3 w-3" />
                        {savedMsgId === msg.id ? 'Saved!' : 'Journal'}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Live AI Diagnostic Pill */}
                  {isTutor && showDiagnostics && msg.assessment && (
                    <div className="mt-1.5 max-w-[88%] rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-[11px] text-indigo-950 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-semibold">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] uppercase">
                          {msg.assessment.strategyUsed.replace('_', ' ')}
                        </span>
                        <span>Understood: {msg.assessment.whatUnderstood}</span>
                      </div>
                      {msg.assessment.activeMisconception && (
                        <div className="text-rose-700">
                          Addressing misconception: {msg.assessment.activeMisconception}
                        </div>
                      )}
                      <div className="text-indigo-700">
                        Next goal: {msg.assessment.nextPedagogicalGoal}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-stone-500 px-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                Socratia is reflecting on your reasoning...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Action Toolbar + Input */}
          <div className="border-t border-stone-200/80 p-3 sm:p-4 bg-[#FDFBF8] rounded-b-3xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendTurn(input.trim() || 'Why does this work?', 'ask_why')}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-50 transition cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Ask Why
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendTurn('Can I get a gentle hint?', 'hint')}
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 border border-teal-200 hover:bg-teal-100 disabled:opacity-50 transition cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Gentle Hint
              </button>
              <span className="ml-auto hidden sm:inline text-[11px] text-stone-400">
                Explain your thinking in your own words
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Share your answer and why you think it works..."
                className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send response"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
