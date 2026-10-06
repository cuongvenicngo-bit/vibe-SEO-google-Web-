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

/** One icon per workflow step; all steps share the brand blue so the page stays calm. */
export const STEP_ICONS: Record<number, LucideIcon> = {
  1: Globe,
  2: Users,
  3: Scale,
  4: Lightbulb,
  5: Megaphone,
  6: Clapperboard,
  7: Map,
  8: FileDown,
};
