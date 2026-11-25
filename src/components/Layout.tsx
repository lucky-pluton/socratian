import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import type { StudentState } from '../types/socratic';

export type NavTab =
  | 'home'
  | 'room'
  | 'map'
  | 'lab'
  | 'journal'
  | 'progress';

interface LayoutProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  state: StudentState;
  onReset: () => void;
  children: React.ReactNode;
}

const PRIMARY_NAV: Array<{ id: NavTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'room', label: 'Learn' },
  { id: 'map', label: 'Map' },
  { id: 'lab', label: 'Lab' },
  { id: 'journal', label: 'Journal' },
];

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onSelectTab,
  state,
  onReset,
  children,
}) => {
  return (
    <div
      className={`flex flex-col bg-[#FAF7F2] text-[#1E2430] ${
        activeTab === 'room' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Minimal Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-stone-900 cursor-pointer"
          >
            <span className="h-8 w-8 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Socratia
            </span>
          </button>

          <nav className="flex items-center gap-1 sm:gap-1.5">
            {PRIMARY_NAV.map((item) => {
              const active =
                activeTab === item.id ||
                (activeTab === 'progress' && item.id === 'home');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onReset}
            title="Start over"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="sr-only">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={activeTab === 'room' ? 'flex-1 flex flex-col min-h-0' : 'flex-1'}>
        <div
          className={
            activeTab === 'room'
              ? 'mx-auto w-full max-w-6xl flex-1 flex flex-col min-h-0 px-3 py-3 sm:px-6 sm:py-4'
              : 'mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10'
          }
        >
          {children}
        </div>
      </main>

      {/* Quiet Footer (hidden on full-screen Learn tab) */}
      {activeTab !== 'room' && (
        <footer className="py-4 text-center text-[11px] text-stone-400">
          {state.aiMode === 'gemini' ? 'Gemini AI Tutor' : 'Demo Mode'} ·{' '}
          <button
            type="button"
            onClick={() => onSelectTab('progress')}
            className="underline hover:text-stone-600 cursor-pointer"
          >
            Milestones
          </button>{' '}
          ·{' '}
          <button
            type="button"
            onClick={onReset}
            className="underline hover:text-stone-600 cursor-pointer"
          >
            Reset
          </button>
        </footer>
      )}
    </div>
  );
};
