"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ d, className, strokeWidth = 1.8 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-[22px] h-[22px]"} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  workouts: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  history: "M12 8v4l2.5 2.5M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1",
  records: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 0-2 7 2-2 2 2-2-7Z",
  weight: "M12 3a3 3 0 0 1 3 3v1h3l1.5 13h-15L6 7h3V6a3 3 0 0 1 3-3Z",
  measurements: "M3 17 17 3l4 4L7 21l-4-4ZM7 14l1.5 1.5M10 11l1.5 1.5M13 8l1.5 1.5M16 5l1.5 1.5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5L9 5.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 0 0 2 1.2L9.5 21h5l.5-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.07-.4.1-.8.1-1.2Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

const navItems = [
  { href: "/", label: "Home", icon: icons.home },
  { href: "/workouts", label: "Workouts", icon: icons.workouts },
  { href: "/history", label: "History", icon: icons.history },
  { href: "/achievements", label: "Badges", icon: icons.trophy },
];

const moreItems = [
  { href: "/records", label: "Records", icon: icons.records },
  { href: "/weight", label: "Weight", icon: icons.weight },
  { href: "/measurements", label: "Measurements", icon: icons.measurements },
  { href: "/settings", label: "Settings", icon: icons.settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="More pages">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowMore(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl animate-sheetUp"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1" />
            {moreItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href) ? "text-volt" : "text-zinc-300 active:bg-zinc-800"
                }`}>
                <Icon d={item.icon} className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Main navigation"
      >
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined}
                className={`flex-1 flex flex-col items-center pt-2 pb-1.5 text-[10px] font-medium transition-colors active:scale-95 ${
                  active ? "text-volt" : "text-zinc-500"
                }`}>
                <Icon d={item.icon} />
                <span className="mt-0.5">{item.label}</span>
                <span className={`mt-0.5 w-1 h-1 rounded-full ${active ? "bg-volt" : "bg-transparent"}`} />
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)} aria-label="More options" aria-expanded={showMore}
            className={`flex-1 flex flex-col items-center pt-2 pb-1.5 text-[10px] font-medium transition-colors active:scale-95 ${
              isMoreActive || showMore ? "text-volt" : "text-zinc-500"
            }`}>
            <Icon d={icons.more} className="w-[22px] h-[22px]" strokeWidth={3} />
            <span className="mt-0.5">More</span>
            <span className={`mt-0.5 w-1 h-1 rounded-full ${isMoreActive ? "bg-volt" : "bg-transparent"}`} />
          </button>
        </div>
      </nav>
    </>
  );
}
