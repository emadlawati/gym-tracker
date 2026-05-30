import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const { id } = await params;
  const data = await req.json();

  const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workoutSession.update({
    where: { id },
    data,
    include: {
      template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
      exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const { id } = await params;
  const session = await prisma.workoutSession.findFirst({ where: { id, userId } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.workoutSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
