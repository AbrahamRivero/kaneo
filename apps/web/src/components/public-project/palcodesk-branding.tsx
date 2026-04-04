import { ArrowRight, Star } from "lucide-react";

export function PalcoDeskBranding() {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <span>Powered by</span>
      <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
        <Star className="w-4 h-4" />
        <span>PalcoDesk</span>
      </div>
      <ArrowRight className="w-3 h-3" />
      <span className="text-xs">Hotel Palco Management System</span>
    </div>
  );
}
