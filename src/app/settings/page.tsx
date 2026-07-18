"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserData {
  name: string;
  title: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then((data) => {
      setUser({ name: data.userId || "", title: data.identity || null });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="pt-20 space-y-4 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-32" />
        <div className="h-32 bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile</h2>
        {user && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">User</span>
              <span className="text-sm text-white font-medium">{user.name}</span>
            </div>
            {user.title && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Title</span>
                <span className="text-sm text-volt font-medium">{user.title}</span>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quick Links</h2>
        <div className="space-y-1">
          <Link href="/records" className="flex items-center justify-between py-2.5 text-sm text-white hover:text-volt transition-colors">
            <span>Personal Records</span>
            <span className="text-zinc-600">→</span>
          </Link>
          <Link href="/weight" className="flex items-center justify-between py-2.5 text-sm text-white hover:text-volt transition-colors border-t border-zinc-800">
            <span>Body Weight</span>
            <span className="text-zinc-600">→</span>
          </Link>
          <Link href="/measurements" className="flex items-center justify-between py-2.5 text-sm text-white hover:text-volt transition-colors border-t border-zinc-800">
            <span>Body Measurements</span>
            <span className="text-zinc-600">→</span>
          </Link>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</h2>
        <div className="space-y-2">
          <a href="/api/export?format=csv" download
            className="block w-full py-2.5 text-center text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            Export as CSV
          </a>
          <a href="/api/export?format=json" download
            className="block w-full py-2.5 text-center text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            Export as JSON
          </a>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">About</h2>
        <p className="text-xs text-zinc-500">Gym Tracker v1.0</p>
        <p className="text-xs text-zinc-600">Track workouts, chase PRs, and level up.</p>
      </section>
    </div>
  );
}
