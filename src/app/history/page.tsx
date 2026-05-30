export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/cookies";
import HistoryList from "@/components/HistoryList";

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

  const groupedByMonth = sessions.reduce(
    (acc, s) => {
      const d = new Date(s.date);
      const key = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {} as Record<string, typeof sessions>
  );

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">History</h1>
      {sessions.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4">
          <div className="text-4xl">📅</div>
          <div>
            <h2 className="text-base font-semibold text-white">No sessions yet</h2>
            <p className="text-sm text-zinc-500 mt-1">Completed workouts will show up here.</p>
          </div>
          <Link href="/" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 active:bg-indigo-400 transition-all active:scale-[0.98]">Start a workout</Link>
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([month, monthSessions]) => (
          <section key={month}>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{month}</h2>
            <div className="space-y-1">
              <HistoryList sessions={monthSessions} />
            </div>
          </section>
        ))
      )}
    </div>
  );
}
