"use client";

import { useState } from "react";

interface Props {
  setNumber: number;
  initialWeight?: number;
  initialReps?: number;
  initialRpe?: number | null;
  onSave: (data: { weight: number; reps: number; rpe: number | null }) => void;
  previous?: { weight: number; reps: number; rpe: number | null } | null;
}

export default function SetInput({ setNumber, initialWeight, initialReps, initialRpe, onSave, previous }: Props) {
  const [weight, setWeight] = useState(initialWeight ?? 0);
  const [reps, setReps] = useState(initialReps ?? 0);
  const [rpe, setRpe] = useState(initialRpe ?? null as number | null);
  const [saved, setSaved] = useState(!!initialWeight && !!initialReps);

  const handleSave = () => {
    onSave({ weight, reps, rpe });
    setSaved(true);
  };

  const handleEdit = () => {
    setSaved(false);
  };

  if (saved) {
    return (
      <div
        onClick={handleEdit}
        className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-4 py-3 cursor-pointer hover:bg-zinc-800 border border-zinc-800/80 transition-colors group"
      >
        <span className="text-xs font-semibold text-zinc-500 w-8">#{setNumber}</span>
        <div className="flex items-center gap-3 flex-1 ml-2">
          <span className="text-base font-semibold text-white">{weight}kg</span>
          <span className="text-xs text-zinc-500">x</span>
          <span className="text-base font-semibold text-white">{reps}</span>
          {rpe && <span className="text-xs text-zinc-500">@ RPE {rpe}</span>}
        </div>
        <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">tap to edit</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700/50 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-indigo-400">Set {setNumber}</span>
        {previous && previous.weight > 0 && (
          <span className="text-[11px] text-zinc-500 ml-auto">
            Last: {previous.weight}kg x {previous.reps}{previous.rpe ? ` @ ${previous.rpe}` : ""}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weight || ""}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={reps || ""}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="0"
          />
        </div>
        <div style={{ width: 100 }}>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">RPE</label>
          <select
            value={rpe ?? ""}
            onChange={(e) => setRpe(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            <option value="">—</option>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={weight <= 0 || reps <= 0}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Log Set
      </button>
    </div>
  );
}
