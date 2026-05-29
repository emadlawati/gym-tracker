import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const exerciseSet = await prisma.exerciseSet.update({
    where: { id },
    data: {
      weight: data.weight,
      reps: data.reps,
      rpe: data.rpe ?? null,
      completed: data.completed ?? true,
    },
  });

  return NextResponse.json(exerciseSet);
}
