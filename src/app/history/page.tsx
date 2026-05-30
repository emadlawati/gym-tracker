export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getUserId } from "@/lib/cookies";

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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">No workouts completed yet.</p>
          <Link href="/" className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Start a workout</Link>
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([month, monthSessions]) => (
          <section key={month}>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{month}</h2>
            <div className="space-y-1">
              {monthSessions.map((s) => {
                const exerciseNames = [...new Set(s.exerciseSets.map((es) => es.exerciseName))];
                return (
                  <Link key={s.id} href={`/history/${s.id}`} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{s.template.name}</span>
                        {s.completed ? (
                          <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded font-medium">Done</span>
                        ) : (
                          <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded font-medium">In Progress</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {exerciseNames.slice(0, 3).join(", ")}{exerciseNames.length > 3 ? ` +${exerciseNames.length - 3} more` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-600 ml-3 shrink-0">{formatDate(s.date)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
