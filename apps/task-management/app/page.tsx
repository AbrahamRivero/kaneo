import { StatsCards } from "@/components/stats-cards";
import { ChartsSection } from "@/components/task/charts/charts-section";

export default function Home() {
  return (
    <main className="w-full h-full overflow-x-auto flex flex-col gap-4 sm:gap-6">
      <StatsCards />
      <ChartsSection />
    </main>
  );
}
