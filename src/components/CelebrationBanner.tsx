import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Sparkles, X } from 'lucide-react';
import type { BadgeDefinition, ConceptDefinition } from '../types/socratic';

interface CelebrationBannerProps {
  concepts: ConceptDefinition[];
  badges: BadgeDefinition[];
  onDismiss: () => void;
}

export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({
  concepts,
  badges,
  onDismiss,
}) => {
  if (concepts.length === 0 && badges.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        className="mb-5 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-4 shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            {concepts.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Concept Discovered!
                  </div>
                  <div className="font-display text-base font-bold text-stone-900">
                    {c.discoveredTitle}
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5">{c.intuitionSummary}</p>
                </div>
              </div>
            ))}

            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 pt-1">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                  <Award className="h-4 w-4" />
                </span>
                <div className="text-xs text-stone-800">
                  <span className="font-bold text-amber-900">Badge Unlocked: {b.title}</span> —{' '}
                  {b.description}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss celebration"
            className="rounded-lg p-1 text-stone-500 hover:bg-white/70 hover:text-stone-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
