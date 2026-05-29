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
  const percent = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = () => {
    if (percent >= 90) return "#f87171";
    if (percent >= 50) return "#fbbf24";
    return "#34d399";
  };

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
        <button onClick={stop} className="relative bg-indigo-600 text-white rounded-full w-16 h-16 shadow-2xl hover:bg-indigo-500 transition-colors flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={running ? getColor() : "#34d399"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={running ? offset : 0}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="relative z-10 text-center">
            <div className="text-xs font-mono font-bold tabular-nums">
              {remaining > 0 ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : "GO!"}
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
