export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, estimate1RM, formatDuration } from "@/lib/utils";
import { getUserId } from "@/lib/cookies";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = (await getUserId()) || "user_imad";
  const { id } = await params;

  const session = await prisma.workoutSession.findFirst({
    where: { id, userId },
    include: {
      template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
      exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
    },
  });

  if (!session) {
    return (
      <div className="pt-20 text-center">
        <p className="text-zinc-500">Session not found</p>
        <Link href="/history" className="text-indigo-400 text-sm mt-2 inline-block">Back to history</Link>
      </div>
    );
  }

  const exerciseGrouped: Record<string, typeof session.exerciseSets> = {};
  for (const es of session.exerciseSets) {
    if (!exerciseGrouped[es.exerciseName]) exerciseGrouped[es.exerciseName] = [];
    exerciseGrouped[es.exerciseName].push(es);
  }

  const totalVolume = session.exerciseSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">← History</Link>
        <h1 className="text-xl font-bold text-white mt-1">{session.template.name}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {formatDate(session.date)}
          {session.completed ? " · Completed" : " · In Progress"}
          {session.duration ? ` · ${formatDuration(session.duration)}` : ""}
        </p>
        {session.notes && <p className="text-sm text-zinc-400 mt-2 bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">{session.notes}</p>}
      </div>

      {Object.entries(exerciseGrouped).map(([exerciseName, sets]) => {
        const topSet = sets.filter((s) => s.completed).reduce(
          (best, s) => { const e1rm = estimate1RM(s.weight, s.reps); return e1rm > best.e1rm ? { weight: s.weight, reps: s.reps, e1rm } : best; },
          { weight: 0, reps: 0, e1rm: 0 }
        );
        const exerciseVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

        return (
          <section key={exerciseName} className="space-y-2">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-semibold text-white">{exerciseName}</h2>
              {topSet.e1rm > 0 && <span className="text-xs text-zinc-500">Top e1RM: {topSet.e1rm}kg</span>}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-4 text-xs font-semibold text-zinc-500 uppercase">Set</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold text-zinc-500 uppercase">Weight</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold text-zinc-500 uppercase">Reps</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold text-zinc-500 uppercase">RPE</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold text-zinc-500 uppercase">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {sets.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-2.5 px-4 text-zinc-400">{s.setNumber}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-white">{s.weight}kg</td>
                      <td className="py-2.5 px-4 text-right text-zinc-300">{s.reps}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">{s.rpe ?? "—"}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-500">{s.weight * s.reps}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-800/30">
                    <td className="py-2 px-4 text-xs text-zinc-500 font-medium" colSpan={4}>Exercise volume</td>
                    <td className="py-2 px-4 text-right text-sm font-semibold text-indigo-400">{exerciseVolume}kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">Session Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-zinc-500">Total Volume</p>
            <p className="text-lg font-bold text-white">{totalVolume}kg</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Sets</p>
            <p className="text-lg font-bold text-white">{session.exerciseSets.filter((s) => s.completed).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
