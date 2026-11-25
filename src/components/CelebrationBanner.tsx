import React from 'react';
import { Sparkles, X } from 'lucide-react';
import type { BadgeDefinition, ConceptDefinition, StageTransition } from '../types/socratic';

interface CelebrationBannerProps {
  concepts: ConceptDefinition[];
  badges: BadgeDefinition[];
  stageTransition?: StageTransition | null;
  onDismiss: () => void;
}

export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({
  concepts,
  badges,
  stageTransition,
  onDismiss,
}) => {
  if (concepts.length === 0 && badges.length === 0 && !stageTransition) return null;

  const parts: string[] = [];
  if (stageTransition) {
    parts.push(
      `Module ${stageTransition.fromStageNumber} complete → Moving to Module ${stageTransition.toStageNumber}: ${stageTransition.toStageTitle}`
    );
  }
  if (concepts.length > 0) {
    parts.push(`Discovered: ${concepts.map((c) => c.discoveredTitle).join(', ')}`);
  }
  if (badges.length > 0) {
    parts.push(`Unlocked: ${badges.map((b) => b.title).join(', ')}`);
  }

  return (
    <div className="mx-auto max-w-3xl mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 flex items-center justify-between gap-3 text-sm text-emerald-950">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>{parts.join(' · ')}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
