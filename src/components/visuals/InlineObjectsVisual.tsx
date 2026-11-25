import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, Minus, Play, Plus, RotateCcw } from 'lucide-react';
import type { VisualHint, VisualObjectKind } from '../../types/socratic';

const ObjectGlyph: React.FC<{ kind: VisualObjectKind; dimmed?: boolean }> = ({
  kind,
  dimmed = false,
}) => {
  const opacity = dimmed ? 'opacity-25' : 'opacity-100';
  if (kind === 'apple') {
    return (
      <svg viewBox="0 0 28 28" className={`h-7 w-7 ${opacity}`} aria-hidden="true">
        <path d="M14 6 C14 3, 17 2, 18 2" stroke="#5C4033" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M14 5 C17 3, 20 4, 19 7 C17 7, 15 6, 14 5 Z" fill="#16A34A" />
        <path
          d="M14 8 C9 7, 5 11, 6 17 C7 22, 11 25, 14 24 C17 25, 21 22, 22 17 C23 11, 19 7, 14 8 Z"
          fill="#E11D48"
        />
        <ellipse cx="10.5" cy="13" rx="1.6" ry="2.8" fill="#FDA4AF" opacity="0.65" />
      </svg>
    );
  }
  if (kind === 'book') {
    return (
      <svg viewBox="0 0 28 28" className={`h-7 w-7 ${opacity}`} aria-hidden="true">
        <rect x="5" y="4" width="17" height="20" rx="2.5" fill="#0D9488" />
        <rect x="8" y="4" width="14" height="20" rx="2" fill="#14B8A6" />
        <rect x="10" y="8" width="9" height="3" rx="1" fill="#CCFBF1" />
        <line x1="8" y1="21" x2="21" y2="21" stroke="#F8FAFC" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === 'balloon') {
    return (
      <svg viewBox="0 0 28 28" className={`h-7 w-7 ${opacity}`} aria-hidden="true">
        <ellipse cx="14" cy="11" rx="7" ry="8.5" fill="#F59E0B" />
        <ellipse cx="11.5" cy="8.5" rx="1.8" ry="2.8" fill="#FEF3C7" opacity="0.7" />
        <path d="M14 19.5 Q12 23 15 26" stroke="#78716C" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (kind === 'coin') {
    return (
      <svg viewBox="0 0 28 28" className={`h-7 w-7 ${opacity}`} aria-hidden="true">
        <circle cx="14" cy="14" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
        <text x="14" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350F">
          ₹
        </text>
      </svg>
    );
  }
  if (kind === 'dot') {
    return (
      <svg viewBox="0 0 24 24" className={`h-6 w-6 ${opacity}`} aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="#6366F1" />
      </svg>
    );
  }
  // Default: chocolate square
  return (
    <svg viewBox="0 0 28 28" className={`h-7 w-7 ${opacity}`} aria-hidden="true">
      <rect x="4" y="4" width="20" height="20" rx="4" fill="#78350F" />
      <rect x="6.5" y="6.5" width="6.5" height="6.5" rx="1.2" fill="#92400E" />
      <rect x="15" y="6.5" width="6.5" height="6.5" rx="1.2" fill="#92400E" />
      <rect x="6.5" y="15" width="6.5" height="6.5" rx="1.2" fill="#92400E" />
      <rect x="15" y="15" width="6.5" height="6.5" rx="1.2" fill="#92400E" />
    </svg>
  );
};

interface InlineObjectsVisualProps {
  hint: VisualHint;
}

export const InlineObjectsVisual: React.FC<InlineObjectsVisualProps> = ({ hint }) => {
  const prefersReducedMotion = useReducedMotion();
  const kind: VisualObjectKind = hint.objectKind ?? 'chocolate';

  const [countA, setCountA] = useState<number>(hint.groupA ?? 2);
  const [countB, setCountB] = useState<number>(hint.groupB ?? 2);
  const [countC] = useState<number>(hint.groupC ?? 0);
  const [merged, setMerged] = useState<boolean>(false);
  const [countingStep, setCountingStep] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [swapped, setSwapped] = useState<boolean>(false);
  const [regroupLeft, setRegroupLeft] = useState<boolean>(true);
  const [tappedTotal, setTappedTotal] = useState<number>(0);

  useEffect(() => {
    setCountA(hint.groupA ?? 2);
    setCountB(hint.groupB ?? 2);
    setMerged(false);
    setCountingStep(0);
    setIsCounting(false);
    setSwapped(false);
    setRegroupLeft(true);
    setTappedTotal(0);
  }, [hint]);

  const isCountOn = hint.animate === 'count_on' || countA > 10;
  const isTakeAway = hint.type === 'take_away_objects' || hint.operation === 'subtract';
  const isSwap = hint.type === 'commutative_swap' || hint.operation === 'swap';
  const isRegroup = hint.type === 'associative_regroup' || hint.operation === 'regroup';

  const totalCombined = isTakeAway ? Math.max(0, countA - countB) : countA + countB;
  const stepLimit = isCountOn ? countB : totalCombined;

  useEffect(() => {
    if (!isCounting) return;
    if (countingStep >= stepLimit) {
      setIsCounting(false);
      return;
    }
    const delay = prefersReducedMotion ? 80 : 280;
    const t = window.setTimeout(() => {
      setCountingStep((s) => s + 1);
    }, delay);
    return () => window.clearTimeout(t);
  }, [isCounting, countingStep, stepLimit, prefersReducedMotion]);

  const handleMergeAndCount = () => {
    setMerged(true);
    setCountingStep(0);
    setIsCounting(true);
  };

  const handleReset = () => {
    setMerged(false);
    setCountingStep(0);
    setIsCounting(false);
    setTappedTotal(0);
  };

  // 1. Associative Regrouping Visual
  if (isRegroup) {
    const a = countA;
    const b = countB;
    const c = countC || 4;
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-600">
            {hint.caption || 'Group the collections differently'}
          </span>
          <button
            type="button"
            onClick={() => setRegroupLeft((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-200 cursor-pointer"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Regroup
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {regroupLeft ? (
            <>
              <motion.div
                layout={!prefersReducedMotion}
                className="flex items-center gap-2 rounded-2xl border-2 border-violet-300 bg-violet-50/70 px-3 py-2"
              >
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(a, 8) }).map((_, i) => (
                    <ObjectGlyph key={`a-${i}`} kind={kind} />
                  ))}
                </div>
                <span className="text-stone-400 font-bold">+</span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(b, 8) }).map((_, i) => (
                    <ObjectGlyph key={`b-${i}`} kind={kind} />
                  ))}
                </div>
              </motion.div>
              <span className="text-stone-500 font-bold">+</span>
              <motion.div
                layout={!prefersReducedMotion}
                className="flex gap-1 rounded-2xl border border-stone-200 bg-white px-3 py-2"
              >
                {Array.from({ length: Math.min(c, 8) }).map((_, i) => (
                  <ObjectGlyph key={`c-${i}`} kind={kind} />
                ))}
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                layout={!prefersReducedMotion}
                className="flex gap-1 rounded-2xl border border-stone-200 bg-white px-3 py-2"
              >
                {Array.from({ length: Math.min(a, 8) }).map((_, i) => (
                  <ObjectGlyph key={`a-${i}`} kind={kind} />
                ))}
              </motion.div>
              <span className="text-stone-500 font-bold">+</span>
              <motion.div
                layout={!prefersReducedMotion}
                className="flex items-center gap-2 rounded-2xl border-2 border-violet-300 bg-violet-50/70 px-3 py-2"
              >
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(b, 8) }).map((_, i) => (
                    <ObjectGlyph key={`b-${i}`} kind={kind} />
                  ))}
                </div>
                <span className="text-stone-400 font-bold">+</span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(c, 8) }).map((_, i) => (
                    <ObjectGlyph key={`c-${i}`} kind={kind} />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 2. Commutative Swap Visual
  if (isSwap) {
    const first = swapped ? countB : countA;
    const second = swapped ? countA : countB;
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-600">
            {hint.caption || 'Switch the order of the two groups'}
          </span>
          <button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200 cursor-pointer"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Switch order
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.div
            layout={!prefersReducedMotion}
            className="flex flex-wrap gap-1 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2.5"
          >
            {Array.from({ length: Math.min(first, 10) }).map((_, i) => (
              <ObjectGlyph key={`f-${i}`} kind={kind} />
            ))}
          </motion.div>
          <span className="font-bold text-stone-400">+</span>
          <motion.div
            layout={!prefersReducedMotion}
            className="flex flex-wrap gap-1 rounded-2xl border border-teal-200 bg-teal-50/70 px-3 py-2.5"
          >
            {Array.from({ length: Math.min(second, 10) }).map((_, i) => (
              <ObjectGlyph key={`s-${i}`} kind={kind} />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // 3. Take Away Visual
  if (isTakeAway) {
    const remaining = Math.max(0, countA - countB);
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-600">
            {hint.caption || `Start with ${countA}, take away ${countB}`}
          </span>
          <button
            type="button"
            onClick={() => setMerged((m) => !m)}
            className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-200 cursor-pointer"
          >
            {merged ? 'Reset' : `Take away ${countB}`}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
          {Array.from({ length: Math.min(countA, 12) }).map((_, i) => {
            const removed = merged && i >= remaining;
            return (
              <motion.div
                key={i}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: removed ? 0.25 : 1, scale: removed ? 0.85 : 1 }
                }
              >
                <ObjectGlyph kind={kind} dimmed={removed} />
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Combine Objects (with optional Counting On & Interactive Controls)
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-stone-600">
          {hint.caption || 'Tap the objects or put the groups together'}
        </span>

        <div className="flex items-center gap-1.5">
          {countB > 0 && (
            <button
              type="button"
              onClick={handleMergeAndCount}
              className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              {isCountOn ? `Count from ${countA}` : 'Put together'}
            </button>
          )}
          {(merged || tappedTotal > 0) && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset objects"
              className="rounded-full border border-stone-200 bg-white p-1.5 text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {!merged ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Group A */}
          <div className="rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 flex flex-col items-center gap-1.5">
            {isCountOn ? (
              <div className="rounded-xl bg-amber-100 px-4 py-2 font-math text-sm font-bold text-amber-950">
                Jar of {countA}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-w-[180px] justify-center">
                {Array.from({ length: countA }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTappedTotal((t) => t + 1)}
                    className="relative cursor-pointer hover:scale-105 transition"
                  >
                    <ObjectGlyph kind={kind} />
                  </button>
                ))}
              </div>
            )}
            {hint.interactive && !isCountOn && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <button
                  type="button"
                  aria-label="Remove from first group"
                  onClick={() => setCountA((v) => Math.max(0, v - 1))}
                  className="h-5 w-5 rounded bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-math text-[11px]">{countA}</span>
                <button
                  type="button"
                  aria-label="Add to first group"
                  onClick={() => setCountA((v) => Math.min(10, v + 1))}
                  className="h-5 w-5 rounded bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <span className="text-lg font-bold text-stone-400">+</span>

          {/* Group B */}
          <div className="rounded-2xl border border-teal-200/80 bg-white px-3.5 py-2.5 flex flex-col items-center gap-1.5">
            {countB === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 px-4 py-2 text-xs text-stone-400">
                Empty (0)
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-w-[180px] justify-center">
                {Array.from({ length: countB }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTappedTotal((t) => t + 1)}
                    className="cursor-pointer hover:scale-105 transition"
                  >
                    <ObjectGlyph kind={kind} />
                  </button>
                ))}
              </div>
            )}
            {hint.interactive && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <button
                  type="button"
                  aria-label="Remove from second group"
                  onClick={() => setCountB((v) => Math.max(0, v - 1))}
                  className="h-5 w-5 rounded bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-math text-[11px]">{countB}</span>
                <button
                  type="button"
                  aria-label="Add to second group"
                  onClick={() => setCountB((v) => Math.min(10, v + 1))}
                  className="h-5 w-5 rounded bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-amber-200 bg-white p-3.5 flex flex-wrap items-center justify-center gap-2"
        >
          {isCountOn && (
            <span className="rounded-xl bg-amber-100 px-3 py-1.5 font-math text-sm font-bold text-amber-950">
              {countA}
            </span>
          )}
          {Array.from({ length: isCountOn ? countB : totalCombined }).map((_, i) => {
            const countNum = isCountOn ? countA + i + 1 : i + 1;
            const visibleCount = i < countingStep;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <ObjectGlyph kind={kind} />
                <span
                  className={`font-math text-[11px] font-bold transition-opacity ${
                    visibleCount ? 'text-amber-700 opacity-100' : 'opacity-0'
                  }`}
                >
                  {countNum}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {tappedTotal > 0 && !merged && (
        <div className="text-center font-math text-xs font-semibold text-amber-800">
          Counted: {tappedTotal}
        </div>
      )}
    </div>
  );
};
