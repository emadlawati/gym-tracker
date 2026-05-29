import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await prisma.workoutSession.findUnique({
    where: { id },
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
  const { id } = await params;
  const data = await req.json();

  const session = await prisma.workoutSession.update({
    where: { id },
    data,
    include: {
      template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
      exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
    },
  });

  return NextResponse.json(session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
