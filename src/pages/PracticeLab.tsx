import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  Candy,
  Compass,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { InteractiveNumberLine } from '../components/visuals/InteractiveNumberLine';

type LabMode = 'number_line' | 'chocolates' | 'bank' | 'patterns';

export const PracticeLab: React.FC = () => {
  const [lab, setLab] = useState<LabMode>('number_line');

  // Number line presets
  const [nlStart, setNlStart] = useState(-5);
  const [nlAddend, setNlAddend] = useState(7);

  // Chocolates lab state
  const [chocA, setChocA] = useState(18);
  const [chocB, setChocB] = useState(5);
  const [countFromA, setCountFromA] = useState(true);

  // Bank lab state
  const [friendA, setFriendA] = useState(-100);
  const [friendB, setFriendB] = useState(-1);
  const [balanceStart, setBalanceStart] = useState(-50);
  const [balanceDeposit, setBalanceDeposit] = useState(80);

  // Patterns lab state
  const [pA, setPA] = useState(-3);
  const [pB, setPB] = useState(8);
  const [pC, setPC] = useState(5);
  const [groupLeft, setGroupLeft] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200 mb-2">
          <FlaskConical className="h-3.5 w-3.5" />
          Open Discovery Sandbox
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
          Practice & Experimentation Lab
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Test your own hypotheses freely. Watch what happens to movement, debt, and grouping
          before jumping to conclusions.
        </p>
      </div>

      {/* Lab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'number_line' as const, label: 'Number Line', icon: Compass },
          { id: 'chocolates' as const, label: 'Counting-On', icon: Candy },
          { id: 'bank' as const, label: 'Debt & Zero', icon: Banknote },
          { id: 'patterns' as const, label: 'Order & Grouping', icon: ArrowLeftRight },
        ].map((item) => {
          const Icon = item.icon;
          const active = lab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLab(item.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                active
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Lab 1: Number Line */}
      {lab === 'number_line' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">Quick experiments:</span>
            {[
              { label: '-5 + 7 (Cross Zero →)', s: -5, a: 7 },
              { label: '3 + (-8) (Cross Zero ←)', s: 3, a: -8 },
              { label: '-4 + (-6) (Deeper Negative)', s: -4, a: -6 },
              { label: '6 + (-6) (Back to Zero)', s: 6, a: -6 },
              { label: '-7 + 0 (No Movement)', s: -7, a: 0 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setNlStart(p.s);
                  setNlAddend(p.a);
                }}
                className="rounded-full bg-white border border-stone-200 px-3 py-1 text-xs font-medium text-stone-700 hover:border-indigo-400 hover:text-indigo-700 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <InteractiveNumberLine
            initialStart={nlStart}
            initialAddend={nlAddend}
            allowPredictMode
            caption="Select any starting point, pick a positive or negative step, and watch the movement."
          />
        </div>
      )}

      {/* Lab 2: Counting-On */}
      {lab === 'chocolates' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Counting Everything vs. Counting Forward
              </h2>
              <p className="text-xs text-stone-500">
                Why recount the first pile when you already know how many are in it?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCountFromA((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                countFromA
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {countFromA ? 'Mode: Count Forward from Group A' : 'Mode: Count All From 1'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
              <div className="flex justify-between text-xs font-bold text-amber-900 mb-2">
                <span>Already Counted Pile</span>
                <span className="font-math">{chocA}</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                value={chocA}
                onChange={(e) => setChocA(Number(e.target.value))}
                className="w-full accent-amber-600 mb-3"
              />
              <div className="flex flex-wrap gap-1.5">
                {countFromA && chocA > 0 ? (
                  <div className="w-full rounded-xl bg-amber-200/70 py-3 text-center font-math text-sm font-bold text-amber-950">
                    Locked in: {chocA} (skip recounting!)
                  </div>
                ) : chocA === 0 ? (
                  <div className="text-xs text-amber-700">Empty pile (0)</div>
                ) : (
                  Array.from({ length: chocA }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-700 text-[10px] font-bold text-white"
                    >
                      {i + 1}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-teal-50 p-4 border border-teal-200">
              <div className="flex justify-between text-xs font-bold text-teal-900 mb-2">
                <span>Newly Added Chocolates</span>
                <span className="font-math">+{chocB}</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                value={chocB}
                onChange={(e) => setChocB(Number(e.target.value))}
                className="w-full accent-teal-600 mb-3"
              />
              <div className="flex flex-wrap gap-1.5">
                {chocB === 0 ? (
                  <div className="w-full rounded-xl border border-dashed border-teal-300 py-3 text-center text-xs text-teal-800">
                    0 added — total stays {chocA}!
                  </div>
                ) : (
                  Array.from({ length: chocB }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-[10px] font-bold text-white"
                    >
                      {countFromA ? chocA + i + 1 : i + 1}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700">
            <span>
              Steps counted:{' '}
              <strong className="font-math text-stone-900">
                {countFromA ? chocB : chocA + chocB}
              </strong>{' '}
              ({countFromA ? 'smart counting on!' : 'recounted everything from 1'})
            </span>
            <span className="font-math text-sm font-bold text-stone-900">
              {chocA} + {chocB} = {chocA + chocB}
            </span>
          </div>
        </div>
      )}

      {/* Lab 3: Bank & Debt */}
      {lab === 'bank' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-stone-900">
              Comparing Two Negative Balances
            </h2>
            <p className="text-xs text-stone-500">
              Slide either friend’s balance. Ask: who is closer to ₹0?
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Friend A Balance</span>
                  <span className="font-math text-rose-700">{friendA} ₹</span>
                </div>
                <input
                  type="range"
                  min={-150}
                  max={50}
                  value={friendA}
                  onChange={(e) => setFriendA(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Friend B Balance</span>
                  <span className="font-math text-indigo-700">{friendB} ₹</span>
                </div>
                <input
                  type="range"
                  min={-150}
                  max={50}
                  value={friendB}
                  onChange={(e) => setFriendB(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700">
              {friendA === friendB ? (
                <span>Both friends are in the exact same financial position!</span>
              ) : (
                <span>
                  <strong>{friendA > friendB ? 'Friend A' : 'Friend B'}</strong> is in the
                  better position, so mathematically{' '}
                  <span className="font-math font-bold text-stone-900">
                    {Math.max(friendA, friendB)} &gt; {Math.min(friendA, friendB)}
                  </span>
                  .
                </span>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-stone-900">
              Debt + Earnings Simulator
            </h2>
            <p className="text-xs text-stone-500">
              See how positive earnings cancel debt back toward ₹0.
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Starting Balance</span>
                  <span className="font-math">{balanceStart} ₹</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={balanceStart}
                  onChange={(e) => setBalanceStart(Number(e.target.value))}
                  className="w-full accent-stone-800"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Deposit (+) or New Expense (-)</span>
                  <span className="font-math">
                    {balanceDeposit >= 0 ? `+${balanceDeposit}` : balanceDeposit} ₹
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={balanceDeposit}
                  onChange={(e) => setBalanceDeposit(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Resulting Balance</span>
              <span className="font-math text-xl font-bold text-stone-900">
                {balanceStart + balanceDeposit} ₹
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lab 4: Patterns */}
      {lab === 'patterns' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Test Order, Grouping & Opposites
              </h2>
              <p className="text-xs text-stone-500">
                Try extreme numbers — negative, zero, positive — and see if the sums ever disagree.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGroupLeft((g) => !g)}
              className="rounded-full bg-violet-100 px-3.5 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-200 transition cursor-pointer"
            >
              Toggle Grouping
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'First (a)', val: pA, set: setPA },
              { label: 'Second (b)', val: pB, set: setPB },
              { label: 'Third (c)', val: pC, set: setPC },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                <div className="text-[11px] font-medium text-stone-500">{item.label}</div>
                <input
                  type="number"
                  value={item.val}
                  onChange={(e) => item.set(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-math text-sm font-bold text-stone-900"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
              <div className="text-[11px] font-bold uppercase text-violet-800 mb-1">
                Swapping Order
              </div>
              <div className="font-math text-sm text-stone-900">
                ({pA}) + ({pB}) = <strong>{pA + pB}</strong>
              </div>
              <div className="font-math text-sm text-stone-900 mt-1">
                ({pB}) + ({pA}) = <strong>{pB + pA}</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
              <div className="text-[11px] font-bold uppercase text-teal-800 mb-1">
                Changing Grouping
              </div>
              <div className="font-math text-sm text-stone-900">
                {groupLeft
                  ? `((${pA}) + (${pB})) + (${pC}) = ${(pA + pB) + pC}`
                  : `(${pA}) + ((${pB}) + (${pC})) = ${pA + (pB + pC)}`}
              </div>
              <div className="text-[11px] text-teal-800 mt-1">
                Both groupings always yield {pA + pB + pC}.
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="text-[11px] font-bold uppercase text-amber-800 mb-1">
                Zero & Opposite
              </div>
              <div className="font-math text-sm text-stone-900">
                ({pA}) + 0 = <strong>{pA}</strong>
              </div>
              <div className="font-math text-sm text-stone-900 mt-1">
                ({pA}) + ({-pA}) = <strong>{pA + -pA}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              Notice why each holds! Ready to explain it in your own words inside Stage 5 of the
              Socratic Room?
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
