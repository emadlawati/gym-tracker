import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.workoutTemplate.findMany({
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, exercises } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Workout name is required" }, { status: 400 });
    }
    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 });
    }

    const template = await prisma.workoutTemplate.create({
      data: {
        name: name.trim(),
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
  } catch {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
