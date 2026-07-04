import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const baselines = await prisma.exerciseBaseline.findMany({
      where: { userId },
      include: { sets: { orderBy: { setNumber: "asc" } } },
    });
    return NextResponse.json(baselines);
  } catch {
    return NextResponse.json({ error: "Failed to load baselines" }, { status: 500 });
  }
}

interface IncomingSet { weight?: number | string | null; reps?: number | string | null; rpe?: number | string | null }

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { exerciseName, sets } = await req.json();

    if (!exerciseName || !exerciseName.trim()) {
      return NextResponse.json({ error: "exerciseName is required" }, { status: 400 });
    }

    const name = normalizeExerciseName(exerciseName);

    // Keep only sets that have at least a weight or reps.
    const cleanSets = (Array.isArray(sets) ? sets : [])
      .map((s: IncomingSet) => ({ weight: toNum(s.weight), reps: toNum(s.reps), rpe: toNum(s.rpe) }))
      .filter((s) => s.weight != null || s.reps != null)
      .map((s, i) => ({ setNumber: i + 1, ...s }));

    // If nothing meaningful was provided, clear the benchmark.
    if (cleanSets.length === 0) {
      await prisma.exerciseBaseline.deleteMany({ where: { userId, exerciseName: name } });
      return NextResponse.json({ exerciseName: name, sets: [] });
    }

    const baseline = await prisma.exerciseBaseline.upsert({
      where: { userId_exerciseName: { userId, exerciseName: name } },
      create: { userId, exerciseName: name, sets: { create: cleanSets } },
      update: { sets: { deleteMany: {}, create: cleanSets } },
      include: { sets: { orderBy: { setNumber: "asc" } } },
    });
    return NextResponse.json(baseline);
  } catch {
    return NextResponse.json({ error: "Failed to save baseline" }, { status: 500 });
  }
}
