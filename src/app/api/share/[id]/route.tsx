import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";

    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
      include: {
        template: { select: { name: true } },
        exerciseSets: { where: { completed: true }, orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
      },
    });

    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalVolume = session.exerciseSets.reduce((s, es) => s + es.weight * es.reps, 0);
    const exercises = [...new Set(session.exerciseSets.map((es) => es.exerciseName))];
    const duration = session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : "";
    const date = new Date(session.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const lines = exercises.map((name) => {
      const sets = session.exerciseSets.filter((es) => es.exerciseName === name);
      const best = sets.reduce<{ w: number; r: number; e: number } | null>((b, s) => {
        const e = Math.round(s.weight * (1 + s.reps / 30));
        return !b || e > b.e ? { w: s.weight, r: s.reps, e } : b;
      }, null);
      return `${name}: ${sets.length} sets · Top ${best?.w}kg × ${best?.r}`;
    });

    return NextResponse.json({
      name: session.template?.name || "Workout",
      date,
      duration,
      exercises: exercises.length,
      sets: session.exerciseSets.length,
      volume: totalVolume,
      xp: session.xpEarned || 0,
      lines: lines.slice(0, 7),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
