"use client";

import { useState, useMemo } from "react";
import { estimate1RM } from "@/lib/utils";

interface Props {
  setNumber: number;
  initialWeight?: number;
  initialReps?: number;
  initialRpe?: number | null;
  initialFeeling?: string | null;
  initialSetType?: string | null;
  onSave: (data: { weight: number; reps: number; rpe: number | null; feeling: string | null; setType: string | null }) => void;
  onLogAndRest?: () => void;
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
  setNumber, initialWeight, initialReps, initialRpe, initialFeeling, initialSetType,
  onSave, onLogAndRest, previous, previousBestWeight, previousBestReps,
}: Props) {
  const [weight, setWeight] = useState(initialWeight ?? 0);
  const [reps, setReps] = useState(initialReps ?? 0);
  const [rpe, setRpe] = useState(initialRpe ?? null as number | null);
  const [feeling, setFeeling] = useState<string | null>(initialFeeling ?? null);
  const [setType, setSetType] = useState<string | null>(initialSetType ?? "working");
  const [saved, setSaved] = useState(!!initialWeight && !!initialReps);
  const [flashing, setFlashing] = useState(false);

  const e1rm = useMemo(() => estimate1RM(weight, reps), [weight, reps]);
  const isWeightPR = previousBestWeight != null && previousBestReps != null && e1rm > previousBestWeight * (1 + previousBestReps / 30);
  const isRepPR = previousBestWeight != null && previousBestReps != null && weight >= previousBestWeight && reps > previousBestReps && !isWeightPR;
  const showPR = isWeightPR || isRepPR;
  const prLabel = isWeightPR ? "Weight PR!" : "Rep PR!";

  const handleSave = () => {
    onSave({ weight, reps, rpe, feeling, setType });
    setSaved(true);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 800);
    if (navigator.vibrate) navigator.vibrate(10);
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
        className={`flex items-center justify-between rounded-xl px-4 py-3.5 cursor-pointer border transition-all duration-300 group ${
          flashing ? "bg-indigo-600/20 border-indigo-500/50 scale-[1.02]" : "bg-zinc-800/50 border-zinc-800/60 hover:bg-zinc-800"
        }`}
      >
        <span className="text-xs font-semibold text-zinc-500 w-7">#{setNumber}</span>
        <div className="flex items-center gap-2.5 flex-1 ml-2 min-w-0">
          <span className="text-base font-semibold text-white">{weight}kg</span>
          <span className="text-[10px] text-zinc-600">×</span>
          <span className="text-base font-semibold text-white">{reps}</span>
          {rpe && <span className="text-xs text-zinc-500">@ RPE {rpe}</span>}
          {e1rm > 0 && <span className={`text-[11px] ml-auto ${showPR ? "text-amber-400 font-bold" : "text-zinc-600"}`}>{e1rm} e1RM</span>}
        </div>
        {feeling && <span className="text-lg ml-1.5">{feeling}</span>}
        <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">edit</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700/40 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-indigo-400">Set {setNumber}</span>
        {previous && previous.weight > 0 && (
          <span className="text-[10px] text-zinc-500 ml-auto">Last: {previous.weight}kg × {previous.reps}{previous.rpe ? ` @${previous.rpe}` : ""}</span>
        )}
        {showPR && <span className="text-[10px] text-amber-400 font-bold animate-pulse">{prLabel}</span>}
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-[2]">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1 block">Weight</label>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => adjustWeight(-2.5)} className="w-9 h-10 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-zinc-300 rounded-lg text-sm font-bold shrink-0 transition-colors flex items-center justify-center">−</button>
            <input
              type="number" inputMode="decimal" step="0.5" min="0"
              value={weight || ""}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2.5 text-base text-white text-center focus:outline-none focus:border-indigo-500 transition-colors font-medium"
              placeholder="kg"
            />
            <button type="button" onClick={() => adjustWeight(2.5)} className="w-9 h-10 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-zinc-300 rounded-lg text-sm font-bold shrink-0 transition-colors flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1 block">Reps</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={reps || ""}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-base text-white text-center focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            placeholder="0"
          />
        </div>
        <div style={{ width: 80 }}>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1 block">RPE</label>
          <select
            value={rpe ?? ""}
            onChange={(e) => setRpe(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">—</option>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (<option key={v} value={v}>{v}</option>))}
          </select>
        </div>
      </div>

      {weight > 0 && reps > 0 && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className={showPR ? "text-amber-400 font-bold" : "text-indigo-400/60"}>e1RM: {e1rm}kg</span>
          {showPR && <span className="text-amber-400">🏆</span>}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600">Feeling</span>
        {FEELINGS.map((f) => (
          <button key={f.emoji} type="button" onClick={() => setFeeling(f.emoji)}
            className={`text-xl p-1.5 rounded-lg transition-all active:scale-90 ${feeling === f.emoji ? "bg-zinc-700 ring-1 ring-zinc-600 scale-110" : "opacity-40 hover:opacity-80"}`}
            title={f.label}>{f.emoji}</button>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        <span className="text-[10px] text-zinc-600 self-center mr-1">Type</span>
        {["warmup", "working", "drop", "failure"].map((t) => (
          <button key={t} type="button" onClick={() => setSetType(t)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all active:scale-95 ${
              setType === t ? "bg-indigo-600 text-white" : "bg-zinc-700/50 text-zinc-500 hover:bg-zinc-700"
            }`}>{t}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={weight <= 0 || reps <= 0}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 active:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Log Set
        </button>
        {(previous?.weight || 0) > 0 && (
          <button
            onClick={() => {
              setWeight(previous!.weight);
              setReps(previous!.reps);
              setRpe(previous!.rpe);
            }}
            className="px-3 py-3 bg-zinc-700 text-zinc-300 rounded-xl text-[11px] font-medium hover:bg-zinc-600 active:bg-zinc-500 transition-all active:scale-95"
          >
            Fill last
          </button>
        )}
        {onLogAndRest && (
          <button
            onClick={() => {
              if (weight > 0 && reps > 0) {
                handleSave();
                onLogAndRest();
              }
            }}
            disabled={weight <= 0 || reps <= 0}
            className="px-3 py-3 bg-zinc-700 text-indigo-300 rounded-xl text-[10px] font-semibold hover:bg-zinc-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Set + Rest
          </button>
        )}
      </div>
    </div>
  );
}
