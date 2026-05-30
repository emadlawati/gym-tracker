import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.exerciseSet.findFirst({
      where: { id, session: { userId } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const exerciseSet = await prisma.exerciseSet.update({
      where: { id },
      data: {
        weight: data.weight ?? existing.weight,
        reps: data.reps ?? existing.reps,
        rpe: data.rpe ?? existing.rpe,
        feeling: data.feeling ?? existing.feeling,
        setType: data.setType ?? existing.setType,
        completed: data.completed ?? true,
      },
    });

    return NextResponse.json(exerciseSet);
  } catch {
    return NextResponse.json({ error: "Failed to update set" }, { status: 500 });
  }
}
