"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/workouts", label: "Workouts", icon: "📋" },
  { href: "/history", label: "History", icon: "📅" },
  { href: "/achievements", label: "Badges", icon: "🏆" },
];

const moreItems = [
  { href: "/records", label: "Records", icon: "🏅" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/measurements", label: "Measurements", icon: "📏" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !pathname.includes("/session") && !pathname.includes("/progress");
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <style jsx>{`
        nav {
          padding-bottom: env(safe-area-inset-bottom, 0.5rem);
        }
      `}</style>

      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 right-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0.5rem)" }}
            onClick={(e) => e.stopPropagation()}>
            {moreItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-zinc-700/50 last:border-0 ${
                  pathname.startsWith(item.href) ? "text-indigo-400 bg-indigo-600/10" : "text-zinc-300 hover:bg-zinc-700"
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/80 z-50" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0.5rem))" }} aria-label="Main navigation">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} aria-label={item.label}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors active:scale-95 ${
                  active ? "text-indigo-400" : "text-zinc-500"
                }`}>
                <span className="text-xl mb-0.5">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)} aria-label="More options"
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors active:scale-95 ${
              isMoreActive || showMore ? "text-indigo-400" : "text-zinc-500"
            }`}>
            <span className="text-xl mb-0.5">⋯</span>
            More
          </button>
        </div>
      </nav>
    </>
  );
}
