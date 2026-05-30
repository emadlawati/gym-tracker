"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

const FIELDS = [
  { key: "weight", label: "Weight (kg)" },
  { key: "chest", label: "Chest (cm)" },
  { key: "waist", label: "Waist (cm)" },
  { key: "hips", label: "Hips (cm)" },
  { key: "arms", label: "Arms (cm)" },
  { key: "thighs", label: "Thighs (cm)" },
  { key: "calves", label: "Calves (cm)" },
];

interface MeasurementEntry {
  id: string;
  date: string;
  [key: string]: number | string | undefined;
}

export default function MeasurementsPage() {
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/measurements").then((r) => r.json()).then((d) => { setEntries(d); setLoading(false); }); }, []);

  async function handleAdd() {
    const data: Record<string, number> = {};
    for (const f of FIELDS) {
      const v = parseFloat(form[f.key] || "");
      if (!isNaN(v) && v > 0) data[f.key] = v;
    }
    if (Object.keys(data).length === 0) return;

    await fetch("/api/measurements", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    setForm({});
    const res = await fetch("/api/measurements");
    setEntries(await res.json());
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Measurements</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] text-zinc-500 block mb-0.5">{f.label}</label>
              <input
                type="number" inputMode="decimal" step="0.1"
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder="—"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
        <button onClick={handleAdd} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 active:scale-[0.98] transition-all">Log</button>
      </div>

      {loading ? <p className="text-zinc-500 text-sm">Loading...</p> : entries.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4">
          <div className="text-4xl">📏</div>
          <h2 className="text-base font-semibold text-white">No measurements yet</h2>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 mb-2">{formatDate(e.date)}</p>
              <div className="grid grid-cols-4 gap-2">
                {FIELDS.filter((f) => e[f.key]).map((f) => (
                  <div key={f.key} className="text-center">
                    <p className="text-sm font-semibold text-white">{e[f.key]}</p>
                    <p className="text-[10px] text-zinc-600">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
