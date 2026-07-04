import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const baselines = await prisma.exerciseBaseline.findMany({ where: { userId } });
    return NextResponse.json(baselines);
  } catch {
    return NextResponse.json({ error: "Failed to load baselines" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { exerciseName, weight, reps, rpe } = await req.json();

    if (!exerciseName || !exerciseName.trim()) {
      return NextResponse.json({ error: "exerciseName is required" }, { status: 400 });
    }

    const name = normalizeExerciseName(exerciseName);
    const data = {
      weight: weight != null && weight !== "" ? Number(weight) : null,
      reps: reps != null && reps !== "" ? Number(reps) : null,
      rpe: rpe != null && rpe !== "" ? Number(rpe) : null,
    };

    const baseline = await prisma.exerciseBaseline.upsert({
      where: { userId_exerciseName: { userId, exerciseName: name } },
      create: { userId, exerciseName: name, ...data },
      update: data,
    });
    return NextResponse.json(baseline);
  } catch {
    return NextResponse.json({ error: "Failed to save baseline" }, { status: 500 });
  }
}
