import React from 'react';
import {
  Award,
  BookOpen,
  Compass,
  FlaskConical,
  Home,
  Map,
  MessageCircleQuestion,
  RotateCcw,
  Sparkles,
  Flame,
} from 'lucide-react';
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

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'room', label: 'Socratic Room', icon: MessageCircleQuestion },
  { id: 'map', label: 'Concept Map', icon: Map },
  { id: 'lab', label: 'Practice Lab', icon: FlaskConical },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: Award },
];

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onSelectTab,
  state,
  onReset,
  children,
}) => {
  const discoveredCount = Object.values(state.conceptProgress).filter(
    (c) => c.status === 'discovered'
  ).length;
  const totalConcepts = Object.keys(state.conceptProgress).length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF7F2] text-[#1E2430]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 border-r border-stone-200/80 bg-[#FDFBF7] px-4 py-6 justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight text-stone-900">
                Socratia
              </div>
              <div className="text-[11px] font-medium text-stone-500">
                Discover why math works
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.id === 'map' && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {discoveredCount}/{totalConcepts}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Curiosity Streak
              </span>
              <span className="font-math">{state.curiosityStreak}d</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-amber-800">
              <span>Reasoning Score</span>
              <span className="font-math font-bold">{state.reasoningScore} pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  state.aiMode === 'gemini' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {state.aiMode === 'gemini' ? 'Gemini AI Tutor' : 'Interactive Demo Mode'}
            </span>
            <button
              type="button"
              onClick={onReset}
              title="Restart learning journey"
              className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-600 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-stone-200/80 bg-[#FDFBF7]/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
            <Compass className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">Socratia</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900">
            <Sparkles className="h-3 w-3" />
            {discoveredCount}/{totalConcepts}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              state.aiMode === 'gemini'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            {state.aiMode === 'gemini' ? 'Gemini' : 'Demo'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:pl-68 pb-20 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur grid grid-cols-6 px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center rounded-xl py-1 text-[10px] font-medium transition ${
                active ? 'text-stone-900 font-semibold' : 'text-stone-500'
              }`}
            >
              <Icon className={`h-4 w-4 mb-0.5 ${active ? 'text-amber-600' : ''}`} />
              <span className="truncate max-w-full px-1">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
