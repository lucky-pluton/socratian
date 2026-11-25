import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeftRight,
  Banknote,
  Layers,
  Minus,
  Plus,
  Scale,
  Thermometer,
} from 'lucide-react';
import type { StageId, VisualHint } from '../../types/socratic';
import { InlineObjectsVisual } from './InlineObjectsVisual';
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
    'stage-1': 'combine_objects',
    'stage-2': 'context_blocks',
    'stage-3': 'combine_objects',
    'stage-4': 'commutative_swap',
    'stage-5': 'associative_regroup',
    'stage-6': 'bank_ledger',
    'stage-7': 'bank_ledger',
    'stage-8': 'number_line',
    'stage-9': 'bank_ledger',
    'stage-10': 'elevation_temp',
  };
  const hintType = visualHint?.type ?? fallbackByStage[stageId] ?? 'combine_objects';

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

  if (
    hintType === 'combine_objects' ||
    hintType === 'chocolates' ||
    hintType === 'take_away_objects' ||
    hintType === 'commutative_swap' ||
    hintType === 'associative_regroup'
  ) {
    return (
      <InlineObjectsVisual
        hint={{
          ...(visualHint ?? { type: hintType }),
          type: hintType,
        }}
      />
    );
  }

  if (hintType === 'context_blocks') {
    return (
      <ContextBlocksVisual
        groupA={visualHint?.groupA ?? 4}
        groupB={visualHint?.groupB ?? 3}
        unit={visualHint?.unit ?? 'books'}
        labelA={visualHint?.labelA ?? 'Group A'}
        labelB={visualHint?.labelB ?? 'Group B'}
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

const ContextBlocksVisual: React.FC<{
  groupA: number;
  groupB: number;
  unit: string;
  labelA: string;
  labelB: string;
  caption?: string;
}> = ({ groupA, groupB, unit, labelA, labelB, caption }) => {
  const prefersReducedMotion = useReducedMotion();
  const mismatch = unit.includes('?') || unit.includes('vs') || unit.includes('ignore');
  const maxVal = Math.max(groupA, groupB, 1);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <Scale className="h-3.5 w-3.5 text-teal-600" />
          {caption || 'Compare the two quantities'}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            mismatch ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
          }`}
        >
          {mismatch ? 'Different things!' : `Same: ${unit}`}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-stone-700 mb-1">
            <span>{labelA}</span>
            <span className="font-math font-bold">{groupA}</span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-200/70 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-teal-600"
              initial={prefersReducedMotion ? false : { width: 0 }}
              animate={{ width: `${Math.max(12, (groupA / maxVal) * 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-stone-700 mb-1">
            <span>{labelB}</span>
            <span className="font-math font-bold">{groupB}</span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-200/70 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${mismatch ? 'bg-rose-500' : 'bg-amber-500'}`}
              initial={prefersReducedMotion ? false : { width: 0 }}
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

  const [startVal, setStartVal] = useState<number>(visualHint?.start ?? 5);
  const [changeVal, setChangeVal] = useState<number>(visualHint?.addend ?? -8);

  if (isCompare) {
    const a = visualHint!.compareA!;
    const b = visualHint!.compareB!;
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
          <Banknote className="h-4 w-4 text-rose-600" />
          {visualHint?.caption || 'Compare positions below zero'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: visualHint?.labelA || 'Person A', val: a },
            { label: visualHint?.labelB || 'Person B', val: b },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-stone-200 bg-white p-3 text-center"
            >
              <div className="text-xs text-stone-500">{item.label}</div>
              <div
                className={`mt-1 font-math text-lg font-bold ${
                  item.val < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {item.val < 0 ? `-${unit}${Math.abs(item.val)}` : `+${unit}${item.val}`}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                {Math.abs(item.val)} away from {unit}0
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const net = startVal + changeVal;
  const pct = Math.max(5, Math.min(95, ((net + 10) / 20) * 100));

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
        <span className="inline-flex items-center gap-1.5">
          <Banknote className="h-4 w-4 text-rose-600" />
          {visualHint?.caption || 'Balance around ₹0'}
        </span>
        <span
          className={`font-math text-sm font-bold ${
            net < 0 ? 'text-rose-600' : net > 0 ? 'text-emerald-700' : 'text-stone-700'
          }`}
        >
          {net < 0 ? `-${unit}${Math.abs(net)}` : net > 0 ? `+${unit}${net}` : `${unit}0`}
        </span>
      </div>

      {/* Interactive Zero Reference Meter */}
      <div className="relative h-3 rounded-full bg-stone-200 overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-stone-700 z-10" />
        <div
          className={`absolute top-0 bottom-0 transition-all ${
            net < 0 ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{
            left: net < 0 ? `${pct}%` : '50%',
            width: `${Math.abs(pct - 50)}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-math text-stone-400">
        <span>Below 0 (Owe)</span>
        <span className="font-bold text-stone-600">{unit}0</span>
        <span>Above 0 (Have)</span>
      </div>

      {visualHint?.interactive && (
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-white border border-stone-200 px-2.5 py-1.5">
            <span className="text-stone-500">Start</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStartVal((v) => v - 1)}
                className="p-0.5 rounded bg-stone-100 cursor-pointer"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-math font-bold">{startVal}</span>
              <button
                type="button"
                onClick={() => setStartVal((v) => v + 1)}
                className="p-0.5 rounded bg-stone-100 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white border border-stone-200 px-2.5 py-1.5">
            <span className="text-stone-500">Change</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setChangeVal((v) => v - 1)}
                className="p-0.5 rounded bg-stone-100 cursor-pointer"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-math font-bold">
                {changeVal >= 0 ? `+${changeVal}` : changeVal}
              </span>
              <button
                type="button"
                onClick={() => setChangeVal((v) => v + 1)}
                className="p-0.5 rounded bg-stone-100 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyTilesVisual: React.FC<{ visualHint?: VisualHint }> = ({ visualHint }) => {
  const prefersReducedMotion = useReducedMotion();
  const a = visualHint?.groupA ?? 3;
  const b = visualHint?.groupB ?? 4;
  const c = visualHint?.groupC;
  const [swapped, setSwapped] = useState(false);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <Layers className="h-4 w-4 text-violet-600" />
          Try switching
        </span>
        <button
          type="button"
          onClick={() => setSwapped((s) => !s)}
          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-200 cursor-pointer"
        >
          <ArrowLeftRight className="h-3 w-3" />
          {c !== undefined ? 'Regroup' : 'Swap'}
        </button>
      </div>

      {c === undefined ? (
        <div className="flex items-center justify-center gap-3 font-math text-base font-bold">
          <motion.div
            layout={!prefersReducedMotion}
            className="rounded-xl bg-amber-500 px-4 py-2 text-white"
          >
            {swapped ? b : a}
          </motion.div>
          <span className="text-stone-400">+</span>
          <motion.div
            layout={!prefersReducedMotion}
            className="rounded-xl bg-teal-600 px-4 py-2 text-white"
          >
            {swapped ? a : b}
          </motion.div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 font-math text-sm font-bold">
          {!swapped ? (
            <>
              <span className="rounded-xl bg-violet-200 px-3 py-2 text-violet-950">
                ({a} + {b})
              </span>
              <span>+</span>
              <span className="rounded-xl bg-teal-600 px-3 py-2 text-white">{c}</span>
            </>
          ) : (
            <>
              <span className="rounded-xl bg-amber-500 px-3 py-2 text-white">{a}</span>
              <span>+</span>
              <span className="rounded-xl bg-violet-200 px-3 py-2 text-violet-950">
                ({b} + {c})
              </span>
            </>
          )}
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

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-4 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
        <Thermometer className="h-4 w-4 text-emerald-700" />
        Step-by-step picture
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="rounded-xl bg-white border border-stone-200 px-3 py-2">
          <div className="text-stone-400">Start</div>
          <div className="font-math font-bold text-stone-900">
            {start} {unit}
          </div>
        </div>
        <span className="text-stone-400">→</span>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <div className="text-emerald-700">{step1 >= 0 ? `+${step1}` : step1}</div>
          <div className="font-math font-bold text-emerald-950">
            {afterStep1} {unit}
          </div>
        </div>
        {step2 !== undefined && (
          <>
            <span className="text-stone-400">→</span>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="text-amber-800">{step2 >= 0 ? `+${step2}` : step2}</div>
              <div className="font-math font-bold text-amber-950">?</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
