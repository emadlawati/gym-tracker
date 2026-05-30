export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressChart from "@/components/ProgressChart";
import { getUserId } from "@/lib/cookies";

export default async function ProgressPage({ params }: { params: Promise<{ exercise: string }> }) {
  const userId = (await getUserId()) || "user_imad";
  const { exercise } = await params;
  const exerciseName = decodeURIComponent(exercise);

  const sets = await prisma.exerciseSet.findMany({
    where: { exerciseName, completed: true, session: { userId } },
    include: { session: { select: { date: true, template: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const allExercises = await prisma.exerciseSet.findMany({
    where: { completed: true, session: { userId } },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
    orderBy: { exerciseName: "asc" },
  });

  const sessionsMap = new Map<string, { date: string; templateName: string; sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[] }>();
  for (const s of sets) {
    const key = s.sessionId;
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, { date: s.session.date.toISOString(), templateName: s.session.template.name, sets: [] });
    }
    sessionsMap.get(key)!.sets.push({ setNumber: s.setNumber, weight: s.weight, reps: s.reps, rpe: s.rpe });
  }
  const history = Array.from(sessionsMap.values());
  const totalSets = sets.length;
  const sessionsCount = history.length;
  const lastSet = sets[sets.length - 1];

  let bestE1RM = 0;
  for (const s of sets) {
    const e = s.weight * (1 + s.reps / 30);
    if (e > bestE1RM) bestE1RM = e;
  }
  const bwEntry = await prisma.bodyWeight.findFirst({ where: { userId }, orderBy: { date: "desc" } });
  const bestRatio = bwEntry ? Math.round((bestE1RM / bwEntry.weight) * 100) : 0;

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">← Home</Link>
        <h1 className="text-xl font-bold text-white mt-1">{exerciseName}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{sessionsCount} sessions · {totalSets} logged sets</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">No data for this exercise yet. Complete a workout to start tracking.</p>
        </div>
      ) : (
        <>
          {lastSet && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-3">
              <div><p className="text-xs text-zinc-500">Last Weight</p><p className="text-lg font-bold text-white">{lastSet.weight}kg</p></div>
              <div><p className="text-xs text-zinc-500">Last Reps</p><p className="text-lg font-bold text-white">{lastSet.reps}</p></div>
              <div><p className="text-xs text-zinc-500">Last RPE</p><p className="text-lg font-bold text-white">{lastSet.rpe ?? "—"}</p></div>
            </div>
          )}

          {bestE1RM > 0 && bwEntry && (
            <div className="bg-zinc-900 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Best e1RM</p>
                  <p className="text-lg font-bold text-white">{Math.round(bestE1RM)}kg</p>
                  {bwEntry && <p className="text-[10px] text-zinc-500">{bestRatio}% bodyweight</p>}
                </div>
                <Link href="/achievements?filter=strength" className="text-xs text-indigo-400 hover:text-indigo-300">View milestones →</Link>
              </div>
            </div>
          )}

          <ProgressChart history={history} />

          <section>
            <h3 className="text-sm font-semibold text-white mb-3">All Sessions</h3>
            <div className="space-y-1.5">
              {[...history].reverse().map((h, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{h.templateName}</span>
                    <span className="text-xs text-zinc-500">{new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {h.sets.map((s) => (
                      <span key={s.setNumber} className="text-xs text-zinc-400">#{s.setNumber}: {s.weight}kg × {s.reps}{s.rpe ? ` @ ${s.rpe}` : ""}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h3 className="text-sm font-semibold text-white mb-2">Other Exercises</h3>
        <div className="flex flex-wrap gap-1.5">
          {allExercises.filter((e) => e.exerciseName !== exerciseName).map((e) => (
            <Link key={e.exerciseName} href={`/progress/${encodeURIComponent(e.exerciseName)}`} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors">
              {e.exerciseName}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
