"use client";

import { useRouter } from "next/navigation";
import SwipeableRow from "./SwipeableRow";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Props {
  sessions: {
    id: string;
    completed: boolean;
    date: Date | string;
    templateName?: string | null;
    exerciseSets: { exerciseName: string; completed: boolean }[];
    template: { name: string } | null;
  }[];
}

export default function HistoryList({ sessions }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      {sessions.map((s) => {
        const exerciseNames = [...new Set(s.exerciseSets.map((es) => es.exerciseName))];
        return (
          <SwipeableRow key={s.id} onDelete={() => handleDelete(s.id)}>
            <Link
              href={`/history/${s.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{s.templateName || s.template?.name || "Workout"}</span>
                    {s.completed ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">Done</span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-semibold">In Progress</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {exerciseNames.slice(0, 3).join(", ")}{exerciseNames.length > 3 ? ` +${exerciseNames.length - 3} more` : ""}
                  </p>
                </div>
                <span className="text-xs text-zinc-600 ml-3 shrink-0">{formatDate(s.date)}</span>
              </div>
            </Link>
          </SwipeableRow>
        );
      })}
    </>
  );
}
