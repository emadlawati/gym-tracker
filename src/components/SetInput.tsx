"use client";

import { useState, useMemo } from "react";
import { estimate1RM } from "@/lib/utils";

interface Props {
  setNumber: number;
  initialWeight?: number;
  initialReps?: number;
  initialRpe?: number | null;
  initialFeeling?: string | null;
  onSave: (data: { weight: number; reps: number; rpe: number | null; feeling: string | null }) => void;
  previous?: { weight: number; reps: number; rpe: number | null } | null;
  previousBestWeight?: number;
  previousBestReps?: number;
}

const FEELINGS = [
  { emoji: "💀", label: "death" },
  { emoji: "🔥", label: "fire" },
  { emoji: "⚡", label: "power" },
  { emoji: "👍", label: "solid" },
  { emoji: "😤", label: "grind" },
];

export default function SetInput({
  setNumber,
  initialWeight,
  initialReps,
  initialRpe,
  initialFeeling,
  onSave,
  previous,
  previousBestWeight,
  previousBestReps,
}: Props) {
  const [weight, setWeight] = useState(initialWeight ?? 0);
  const [reps, setReps] = useState(initialReps ?? 0);
  const [rpe, setRpe] = useState(initialRpe ?? null as number | null);
  const [feeling, setFeeling] = useState<string | null>(initialFeeling ?? null);
  const [saved, setSaved] = useState(!!initialWeight && !!initialReps);

  const e1rm = useMemo(() => estimate1RM(weight, reps), [weight, reps]);
  const isWeightPR = previousBestWeight != null && previousBestReps != null && e1rm > previousBestWeight * (1 + previousBestReps / 30);
  const isRepPR =
    previousBestWeight != null &&
    previousBestReps != null &&
    weight >= previousBestWeight &&
    reps > previousBestReps &&
    !isWeightPR;

  const showPR = isWeightPR || isRepPR;
  const prLabel = isWeightPR ? "NEW WEIGHT PR!" : isRepPR ? "NEW REP PR!" : "";

  const handleSave = () => {
    onSave({ weight, reps, rpe, feeling });
    setSaved(true);
  };

  const adjustWeight = (delta: number) => {
    setWeight((prev) => {
      const next = prev + delta;
      return next > 0 ? Math.round(next * 10) / 10 : 0;
    });
    if (saved) setSaved(false);
  };

  if (saved) {
    return (
      <div
        onClick={() => setSaved(false)}
        className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-4 py-3 cursor-pointer hover:bg-zinc-800 border border-zinc-800/80 transition-colors group"
      >
        <span className="text-xs font-semibold text-zinc-500 w-8">#{setNumber}</span>
        <div className="flex items-center gap-3 flex-1 ml-2">
          <span className="text-base font-semibold text-white">{weight}kg</span>
          <span className="text-xs text-zinc-500">x</span>
          <span className="text-base font-semibold text-white">{reps}</span>
          {rpe && <span className="text-xs text-zinc-500">@ RPE {rpe}</span>}
          {e1rm > 0 && (
            <span className={`text-xs font-medium ml-auto ${showPR ? "text-amber-400 font-bold" : "text-indigo-400/70"}`}>
              {e1rm} e1RM
            </span>
          )}
        </div>
        {feeling && <span className="text-lg ml-2">{feeling}</span>}
        <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors ml-2">edit</span>
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
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Weight (kg)</label>
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => adjustWeight(-2.5)}
              className="w-7 h-8 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-md text-xs font-bold shrink-0 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={weight || ""}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => adjustWeight(2.5)}
              className="w-7 h-8 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-md text-xs font-bold shrink-0 transition-colors"
            >
              +
            </button>
          </div>
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
        <div style={{ width: 90 }}>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">RPE</label>
          <select
            value={rpe ?? ""}
            onChange={(e) => setRpe(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            <option value="">—</option>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {weight > 0 && reps > 0 && (
        <div className="text-center">
          <span className={`text-xs font-medium ${showPR ? "text-amber-400 font-bold" : "text-indigo-400"}`}>
            e1RM: {e1rm}kg {showPR && `🏆 ${prLabel}`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-600 mr-1">How was it?</span>
        {FEELINGS.map((f) => (
          <button
            key={f.emoji}
            type="button"
            onClick={() => setFeeling(f.emoji)}
            className={`text-lg p-1 rounded-md transition-all ${
              feeling === f.emoji
                ? "bg-zinc-700 scale-125"
                : "opacity-50 hover:opacity-100 hover:scale-110"
            }`}
            title={f.label}
          >
            {f.emoji}
          </button>
        ))}
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
