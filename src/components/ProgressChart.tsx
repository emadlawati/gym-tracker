"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { estimate1RM } from "@/lib/utils";

interface Set {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
}

interface SessionData {
  date: string;
  templateName: string;
  sets: Set[];
}

interface Props {
  history: SessionData[];
}

export default function ProgressChart({ history }: Props) {
  const data = history.map((s) => {
    const topSet = s.sets.reduce(
      (best, set) => {
        const e1rm = estimate1RM(set.weight, set.reps);
        return e1rm > best.e1rm ? { ...set, e1rm } : best;
      },
      { weight: 0, reps: 0, e1rm: 0 }
    );
    return {
      date: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      template: s.templateName,
      weight: topSet.weight,
      e1rm: topSet.e1rm || estimate1RM(topSet.weight, topSet.reps),
    };
  });

  if (data.length < 2) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Need at least 2 sessions to show progress
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
        <h3 className="text-sm font-semibold text-white mb-4">Estimated 1RM Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={11} />
            <YAxis stroke="#666" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
              labelStyle={{ color: "#ccc" }}
            />
            <Line type="monotone" dataKey="e1rm" stroke="#818cf8" strokeWidth={2} dot={{ fill: "#818cf8", r: 4 }} name="e1RM (kg)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
        <h3 className="text-sm font-semibold text-white mb-4">Top Set Weight</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={11} />
            <YAxis stroke="#666" fontSize={11} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
              labelStyle={{ color: "#ccc" }}
            />
            <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 4 }} name="Weight (kg)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
