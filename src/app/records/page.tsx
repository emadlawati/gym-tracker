export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { estimate1RM, formatDate } from "@/lib/utils";
import { getUserId } from "@/lib/cookies";

export default async function RecordsPage() {
  const userId = (await getUserId()) || "user_imad";

  const allSets = await prisma.exerciseSet.findMany({
    where: { completed: true, weight: { gt: 0 }, reps: { gt: 0 }, session: { userId } },
    include: { session: { select: { date: true } } },
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<string, typeof allSets>();
  for (const s of allSets) {
    if (!grouped.has(s.exerciseName)) grouped.set(s.exerciseName, []);
    grouped.get(s.exerciseName)!.push(s);
  }

  const records: { exerciseName: string; bestWeight: number; bestReps: number; bestRPE: number | null; bestE1RM: number; bestVolume: number; bestSetDate: string }[] = [];

  for (const [exerciseName, sets] of grouped) {
    let bestE1RM = 0, bestVolume = 0, bestWeight = 0, bestReps = 0, bestRPE: number | null = null, bestSetDate = "";
    for (const s of sets) {
      const e1rm = estimate1RM(s.weight, s.reps);
      if (e1rm > bestE1RM) { bestE1RM = e1rm; bestWeight = s.weight; bestReps = s.reps; bestRPE = s.rpe; bestSetDate = s.session.date.toISOString(); }
      const vol = s.weight * s.reps;
      if (vol > bestVolume) bestVolume = vol;
    }
    records.push({ exerciseName, bestWeight, bestReps, bestRPE, bestE1RM, bestVolume, bestSetDate });
  }

  records.sort((a, b) => b.bestE1RM - a.bestE1RM);

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Personal Records</h1>
      {records.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4">
          <div className="text-4xl">🏆</div>
          <div>
            <h2 className="text-base font-semibold text-white">No records yet</h2>
            <p className="text-sm text-zinc-500 mt-1">Complete a workout to build your PR wall.</p>
          </div>
          <Link href="/" className="inline-block px-5 py-2.5 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright transition-all active:scale-[0.98]">Start a workout</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Link key={r.exerciseName} href={`/progress/${encodeURIComponent(r.exerciseName)}`} className="block bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-xl p-4 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{r.exerciseName}</h3>
                <span className="text-[10px] text-zinc-500">{formatDate(r.bestSetDate)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center"><p className="text-lg font-bold text-volt tabular-nums">{r.bestE1RM}kg</p><p className="text-[10px] text-zinc-500">e1RM</p></div>
                <div className="text-center"><p className="text-lg font-bold text-white tabular-nums">{r.bestWeight}kg x {r.bestReps}</p><p className="text-[10px] text-zinc-500">Best Set</p></div>
                <div className="text-center"><p className="text-lg font-bold text-emerald-400 tabular-nums">{r.bestVolume.toLocaleString()}</p><p className="text-[10px] text-zinc-500">Best Volume</p></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
