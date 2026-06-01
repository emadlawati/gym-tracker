"use client";

import { useState } from "react";
import HistoryList from "./HistoryList";

interface Session {
  id: string;
  completed: boolean;
  date: Date | string;
  templateName?: string | null;
  exerciseSets: { exerciseName: string; completed: boolean }[];
  template: { name: string } | null;
}

interface Props {
  sessions: Session[];
  templateNames: string[];
}

export default function HistoryFilter({ sessions, templateNames }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filtered = sessions.filter((s) => {
    const name = (s.templateName || s.template?.name || "Workout").toLowerCase();
    const exercises = s.exerciseSets.map((es) => es.exerciseName.toLowerCase()).join(" ");
    const matchesSearch = !search || name.includes(search.toLowerCase()) || exercises.includes(search.toLowerCase());
    const matchesTemplate = !selectedTemplate || name === selectedTemplate.toLowerCase();
    return matchesSearch && matchesTemplate;
  });

  const groupedByMonth = filtered.reduce(
    (acc, s) => {
      const d = new Date(s.date);
      const key = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {} as Record<string, Session[]>
  );

  return (
    <>
      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workouts or exercises..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
        />
        {templateNames.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setSelectedTemplate(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${!selectedTemplate ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              All
            </button>
            {templateNames.map((name) => (
              <button key={name} onClick={() => setSelectedTemplate(selectedTemplate === name ? null : name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${selectedTemplate === name ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No sessions match your search.</p>
      ) : (
        Object.entries(groupedByMonth).map(([month, monthSessions]) => (
          <section key={month}>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{month}</h2>
            <div className="space-y-1">
              <HistoryList sessions={monthSessions} />
            </div>
          </section>
        ))
      )}
    </>
  );
}
