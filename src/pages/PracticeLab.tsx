import React, { useState } from 'react';
import { InteractiveNumberLine } from '../components/visuals/InteractiveNumberLine';

type LabMode = 'number_line' | 'chocolates' | 'bank' | 'patterns';

export const PracticeLab: React.FC = () => {
  const [lab, setLab] = useState<LabMode>('number_line');
  const [nlStart, setNlStart] = useState(-5);
  const [nlAddend, setNlAddend] = useState(7);

  const [chocA, setChocA] = useState(18);
  const [chocB, setChocB] = useState(5);
  const [countFromA, setCountFromA] = useState(true);

  const [friendA, setFriendA] = useState(-8);
  const [friendB, setFriendB] = useState(-3);

  const [pA, setPA] = useState(2);
  const [pB, setPB] = useState(3);
  const [pC, setPC] = useState(4);
  const [groupLeft, setGroupLeft] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-stone-900">
          Practice Lab
        </h1>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'number_line' as const, label: 'Number Line' },
            { id: 'chocolates' as const, label: 'Counting' },
            { id: 'bank' as const, label: 'Debt' },
            { id: 'patterns' as const, label: 'Grouping' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLab(item.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                lab === item.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {lab === 'number_line' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: '-5 + 7', s: -5, a: 7 },
              { label: '-5 + 3', s: -5, a: 3 },
              { label: '5 + (-8)', s: 5, a: -8 },
              { label: '-5 + 5', s: -5, a: 5 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setNlStart(p.s);
                  setNlAddend(p.a);
                }}
                className="rounded-full bg-white border border-stone-200 px-3 py-1 font-math text-xs text-stone-700 hover:border-indigo-400 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
          <InteractiveNumberLine
            initialStart={nlStart}
            initialAddend={nlAddend}
            allowPredictMode
          />
        </div>
      )}

      {lab === 'chocolates' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-math text-lg font-bold text-stone-900">
              {chocA} + {chocB} = {chocA + chocB}
            </span>
            <button
              type="button"
              onClick={() => setCountFromA((v) => !v)}
              className="rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-semibold text-amber-900 cursor-pointer"
            >
              {countFromA ? `Count from ${chocA}` : 'Count from 1'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>First pile</span>
                <span className="font-math">{chocA}</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={chocA}
                onChange={(e) => setChocA(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
            <div className="rounded-2xl bg-teal-50 p-4">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Added</span>
                <span className="font-math">+{chocB}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={chocB}
                onChange={(e) => setChocB(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>
          </div>
          <div className="text-xs text-stone-600">
            Steps counted: <strong className="font-math">{countFromA ? chocB : chocA + chocB}</strong>
          </div>
        </div>
      )}

      {lab === 'bank' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Person A</span>
                <span className="font-math text-rose-700">{friendA} ₹</span>
              </div>
              <input
                type="range"
                min={-50}
                max={20}
                value={friendA}
                onChange={(e) => setFriendA(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Person B</span>
                <span className="font-math text-indigo-700">{friendB} ₹</span>
              </div>
              <input
                type="range"
                min={-50}
                max={20}
                value={friendB}
                onChange={(e) => setFriendB(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-800">
            {friendA === friendB
              ? 'Both positions are equal.'
              : `${friendA > friendB ? 'Person A' : 'Person B'} is closer to ₹0 (${Math.max(friendA, friendB)} > ${Math.min(friendA, friendB)}).`}
          </div>
        </div>
      )}

      {lab === 'patterns' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'a', val: pA, set: setPA },
              { label: 'b', val: pB, set: setPB },
              { label: 'c', val: pC, set: setPC },
            ].map((item) => (
              <input
                key={item.label}
                type="number"
                value={item.val}
                onChange={(e) => item.set(Number(e.target.value) || 0)}
                className="rounded-xl border border-stone-200 px-3 py-2 font-math text-sm font-bold text-stone-900"
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 font-math text-sm">
            <span>
              {groupLeft
                ? `(${pA} + ${pB}) + ${pC} = ${pA + pB + pC}`
                : `${pA} + (${pB} + ${pC}) = ${pA + pB + pC}`}
            </span>
            <button
              type="button"
              onClick={() => setGroupLeft((g) => !g)}
              className="rounded-full bg-violet-100 px-3 py-1 font-sans text-xs font-semibold text-violet-900 cursor-pointer"
            >
              Switch grouping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
