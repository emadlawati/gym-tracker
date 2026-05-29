"use client";

import { useState, useEffect, useCallback } from "react";

export default function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, remaining]);

  const start = useCallback(() => {
    setRemaining(duration || 90);
    setRunning(true);
  }, [duration]);

  const stop = () => {
    setRunning(false);
    setRemaining(0);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const presets = [30, 60, 90, 120, 180];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!running && remaining === 0 ? (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 shadow-2xl space-y-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Rest Timer</p>
          <div className="flex gap-1">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setDuration(p)}
                className={`px-2 py-1 text-xs rounded font-medium ${
                  duration === p
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {p}s
              </button>
            ))}
          </div>
          <button
            onClick={start}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Start {duration}s
          </button>
        </div>
      ) : (
        <button onClick={stop} className="bg-indigo-600 text-white rounded-xl px-5 py-3 shadow-2xl text-center hover:bg-indigo-500 transition-colors">
          <div className="text-2xl font-mono font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-indigo-200 mt-0.5">{running ? "tap to stop" : "Done!"}</div>
        </button>
      )}
    </div>
  );
}
