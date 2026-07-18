"use client";

import { useState, useEffect, useRef } from "react";

const presets = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          setFinished(true);
          if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 200]);
          setTimeout(() => setFinished(false), 5000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const start = (secs: number) => {
    setDuration(secs);
    setRemaining(secs);
    setRunning(true);
    setFinished(false);
    setOpen(false);
  };

  const stop = () => {
    setRunning(false);
    setRemaining(0);
    setFinished(false);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percent = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const active = running || finished;

  return (
    <div className="fixed right-4 z-50 fab-bottom">
      {active ? (
        <button
          onClick={stop}
          aria-label={finished ? "Rest complete — dismiss" : "Stop rest timer"}
          className={`relative rounded-full w-16 h-16 shadow-2xl flex items-center justify-center transition-all ${
            finished ? "bg-volt text-volt-ink animate-popIn" : "bg-zinc-900 border border-volt/40 text-white"
          }`}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              stroke={finished ? "#1a2e05" : "#a3e635"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={finished ? 0 : offset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="relative z-10 text-xs font-mono font-bold tabular-nums">
            {finished ? "GO" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
          </span>
        </button>
      ) : open ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3 w-48 animate-popIn">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Rest Timer</p>
            <button onClick={() => setOpen(false)} aria-label="Close rest timer" className="text-zinc-500 hover:text-white text-sm px-1">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => start(p)}
                className="py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-volt hover:text-volt-ink transition-colors tabular-nums"
              >
                {p}s
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open rest timer"
          className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-volt hover:border-volt/40 shadow-xl flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-5 h-5" aria-hidden="true">
            <path d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
