/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  achievements?: { icon: string; title: string }[];
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

export default function Confetti({ show, achievements }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#a3e635", "#bef264", "#34d399", "#fbbf24", "#f472b6", "#38bdf8"];
    const p: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
    }));

    setParticles(p);
    setVisible(true);

    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 w-2 h-3 rounded-full animate-fall"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {achievements && achievements.length > 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-700 rounded-2xl px-6 py-4 shadow-2xl animate-slideUp">
          <p className="text-sm font-bold text-white text-center mb-2">Achievement Unlocked!</p>
          <div className="flex gap-3 justify-center">
            {achievements.slice(0, 3).map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[10px] text-zinc-400">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
