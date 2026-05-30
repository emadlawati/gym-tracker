import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const entries = await prisma.bodyWeight.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const { weight, date } = await req.json();

  const entry = await prisma.bodyWeight.create({
    data: {
      userId,
      weight: parseFloat(weight),
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(entry);
}
