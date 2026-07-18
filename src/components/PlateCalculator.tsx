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
        className="fixed left-4 z-50 fab-bottom w-11 h-11 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center shadow-xl text-zinc-300 hover:text-volt hover:border-volt/40 transition-colors"
        aria-label="Plate calculator"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-5 h-5" aria-hidden="true">
          <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11M1.5 10.5v3M22.5 10.5v3" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Plate calculator">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 max-w-lg sm:max-w-sm mx-auto bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-sheetUp"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Plate Calculator</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-zinc-500 hover:text-white text-sm px-1">✕</button>
            </div>

            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Target weight (kg)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-lg text-white text-center font-semibold tabular-nums focus:outline-none focus:border-volt"
              autoFocus
            />

            {result && (
              <div className="space-y-3">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-xs text-zinc-500">Per side</span>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {result.perSide.length === 0 ? (
                      <span className="text-zinc-500 text-sm">Barbell only</span>
                    ) : (
                      result.perSide.map((plate, i) => (
                        <span
                          key={i}
                          className={`inline-block px-2 py-1 rounded text-xs font-bold tabular-nums ${
                            plate >= 20
                              ? "bg-red-500/15 text-red-400"
                              : plate >= 10
                              ? "bg-blue-500/15 text-blue-400"
                              : plate >= 5
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {plate}kg
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="text-center text-xs text-zinc-500">
                  Actual weight: <span className="text-volt font-bold tabular-nums">{result.total}kg</span>
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
