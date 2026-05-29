"use client";

import { useState, useMemo } from "react";
import { calculatePlates } from "@/lib/utils";

export default function PlateCalculator() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const weight = parseFloat(input);
    if (isNaN(weight)) return null;
    return calculatePlates(weight);
  }, [input]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 left-4 z-50 bg-zinc-800 border border-zinc-700 rounded-full w-10 h-10 flex items-center justify-center text-sm shadow-xl hover:bg-zinc-700 transition-colors"
        title="Plate Calculator"
      >
        🏋️
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Plate Calculator</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 text-sm">✕</button>
            </div>

            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Target weight (kg)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-lg text-white text-center focus:outline-none focus:border-indigo-500"
              autoFocus
            />

            {result && (
              <div className="space-y-3">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-xs text-zinc-500">Per side</span>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {result.perSide.length === 0 ? (
                      <span className="text-zinc-600 text-sm">Barbell only</span>
                    ) : (
                      result.perSide.map((plate, i) => (
                        <span
                          key={i}
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            plate >= 20
                              ? "bg-red-900/50 text-red-400"
                              : plate >= 10
                              ? "bg-blue-900/50 text-blue-400"
                              : plate >= 5
                              ? "bg-green-900/50 text-green-400"
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {plate}kg
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="text-center text-xs text-zinc-500">
                  Actual weight: <span className="text-white font-semibold">{result.total}kg</span>
                </div>
              </div>
            )}

            {input && !result && (
              <p className="text-xs text-zinc-500 text-center">Must be above 20kg (barbell weight)</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
