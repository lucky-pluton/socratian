import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play, RotateCcw, Sparkles, Target } from 'lucide-react';

interface InteractiveNumberLineProps {
  initialStart?: number;
  initialAddend?: number;
  compact?: boolean;
  allowPredictMode?: boolean;
  caption?: string;
  onExperimentChange?: (start: number, addend: number, result: number) => void;
}

export const InteractiveNumberLine: React.FC<InteractiveNumberLineProps> = ({
  initialStart = -5,
  initialAddend = 7,
  compact = false,
  allowPredictMode = false,
  caption,
  onExperimentChange,
}) => {
  const [start, setStart] = useState<number>(initialStart);
  const [addend, setAddend] = useState<number>(initialAddend);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [predictMode, setPredictMode] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<string>('');
  const [predictionFeedback, setPredictionFeedback] = useState<string | null>(null);

  useEffect(() => {
    setStart(initialStart);
    setAddend(initialAddend);
    setCurrentStep(0);
    setIsAnimating(false);
    setHasRun(false);
    setPrediction('');
    setPredictionFeedback(null);
  }, [initialStart, initialAddend]);

  const target = start + addend;
  const totalSteps = Math.abs(addend);
  const direction = addend >= 0 ? 1 : -1;

  // Dynamic viewport window centered cleanly around start, target, and 0
  const { minTick, maxTick, stepTick } = useMemo(() => {
    const lo = Math.min(-10, start, target, 0);
    const hi = Math.max(10, start, target, 0);
    const span = hi - lo;
    if (span <= 24) {
      return { minTick: Math.min(-12, lo - 2), maxTick: Math.max(12, hi + 2), stepTick: 1 };
    }
    const step = span > 70 ? 10 : 5;
    return {
      minTick: Math.floor((lo - step) / step) * step,
      maxTick: Math.ceil((hi + step) / step) * step,
      stepTick: step,
    };
  }, [start, target]);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let v = minTick; v <= maxTick; v += stepTick) {
      arr.push(v);
    }
    return arr;
  }, [minTick, maxTick, stepTick]);

  // Animated position calculation
  const animatedPosition = useMemo(() => {
    if (!hasRun && !isAnimating) return start;
    if (totalSteps === 0) return start;
    return start + direction * currentStep;
  }, [start, direction, currentStep, totalSteps, hasRun, isAnimating]);

  useEffect(() => {
    if (!isAnimating) return;
    if (currentStep >= totalSteps) {
      setIsAnimating(false);
      setHasRun(true);
      onExperimentChange?.(start, addend, target);
      return;
    }
    const stepDelay = totalSteps > 15 ? 70 : 210;
    const timer = window.setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, stepDelay);
    return () => window.clearTimeout(timer);
  }, [isAnimating, currentStep, totalSteps, start, addend, target, onExperimentChange]);

  const handleAnimate = () => {
    if (predictMode && prediction.trim() !== '') {
      const predNum = Number(prediction);
      if (predNum === target) {
        setPredictionFeedback(`Spot on! Landing at ${target}. Watch the steps prove why!`);
      } else {
        setPredictionFeedback(`You predicted ${prediction} — let's trace the steps and see where we land!`);
      }
    } else {
      setPredictionFeedback(null);
    }
    setCurrentStep(0);
    setHasRun(true);
    setIsAnimating(true);
  };

  const handleReset = () => {
    setIsAnimating(false);
    setHasRun(false);
    setCurrentStep(0);
    setPredictionFeedback(null);
  };

  const toPercent = (val: number) => {
    if (maxTick === minTick) return 50;
    return ((val - minTick) / (maxTick - minTick)) * 100;
  };

  const startPct = toPercent(start);
  const activePct = toPercent(animatedPosition);
  const zeroPct = toPercent(0);
  const isPositive = addend >= 0;
  const crossesZero = (start < 0 && target > 0) || (start > 0 && target < 0);

  return (
    <div className={`rounded-2xl border border-stone-200/80 bg-white ${compact ? 'p-4' : 'p-6'} shadow-sm`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Target className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-semibold text-stone-900">
              Interactive Number Line
            </h3>
          </div>
          {caption && <p className="mt-1 text-xs text-stone-500">{caption}</p>}
        </div>

        <div className="flex items-center gap-2">
          {allowPredictMode && (
            <button
              type="button"
              onClick={() => {
                setPredictMode((p) => !p);
                setPredictionFeedback(null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                predictMode
                  ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {predictMode ? 'Predict First: ON' : 'Predict First'}
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              addend === 0
                ? 'bg-stone-100 text-stone-700'
                : isPositive
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
            }`}
          >
            {addend > 0 && <ArrowRight className="h-3.5 w-3.5" />}
            {addend < 0 && <ArrowLeft className="h-3.5 w-3.5" />}
            {addend > 0
              ? `Move Right +${addend}`
              : addend < 0
                ? `Move Left ${addend}`
                : 'Stay Put (+0)'}
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-stone-50 p-3 border border-stone-200/70">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 mb-1.5">
            <span>Starting Position</span>
            <span className="font-math text-sm font-bold text-stone-900">{start}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease start"
              onClick={() => {
                handleReset();
                setStart((s) => Math.max(-50, s - 1));
              }}
              className="h-7 w-7 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold"
            >
              -
            </button>
            <input
              type="range"
              min={-15}
              max={15}
              value={Math.max(-15, Math.min(15, start))}
              onChange={(e) => {
                handleReset();
                setStart(Number(e.target.value));
              }}
              className="w-full accent-indigo-600"
            />
            <button
              type="button"
              aria-label="Increase start"
              onClick={() => {
                handleReset();
                setStart((s) => Math.min(50, s + 1));
              }}
              className="h-7 w-7 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-stone-50 p-3 border border-stone-200/70">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 mb-1.5">
            <span>Number to Add</span>
            <span
              className={`font-math text-sm font-bold ${
                addend >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {addend >= 0 ? `+${addend}` : addend}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease addend"
              onClick={() => {
                handleReset();
                setAddend((a) => Math.max(-50, a - 1));
              }}
              className="h-7 w-7 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold"
            >
              -
            </button>
            <input
              type="range"
              min={-15}
              max={15}
              value={Math.max(-15, Math.min(15, addend))}
              onChange={(e) => {
                handleReset();
                setAddend(Number(e.target.value));
              }}
              className={`w-full ${addend >= 0 ? 'accent-emerald-600' : 'accent-rose-600'}`}
            />
            <button
              type="button"
              aria-label="Increase addend"
              onClick={() => {
                handleReset();
                setAddend((a) => Math.min(80, a + 1));
              }}
              className="h-7 w-7 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-800">
            <span>Live Position</span>
            <span className="font-math text-base font-bold text-indigo-950">
              {hasRun ? animatedPosition : '?'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleAnimate}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isAnimating ? 'Moving...' : hasRun ? 'Replay Jump' : 'Watch Jump'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset jump"
              className="inline-flex items-center justify-center rounded-lg bg-white border border-indigo-200 p-1.5 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {predictMode && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-amber-900">
            Before watching: Where do you think {start} + ({addend}) will land?
          </span>
          <input
            type="number"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="Your guess..."
            className="w-24 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-math text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {predictionFeedback && (
            <span className="text-xs font-medium text-amber-900">{predictionFeedback}</span>
          )}
        </div>
      )}

      {/* Visual Number Line Stage */}
      <div className="relative pt-14 pb-10 px-4 select-none">
        {/* Zero Reference Vertical Highlight */}
        <div
          className="absolute top-6 bottom-6 w-0.5 bg-amber-400/70 z-0"
          style={{ left: `calc(${zeroPct}% * 0.92 + 4%)` }}
        >
          <span className="absolute -top-5 -translate-x-1/2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
            0 (Anchor)
          </span>
        </div>

        {/* SVG Curved Movement Arc */}
        <svg
          className="absolute inset-x-4 top-2 h-16 w-[calc(100%-2rem)] overflow-visible pointer-events-none"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          {addend !== 0 && (hasRun || isAnimating) && (
            <motion.path
              d={`M ${startPct} 36 Q ${(startPct + activePct) / 2} ${
                Math.abs(activePct - startPct) > 25 ? 2 : 12
              } ${activePct} 36`}
              fill="none"
              stroke={isPositive ? '#059669' : '#E11D48'}
              strokeWidth="1.6"
              strokeDasharray="2.5 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </svg>

        {/* Main Axis Line */}
        <div className="relative h-1.5 w-full rounded-full bg-stone-200">
          {/* Highlighted span from start to active */}
          {(hasRun || isAnimating) && (
            <motion.div
              className={`absolute top-0 h-1.5 rounded-full ${
                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{
                left: `${Math.min(startPct, activePct)}%`,
                width: `${Math.abs(activePct - startPct)}%`,
              }}
              layout
            />
          )}

          {/* Start Marker */}
          <button
            type="button"
            title={`Start: ${start}`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-stone-800 border-2 border-white shadow z-10"
            style={{ left: `${startPct}%` }}
          />

          {/* Moving / Final Position Marker */}
          <motion.div
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center`}
            animate={{ left: `${activePct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div
              className={`-mt-11 mb-1 rounded-full px-2.5 py-0.5 font-math text-xs font-bold text-white shadow-md ${
                hasRun
                  ? isPositive
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                  : 'bg-indigo-600'
              }`}
            >
              {animatedPosition}
            </div>
            <div
              className={`h-5 w-5 rounded-full border-2 border-white shadow-md ${
                hasRun
                  ? isPositive
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                  : 'bg-indigo-600'
              }`}
            />
          </motion.div>
        </div>

        {/* Ticks */}
        <div className="relative mt-2 h-6 w-full">
          {ticks.map((tick) => {
            const pct = toPercent(tick);
            const isMajor = stepTick === 1 ? tick % 5 === 0 : true;
            return (
              <button
                key={tick}
                type="button"
                onClick={() => {
                  handleReset();
                  setStart(tick);
                }}
                title={`Click to start at ${tick}`}
                style={{ left: `${pct}%` }}
                className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              >
                <span
                  className={`block w-px ${
                    tick === 0
                      ? 'h-3 bg-amber-600 w-0.5'
                      : isMajor
                        ? 'h-2.5 bg-stone-400'
                        : 'h-1.5 bg-stone-300'
                  }`}
                />
                {(isMajor || stepTick > 1 || ticks.length <= 21) && (
                  <span
                    className={`mt-1 font-math text-[10px] transition ${
                      tick === start
                        ? 'font-bold text-stone-900'
                        : tick === 0
                          ? 'font-bold text-amber-700'
                          : 'text-stone-500 group-hover:text-indigo-600'
                    }`}
                  >
                    {tick}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insight Bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${start}-${addend}-${hasRun}-${isAnimating}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 border border-stone-200/70 text-xs"
        >
          <div className="flex items-center gap-2 font-math text-stone-800">
            <span className="font-semibold">{start}</span>
            <span>+</span>
            <span className={isPositive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              ({addend >= 0 ? `+${addend}` : addend})
            </span>
            <span>=</span>
            <span className="rounded-md bg-white px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200">
              {hasRun && !isAnimating ? target : isAnimating ? `${animatedPosition}...` : '?'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-600">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {crossesZero && hasRun && !isAnimating ? (
              <span>
                Crossed 0! Used <strong>{Math.abs(start)}</strong> step
                {Math.abs(start) === 1 ? '' : 's'} to reach 0, then{' '}
                <strong>{Math.abs(target)}</strong> more past 0.
              </span>
            ) : (
              <span>Tip: Click any number on the line to move your starting point.</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
