import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Banknote,
  Candy,
  Layers,
  Scale,
  Thermometer,
} from 'lucide-react';
import type { StageId, VisualHint } from '../../types/socratic';
import { InteractiveNumberLine } from './InteractiveNumberLine';

interface StageVisualDockProps {
  stageId: StageId;
  visualHint?: VisualHint;
}

export const StageVisualDock: React.FC<StageVisualDockProps> = ({
  stageId,
  visualHint,
}) => {
  const fallbackByStage: Record<StageId, VisualHint['type']> = {
    'stage-1': 'chocolates',
    'stage-2': 'context_blocks',
    'stage-3': 'chocolates',
    'stage-4': 'property_tiles',
    'stage-5': 'property_tiles',
    'stage-6': 'bank_ledger',
    'stage-7': 'bank_ledger',
    'stage-8': 'number_line',
    'stage-9': 'bank_ledger',
    'stage-10': 'elevation_temp',
  };
  const hintType = visualHint?.type ?? fallbackByStage[stageId] ?? 'chocolates';

  if (hintType === 'number_line') {
    return (
      <InteractiveNumberLine
        initialStart={visualHint?.start ?? -5}
        initialAddend={visualHint?.addend ?? 7}
        compact
        caption={visualHint?.caption}
      />
    );
  }

  if (hintType === 'chocolates') {
    return (
      <ChocolatesVisual
        groupA={visualHint?.groupA ?? 3}
        groupB={visualHint?.groupB ?? 2}
        labelA={visualHint?.labelA ?? 'First group'}
        labelB={visualHint?.labelB ?? 'Added group'}
        caption={visualHint?.caption}
      />
    );
  }

  if (hintType === 'context_blocks') {
    return (
      <ContextBlocksVisual
        groupA={visualHint?.groupA ?? 4}
        groupB={visualHint?.groupB ?? 3}
        unit={visualHint?.unit ?? 'km'}
        labelA={visualHint?.labelA ?? 'Part A'}
        labelB={visualHint?.labelB ?? 'Part B'}
        caption={visualHint?.caption}
      />
    );
  }

  if (hintType === 'bank_ledger') {
    return <BankLedgerVisual visualHint={visualHint} />;
  }

  if (hintType === 'property_tiles') {
    return <PropertyTilesVisual visualHint={visualHint} />;
  }

  return <ElevationTempVisual visualHint={visualHint} />;
};

