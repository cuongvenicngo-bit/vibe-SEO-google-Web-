import type { CSSProperties } from 'react';
import {
  Globe,
  Users,
  Scale,
  Lightbulb,
  Megaphone,
  Clapperboard,
  Map,
  FileDown,
  type LucideIcon,
} from 'lucide-react';

/** Per-step hue and icon so each of the 8 workflow steps is recognisable at a glance. */
export const STEP_THEMES: Record<number, { from: string; to: string; icon: LucideIcon }> = {
  1: { from: '#2794f7', to: '#6d3df0', icon: Globe },
  2: { from: '#8255fb', to: '#c026d3', icon: Users },
  3: { from: '#ec4899', to: '#e11d48', icon: Scale },
  4: { from: '#f59e0b', to: '#ea580c', icon: Lightbulb },
  5: { from: '#10b981', to: '#0d9488', icon: Megaphone },
  6: { from: '#06b6d4', to: '#1475e6', icon: Clapperboard },
  7: { from: '#f97316', to: '#db2777', icon: Map },
  8: { from: '#6d3df0', to: '#2794f7', icon: FileDown },
};

export function stepStyle(stepNumber: number): CSSProperties {
  const theme = STEP_THEMES[stepNumber] || STEP_THEMES[1];
  return { '--step-from': theme.from, '--step-to': theme.to } as CSSProperties;
}
