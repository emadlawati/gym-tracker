import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const format = req.nextUrl.searchParams.get("format") || "csv";

    const sessions = await prisma.workoutSession.findMany({
      where: { userId, completed: true },
      include: {
        template: { select: { name: true } },
        exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
      },
      orderBy: { date: "asc" },
    });

    if (format === "json") {
      return NextResponse.json(sessions);
    }

    const headers = "Date,Template,Exercise,Set,Weight,Reps,RPE,Feeling,Volume\n";
    const rows = sessions.flatMap((s) => {
      const date = new Date(s.date).toISOString().split("T")[0];
      return s.exerciseSets
        .filter((es) => es.completed && es.weight > 0)
        .map((es) =>
          [
            date,
            s.template?.name || "",
            es.exerciseName,
            es.setNumber,
            es.weight,
            es.reps,
            es.rpe || "",
            es.feeling || "",
            es.weight * es.reps,
          ].join(",")
        );
    });

    const csv = headers + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gym-tracker-export.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
