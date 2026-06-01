import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.workoutTemplate.findUnique({
      where: { id },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, exercises } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Workout name is required" }, { status: 400 });
    }

    await prisma.templateExercise.deleteMany({ where: { templateId: id } });

    const template = await prisma.workoutTemplate.update({
      where: { id },
      data: {
        name: name.trim(),
        exercises: {
          create: exercises.map((ex: { exerciseName: string; sets: number; sortOrder: number; notes?: string; settings?: string; defaultWeight?: number; defaultReps?: number; defaultRpe?: number }) => ({
            exerciseName: normalizeExerciseName(ex.exerciseName),
            sets: ex.sets,
            sortOrder: ex.sortOrder,
            notes: ex.notes || null,
            settings: ex.settings || null,
            defaultWeight: ex.defaultWeight || null,
            defaultReps: ex.defaultReps || null,
            defaultRpe: ex.defaultRpe || null,
          })),
        },
      },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workoutTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
