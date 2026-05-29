"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/workouts", label: "Workouts", icon: "📋" },
  { href: "/history", label: "History", icon: "📅" },
  { href: "/achievements", label: "Badges", icon: "🏆" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                active ? "text-indigo-400" : "text-zinc-500"
              }`}
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
