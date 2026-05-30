import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const entries = await prisma.bodyWeight.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { weight, date } = await req.json();

    if (!weight || typeof weight !== "number" || weight <= 0) {
      return NextResponse.json({ error: "Valid weight is required" }, { status: 400 });
    }

    const entry = await prisma.bodyWeight.create({
      data: { userId, weight: parseFloat(String(weight)), date: date ? new Date(date) : new Date() },
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
