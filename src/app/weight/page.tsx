"use client";

import { useState, useEffect } from "react";
import BodyWeightChart from "@/components/BodyWeightChart";
import { formatDate } from "@/lib/utils";

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const res = await fetch("/api/weight");
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }

  async function handleAdd() {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: w, date }),
    });

    setWeight("");
    fetchEntries();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/weight/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  const latest = entries[0];
  const chartData = entries.map((e) => ({
    date: e.date,
    weight: e.weight,
  }));

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Body Weight</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight (kg)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!weight || parseFloat(weight) <= 0}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            Log
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />

        {latest && (
          <div className="text-center py-2">
            <span className="text-xs text-zinc-500">Latest: </span>
            <span className="text-lg font-bold text-white">{latest.weight}kg</span>
            <span className="text-xs text-zinc-500 ml-2">{formatDate(latest.date)}</span>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Weight Trend</h3>
          <BodyWeightChart data={chartData} />
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-4">
              <div className="h-4 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium text-white">{e.weight}kg</span>
                <span className="text-xs text-zinc-500 ml-2">{formatDate(e.date)}</span>
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4">
          <div className="text-4xl">⚖️</div>
          <div>
            <h2 className="text-base font-semibold text-white">No weight entries yet</h2>
            <p className="text-sm text-zinc-500 mt-1">Track your body weight to see trends and enable strength-to-weight ratios.</p>
          </div>
        </div>
      )}
    </div>
  );
}
