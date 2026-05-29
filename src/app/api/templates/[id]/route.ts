import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await prisma.workoutTemplate.findUnique({
    where: { id },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, exercises } = await req.json();

  await prisma.templateExercise.deleteMany({ where: { templateId: id } });

  const template = await prisma.workoutTemplate.update({
    where: { id },
    data: {
      name,
      exercises: {
        create: exercises.map((ex: { exerciseName: string; sets: number; sortOrder: number; notes?: string; settings?: string }) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          sortOrder: ex.sortOrder,
          notes: ex.notes || null,
          settings: ex.settings || null,
        })),
      },
    },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
