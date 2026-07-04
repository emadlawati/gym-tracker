import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.exerciseCategory.findMany({
      include: { exercises: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Failed to load catalog" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { categoryId, name } = await req.json();
    if (!categoryId || !name || !name.trim()) {
      return NextResponse.json({ error: "categoryId and name are required" }, { status: 400 });
    }

    const category = await prisma.exerciseCategory.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const cleanName = normalizeExerciseName(name);

    const existing = await prisma.catalogExercise.findFirst({
      where: { categoryId, name: cleanName },
    });
    if (existing) return NextResponse.json(existing);

    const count = await prisma.catalogExercise.count({ where: { categoryId } });
    const exercise = await prisma.catalogExercise.create({
      data: { categoryId, name: cleanName, sortOrder: count },
    });
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 });
  }
}
