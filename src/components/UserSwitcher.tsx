"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  title: string | null;
}

export default function UserSwitcher() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        const match = document.cookie.match(/gym_user_id=([^;]+)/);
        if (match) setCurrentId(match[1]);
      });
  }, []);

  async function switchUser(id: string) {
    await fetch("/api/switch-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setCurrentId(id);
    setOpen(false);
    router.refresh();
  }

  const currentUser = users.find((u) => u.id === currentId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-full transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-volt flex items-center justify-center text-[10px] font-bold text-volt-ink shrink-0">
          {currentUser?.name?.[0] || "?"}
        </span>
        <span className="max-w-[100px] truncate">{currentUser?.title || currentUser?.name || "Select"}</span>
        <span className="text-zinc-600">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2 ${
                  u.id === currentId ? "text-volt" : "text-zinc-300"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-volt flex items-center justify-center text-[10px] font-bold text-volt-ink shrink-0">
                  {u.name[0]}
                </span>
                {u.title || u.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
