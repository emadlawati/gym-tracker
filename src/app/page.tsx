export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRelativeDate } from "@/lib/utils";

export default async function DashboardPage() {
  const templates = await prisma.workoutTemplate.findMany({
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const recentSessions = await prisma.workoutSession.findMany({
    take: 5,
    include: {
      template: { select: { name: true } },
      exerciseSets: true,
    },
    orderBy: { date: "desc" },
  });

  const lastSession = recentSessions[0];

  return (
    <div className="space-y-8">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-white">Gym Tracker</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {lastSession
            ? `Last workout: ${formatRelativeDate(lastSession.date)}`
            : "Start your first workout"}
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Quick Start</h2>
        <div className="grid gap-2">
          {templates.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-500 text-sm">No workout templates yet.</p>
              <Link
                href="/workouts"
                className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Create Workout
              </Link>
            </div>
          ) : (
            templates.map((t) => (
              <Link
                key={t.id}
                href={`/session/${t.id}`}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl px-5 py-4 transition-all group"
              >
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t.exercises.length} exercises · {t.exercises.reduce((sum, e) => sum + e.sets, 0)} total sets
                  </p>
                </div>
                <span className="text-indigo-500 text-lg group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              Recent Sessions
            </h2>
            <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/history/${s.id}`}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-white">{s.template.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">{formatRelativeDate(s.date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {s.completed ? (
                    <span className="text-xs text-emerald-500 font-medium">Done</span>
                  ) : (
                    <span className="text-xs text-amber-500 font-medium">In Progress</span>
                  )}
                  <span className="text-xs text-zinc-600">{s.exerciseSets.length} sets</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {templates.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Exercises</h2>
          <div className="grid gap-2">
            {(() => {
              const exercises = templates.flatMap((t) => t.exercises.map((e) => e.exerciseName));
              const unique = [...new Set(exercises)];
              return unique.map((name) => (
                <Link
                  key={name}
                  href={`/progress/${encodeURIComponent(name)}`}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-lg px-4 py-3 transition-colors"
                >
                  <span className="text-sm text-white">{name}</span>
                  <span className="text-xs text-indigo-400">Progress →</span>
                </Link>
              ));
            })()}
          </div>
        </section>
      )}
    </div>
  );
}