const ChocolatesVisual: React.FC<{
  groupA: number;
  groupB: number;
  labelA: string;
  labelB: string;
  caption?: string;
}> = ({ groupA, groupB, labelA, labelB, caption }) => {
  const [countMode, setCountMode] = useState<'separate' | 'count_on'>('separate');
  const displayA = Math.min(groupA, 24);
  const displayB = Math.min(groupB, 12);

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Candy className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-semibold text-stone-900">
            Tactile Quantity Explorer
          </h3>
        </div>
        <div className="flex rounded-full bg-stone-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setCountMode('separate')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              countMode === 'separate' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Separate Groups
          </button>
          <button
            type="button"
            onClick={() => setCountMode('count_on')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              countMode === 'count_on' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
            }`}
          >
            Count Forward from {groupA}
          </button>
        </div>
      </div>

      {caption && <p className="text-xs text-stone-500 mb-3">{caption}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-2">
            <span>{labelA}</span>
            <span className="font-math rounded-md bg-white px-2 py-0.5 border border-amber-200">
              {groupA}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {countMode === 'count_on' && groupA > 6 ? (
              <div className="w-full rounded-lg bg-amber-200/70 border border-amber-300 px-3 py-2 text-center font-math text-sm font-bold text-amber-950">
                Already counted: {groupA}
              </div>
            ) : (
              Array.from({ length: displayA }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-700 text-[10px] font-bold text-amber-50 shadow-xs"
                >
                  {i + 1}
                </motion.span>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl bg-teal-50/70 border border-teal-200/70 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-teal-900 mb-2">
            <span>{labelB}</span>
            <span className="font-math rounded-md bg-white px-2 py-0.5 border border-teal-200">
              +{groupB}
            </span>
          </div>
          {displayB === 0 ? (
            <div className="rounded-lg border border-dashed border-teal-300 py-3 text-center text-xs text-teal-700">
              Empty box (0 items)
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: displayB }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-[10px] font-bold text-white shadow-xs"
                >
                  {countMode === 'count_on' ? groupA + i + 1 : i + 1}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContextBlocksVisual: React.FC<{
  groupA: number;
  groupB: number;
  unit: string;
  labelA: string;
  labelB: string;
  caption?: string;
}> = ({ groupA, groupB, unit, labelA, labelB, caption }) => {
  const mismatch = unit.includes('?') || unit.includes('vs');
  const maxVal = Math.max(groupA, groupB, 1);

  return (
    <div className="rounded-2xl border border-teal-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Scale className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-semibold text-stone-900">
            Context & Unit Inspector
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            mismatch ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
          }`}
        >
          {mismatch ? 'Check compatibility!' : `Shared unit: ${unit}`}
        </span>
      </div>
      {caption && <p className="text-xs text-stone-500 mb-3">{caption}</p>}

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
            <span>{labelA}</span>
            <span className="font-math font-bold">{groupA}</span>
          </div>
          <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-teal-600"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(12, (groupA / maxVal) * 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
            <span>{labelB}</span>
            <span className="font-math font-bold">{groupB}</span>
          </div>
          <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${mismatch ? 'bg-rose-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(12, (groupB / maxVal) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BankLedgerVisual: React.FC<{ visualHint?: VisualHint }> = ({ visualHint }) => {
  const unit = visualHint?.unit ?? '₹';
  const isCompare =
    visualHint?.compareA !== undefined && visualHint?.compareB !== undefined;

  if (isCompare) {
    const a = visualHint!.compareA!;
    const b = visualHint!.compareB!;
    return (
      <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Banknote className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-semibold text-stone-900">
            Financial Position Comparator
          </h3>
        </div>
        {visualHint?.caption && (
          <p className="text-xs text-stone-500 mb-3">{visualHint.caption}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: visualHint?.labelA || 'Account A', val: a },
            { label: visualHint?.labelB || 'Account B', val: b },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex flex-col items-center text-center"
            >
              <span className="text-xs font-medium text-stone-500">{item.label}</span>
              <span
                className={`mt-1 font-math text-xl font-bold ${
                  item.val < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {item.val < 0 ? `-${unit}${Math.abs(item.val)}` : `+${unit}${item.val}`}
              </span>
              <span className="mt-1 text-[11px] text-stone-500">
                {item.val < 0
                  ? `${unit}${Math.abs(item.val)} away from ${unit}0`
                  : `${unit}${item.val} above ${unit}0`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const start = visualHint?.start ?? 0;
  const addend = visualHint?.addend ?? -50;
  const net = start + addend;

  return (
    <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <Banknote className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-semibold text-stone-900">
          Bank Balance & Debt Ledger
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5">
          <div className="text-[11px] text-stone-500">{visualHint?.labelA || 'Start'}</div>
          <div className="font-math text-base font-bold text-stone-900">
            {start < 0 ? `-${unit}${Math.abs(start)}` : `${unit}${start}`}
          </div>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5">
          <div className="text-[11px] text-stone-500">{visualHint?.labelB || 'Change'}</div>
          <div
            className={`font-math text-base font-bold ${
              addend >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {addend >= 0 ? `+${unit}${addend}` : `-${unit}${Math.abs(addend)}`}
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
          <div className="text-[11px] text-amber-800">Net Position</div>
          <div
            className={`font-math text-base font-bold ${
              net >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {net >= 0 ? `+${unit}${net}` : `-${unit}${Math.abs(net)}`}
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyTilesVisual: React.FC<{ visualHint?: VisualHint }> = ({ visualHint }) => {
  const a = visualHint?.groupA ?? 4;
  const b = visualHint?.groupB ?? 9;
  const c = visualHint?.groupC;
  const [swapped, setSwapped] = useState(false);

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Layers className="h-4 w-4" />
          </span>
          <h3 className="font-display text-base font-semibold text-stone-900">
            Pattern & Structure Tiles
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setSwapped((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-200 transition"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {c !== undefined ? 'Switch Grouping' : 'Swap Order'}
        </button>
      </div>

      {c === undefined ? (
        <div className="flex items-center justify-center gap-3 rounded-xl bg-violet-50/70 p-4 border border-violet-100">
          <motion.div layout className="rounded-xl bg-amber-500 px-4 py-2 font-math text-base font-bold text-white shadow-xs">
            {swapped ? b : a}
          </motion.div>
          <span className="font-math text-lg font-bold text-stone-500">+</span>
          <motion.div layout className="rounded-xl bg-teal-600 px-4 py-2 font-math text-base font-bold text-white shadow-xs">
            {swapped ? a : b}
          </motion.div>
          <span className="font-math text-lg font-bold text-stone-500">=</span>
          <div className="rounded-xl bg-white px-4 py-2 font-math text-base font-bold text-violet-900 border border-violet-200">
            {a + b}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-violet-50/70 p-4 border border-violet-100 font-math text-sm font-bold">
          {!swapped ? (
            <>
              <span className="rounded-xl bg-violet-200/80 px-3 py-2 text-violet-950">
                ({a} + {b})
              </span>
              <span>+</span>
              <span className="rounded-xl bg-teal-600 px-3 py-2 text-white">{c}</span>
            </>
          ) : (
            <>
              <span className="rounded-xl bg-amber-500 px-3 py-2 text-white">{a}</span>
              <span>+</span>
              <span className="rounded-xl bg-violet-200/80 px-3 py-2 text-violet-950">
                ({b} + {c})
              </span>
            </>
          )}
          <span>=</span>
          <span className="rounded-xl bg-white px-3 py-2 text-violet-900 border border-violet-200">
            {a + b + c}
          </span>
        </div>
      )}
    </div>
  );
};

const ElevationTempVisual: React.FC<{ visualHint?: VisualHint }> = ({ visualHint }) => {
  const start = visualHint?.start ?? -4;
  const step1 = visualHint?.addend ?? 9;
  const step2 = visualHint?.groupC;
  const unit = visualHint?.unit ?? '°C';
  const afterStep1 = start + step1;
  const finalVal = step2 !== undefined ? afterStep1 + step2 : afterStep1;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Thermometer className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-semibold text-stone-900">
          Multi-Step Change Tracker
        </h3>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="rounded-xl bg-stone-100 px-3 py-2">
          <div className="text-stone-500">Start</div>
          <div className="font-math text-sm font-bold text-stone-900">
            {start} {unit}
          </div>
        </div>
        <span className="font-bold text-stone-400">→</span>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <div className="text-emerald-700">Step 1 ({step1 >= 0 ? `+${step1}` : step1})</div>
          <div className="font-math text-sm font-bold text-emerald-950">
            {afterStep1} {unit}
          </div>
        </div>
        {step2 !== undefined && (
          <>
            <span className="font-bold text-stone-400">→</span>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="text-amber-800">Step 2 ({step2 >= 0 ? `+${step2}` : step2})</div>
              <div className="font-math text-sm font-bold text-amber-950">
                {finalVal} {unit}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
