import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimate1RM } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { id } = await params;
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
      include: {
        template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
        exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
      },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const data = await req.json();

    const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.workoutSession.update({
      where: { id },
      data: { completed: data.completed, duration: data.duration, notes: data.notes },
      include: {
        template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
        exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
      },
    });

    // Roll benchmarks forward for a completed Gym Day: each exercise's benchmark
    // becomes the sets performed this session (so you always chase your latest).
    if (data.completed && updated.templateName === "Gym Day") {
      const setsByExercise = new Map<string, { setNumber: number; weight: number; reps: number; rpe: number | null }[]>();
      for (const s of updated.exerciseSets) {
        if (!s.completed || s.weight <= 0 || s.reps <= 0) continue;
        const list = setsByExercise.get(s.exerciseName) || [];
        list.push({ setNumber: s.setNumber, weight: s.weight, reps: s.reps, rpe: s.rpe });
        setsByExercise.set(s.exerciseName, list);
      }
      for (const [exerciseName, rawSets] of setsByExercise) {
        const ordered = rawSets
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((s, i) => ({ setNumber: i + 1, weight: s.weight, reps: s.reps, rpe: s.rpe }));
        await prisma.exerciseBaseline.upsert({
          where: { userId_exerciseName: { userId, exerciseName } },
          create: { userId, exerciseName, sets: { create: ordered } },
          update: { sets: { deleteMany: {}, create: ordered } },
        });
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { id } = await params;

    const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.xpAwarded) {
      return NextResponse.json({ error: "Cannot delete a session with awarded XP. Complete a new workout to offset." }, { status: 400 });
    }

    await prisma.workoutSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
