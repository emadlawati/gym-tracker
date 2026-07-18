export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/cookies";
import HistoryFilter from "@/components/HistoryFilter";

export default async function HistoryPage() {
  const userId = (await getUserId()) || "user_imad";

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    include: {
      template: { select: { name: true } },
      exerciseSets: { select: { exerciseName: true, completed: true } },
    },
    orderBy: { date: "desc" },
  });

  const templateNames = [...new Set(sessions.map((s) => s.templateName || s.template?.name || "Workout").filter(Boolean))];

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">History</h1>
        {sessions.length > 0 && (
          <a href="/api/export?format=csv" download className="text-xs text-volt hover:text-volt-bright px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-lg transition-colors">
            Export CSV
          </a>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4">
          <div className="text-4xl">📅</div>
          <div>
            <h2 className="text-base font-semibold text-white">No sessions yet</h2>
            <p className="text-sm text-zinc-500 mt-1">Completed workouts will show up here.</p>
          </div>
          <Link href="/" className="inline-block px-5 py-2.5 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright transition-all active:scale-[0.98]">Start a workout</Link>
        </div>
      ) : (
        <HistoryFilter sessions={sessions} templateNames={templateNames} />
      )}
    </div>
  );
}
