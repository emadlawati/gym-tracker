import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const entries = await prisma.bodyWeight.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { weight, date } = await req.json();

  const entry = await prisma.bodyWeight.create({
    data: {
      weight: parseFloat(weight),
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(entry);
}
