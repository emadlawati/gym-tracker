"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/workouts", label: "Workouts", icon: "📋" },
  { href: "/history", label: "History", icon: "📅" },
  { href: "/achievements", label: "Badges", icon: "🏆" },
  { href: "/measurements", label: "Measure", icon: "📏" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !pathname.includes("/session") && !pathname.includes("/progress");
    if (href === "/workouts") return pathname.startsWith("/workouts");
    if (href === "/history") return pathname.startsWith("/history");
    if (href === "/achievements") return pathname.startsWith("/achievements");
    if (href === "/measurements") return pathname.startsWith("/measurements");
    return pathname === href;
  };

  return (
    <>
      <style jsx>{`
        nav {
          padding-bottom: env(safe-area-inset-bottom, 0.5rem);
        }
      `}</style>
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/80 z-50" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0.5rem))" }}>
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors active:scale-95 ${
                  active ? "text-indigo-400" : "text-zinc-500"
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
