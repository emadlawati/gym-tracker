import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const { id } = await params;
  const entry = await prisma.bodyWeight.findFirst({ where: { id, userId } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.bodyWeight.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
