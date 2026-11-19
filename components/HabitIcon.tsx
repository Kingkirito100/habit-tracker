import { Bike, BookOpen, Leaf, Pencil, Phone, Pill, Sparkles, Brain, Check, Coffee, Droplets, Dumbbell, Footprints, Heart, Moon, Sun, type LucideIcon } from "lucide-react";
export const ICONS: Record<string, LucideIcon> = { check: Check, water: Droplets, book: BookOpen, sport: Dumbbell, sleep: Moon, sun: Sun, heart: Heart, coffee: Coffee, mind: Brain, walk: Footprints, bike: Bike, pill: Pill, phone: Phone, clean: Sparkles, leaf: Leaf, write: Pencil };
export function HabitIcon({ name, size = 20 }: { name: string; size?: number }) {
  const I = ICONS[name] ?? Check;
  return <I size={size} aria-hidden strokeWidth={2.5} />;
}
