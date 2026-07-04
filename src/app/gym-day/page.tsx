"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SetInput from "@/components/SetInput";
import RestTimer from "@/components/RestTimer";
import PlateCalculator from "@/components/PlateCalculator";
import WarmupCalculator from "@/components/WarmupCalculator";
import Confetti from "@/components/Confetti";
import { formatDuration, estimate1RM } from "@/lib/utils";

interface ExerciseSet {
  id: string;
  exerciseName: string;
  setNumber: number;
  setType: string | null;
  weight: number;
  reps: number;
  rpe: number | null;
  feeling: string | null;
  completed: boolean;
}

interface Session {
  id: string;
  date: string;
  notes: string | null;
  completed: boolean;
  exerciseSets: ExerciseSet[];
}

interface CatalogExercise {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  exercises: CatalogExercise[];
}

interface PreviousData {
  date: string;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

interface BaselineSet {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

interface BmSetForm {
  weight: string;
  reps: string;
  rpe: string;
}

export default function GymDayPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousData, setPreviousData] = useState<Map<string, PreviousData>>(new Map());
  const [baselines, setBaselines] = useState<Map<string, BaselineSet[]>>(new Map());
  const [editingBenchmark, setEditingBenchmark] = useState<string | null>(null);
  const [bmSets, setBmSets] = useState<BmSetForm[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGain, setXpGain] = useState<{ xp: number; level: number; levelName: string; newAchievements: { icon: string; title: string }[] } | null>(null);

  // Navigation guard while an incomplete session is active.
  useEffect(() => {
    if (session && !session.completed) {
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [session?.completed]);

  useEffect(() => {
    if (session?.date) {
      const start = new Date(session.date).getTime();
      const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      update();
      const tick = setInterval(update, 1000);
      return () => clearInterval(tick);
    }
  }, [session?.date]);

  async function fetchPrevious(exerciseName: string, sessionId: string) {
    const res = await fetch(`/api/previous?exerciseName=${encodeURIComponent(exerciseName)}&excludeSessionId=${sessionId}`);
    const data = await res.json();
    if (data) setPreviousData((prev) => new Map(prev).set(exerciseName, data));
  }

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const catRes = await fetch("/api/catalog", { cache: "no-store" });
        const cats = await catRes.json();
        setCatalog(Array.isArray(cats) ? cats : []);

        const bmRes = await fetch("/api/baselines", { cache: "no-store" });
        const bms = await bmRes.json();
        if (Array.isArray(bms)) {
          const map = new Map<string, BaselineSet[]>();
          for (const b of bms) {
            const sets = (b.sets || []).map((s: BaselineSet) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }));
            if (sets.length > 0) map.set(b.exerciseName, sets);
          }
          setBaselines(map);
        }

        // Server resumes the in-progress Gym Day or creates one — idempotent.
        const createRes = await fetch("/api/sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ freestyle: true }),
        });
        const data: Session = await createRes.json();
        setSession(data);

        // Preload previous data + auto-open categories for exercises already logged.
        const activeNames = [...new Set(data.exerciseSets.map((s) => s.exerciseName))];
        activeNames.forEach((n) => fetchPrevious(n, data.id));
        if (activeNames.length > 0 && Array.isArray(cats)) {
          const open = new Set<string>();
          for (const cat of cats) {
            if (cat.exercises.some((e: CatalogExercise) => activeNames.includes(e.name))) open.add(cat.id);
          }
          setOpenCategories(open);
        }
        setLoading(false);
      } catch {
        setError("Failed to load. Check your connection.");
        setLoading(false);
      }
    })();
  }, []);

  function activeSetsFor(name: string): ExerciseSet[] {
    if (!session) return [];
    return session.exerciseSets.filter((s) => s.exerciseName === name).sort((a, b) => a.setNumber - b.setNumber);
  }

  function isActive(name: string): boolean {
    return activeSetsFor(name).length > 0;
  }

  function prevMaxWeight(name: string): number {
    const prev = previousData.get(name);
    if (prev && prev.sets.length > 0) return Math.max(...prev.sets.map((s) => s.weight));
    return 0;
  }

  function prevBest(name: string): { bestWeight: number; bestReps: number } {
    const prev = previousData.get(name);
    if (!prev || prev.sets.length === 0) return { bestWeight: 0, bestReps: 0 };
    let bestWeight = 0, bestReps = 0;
    for (const s of prev.sets) {
      if (s.weight > bestWeight) bestWeight = s.weight;
      if (s.reps > bestReps) bestReps = s.reps;
    }
    return { bestWeight, bestReps };
  }

  function benchmarkSets(name: string): BaselineSet[] {
    return baselines.get(name) || [];
  }

  function hasBenchmark(name: string): boolean {
    return benchmarkSets(name).some((s) => s.weight != null || s.reps != null);
  }

  // Short "80×5 · 75×6" summary of the benchmark sets.
  function benchmarkSummary(name: string): string {
    return benchmarkSets(name)
      .map((s) => `${s.weight ?? "–"}×${s.reps ?? "–"}`)
      .join(" · ");
  }

  // Best e1RM across the benchmark's sets.
  function benchmarkBestE1RM(name: string): number {
    const sets = benchmarkSets(name).filter((s) => s.weight != null && s.reps != null);
    if (sets.length === 0) return 0;
    return Math.max(...sets.map((s) => estimate1RM(s.weight as number, s.reps as number)));
  }

  // Best e1RM among this session's completed sets for an exercise.
  function currentBestE1RM(name: string): number {
    const sets = activeSetsFor(name).filter((s) => s.completed);
    if (sets.length === 0) return 0;
    return Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)));
  }

  function startEditBenchmark(name: string) {
    const existing = benchmarkSets(name);
    const rows: BmSetForm[] = existing.length > 0
      ? existing.map((s) => ({ weight: s.weight != null ? String(s.weight) : "", reps: s.reps != null ? String(s.reps) : "", rpe: s.rpe != null ? String(s.rpe) : "" }))
      : [{ weight: "", reps: "", rpe: "" }, { weight: "", reps: "", rpe: "" }]; // default to 2 sets
    setBmSets(rows);
    setEditingBenchmark(name);
  }

  function updateBmSet(idx: number, field: keyof BmSetForm, value: string) {
    setBmSets((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function saveBenchmark(name: string) {
    const res = await fetch("/api/baselines", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseName: name, sets: bmSets }),
    });
    if (res.ok) {
      const saved = await res.json();
      const sets: BaselineSet[] = (saved.sets || []).map((s: BaselineSet) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }));
      setBaselines((prev) => {
        const next = new Map(prev);
        if (sets.length > 0) next.set(name, sets); else next.delete(name);
        return next;
      });
      setEditingBenchmark(null);
    }
  }

  async function addExerciseToSession(name: string) {
    if (!session) return;
    await fetchPrevious(name, session.id);
    // Start with as many sets as the benchmark defines (defaulting to 2).
    const count = Math.max(1, benchmarkSets(name).length || 2);
    const created: ExerciseSet[] = [];
    for (let i = 1; i <= count; i++) {
      const res = await fetch("/api/sets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, exerciseName: name, setNumber: i }),
      });
      if (res.ok) created.push(await res.json());
    }
    if (created.length > 0) {
      setSession((prev) => prev ? { ...prev, exerciseSets: [...prev.exerciseSets, ...created] } : prev);
    }
  }

  async function handleAddSet(name: string) {
    if (!session) return;
    const next = activeSetsFor(name).length + 1;
    const res = await fetch("/api/sets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, exerciseName: name, setNumber: next }),
    });
    if (res.ok) {
      const newSet = await res.json();
      setSession((prev) => prev ? { ...prev, exerciseSets: [...prev.exerciseSets, newSet] } : prev);
    }
  }

  async function handleDeleteSet(setId: string) {
    const res = await fetch(`/api/sets/${setId}`, { method: "DELETE" });
    if (res.ok) {
      setSession((prev) => prev ? { ...prev, exerciseSets: prev.exerciseSets.filter((s) => s.id !== setId) } : prev);
    }
  }

  async function removeExercise(name: string) {
    const sets = activeSetsFor(name);
    await Promise.all(sets.map((s) => fetch(`/api/sets/${s.id}`, { method: "DELETE" })));
    setSession((prev) => prev ? { ...prev, exerciseSets: prev.exerciseSets.filter((s) => s.exerciseName !== name) } : prev);
  }

  async function handleSaveSet(setId: string, data: { weight: number; reps: number; rpe: number | null; feeling: string | null; setType: string | null }) {
    try {
      const res = await fetch(`/api/sets/${setId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) {
        setSaveError("Failed to save set. Check your connection.");
        setTimeout(() => setSaveError(null), 4000);
        return;
      }
      setSaveError(null);
      setSession((prev) => prev ? {
        ...prev,
        exerciseSets: prev.exerciseSets.map((s) => s.id === setId ? { ...s, ...data, completed: true } : s),
      } : prev);
    } catch {
      setSaveError("Network error. Set was not saved.");
      setTimeout(() => setSaveError(null), 4000);
    }
  }

  async function handleAddCatalogExercise(categoryId: string) {
    if (!newExercise.trim()) return;
    const res = await fetch("/api/catalog", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name: newExercise.trim() }),
    });
    if (res.ok) {
      const added = await res.json();
      setCatalog((prev) => prev.map((c) => c.id === categoryId
        ? { ...c, exercises: c.exercises.some((e) => e.id === added.id) ? c.exercises : [...c.exercises, added] }
        : c));
      setNewExercise("");
      setAddingTo(null);
    }
  }

  async function handleComplete() {
    if (!session || completing) return;
    setCompleting(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, duration: elapsed, notes: sessionNotes || null }),
    });
    const xpRes = await fetch("/api/user", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
    });
    const xpData = await xpRes.json();
    if (xpData.xp) {
      setXpGain({ xp: xpData.xp, level: xpData.level, levelName: xpData.levelName, newAchievements: xpData.newAchievements || [] });
      setShowConfetti(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 5000);
    } else {
      router.push("/"); router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="pt-20 space-y-4 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-40" />
        <div className="h-4 bg-zinc-800 rounded w-56" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl" />)}
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 space-y-4">
        <p className="text-zinc-500">{error || "Could not start Gym Day"}</p>
        <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Go Home</button>
      </div>
    );
  }

  const completedSets = session.exerciseSets.filter((s) => s.completed).length;
  const totalActiveExercises = new Set(session.exerciseSets.map((s) => s.exerciseName)).size;

  return (
    <div className="space-y-5 pb-8">
      <Confetti show={showConfetti} achievements={xpGain?.newAchievements} />

      {saveError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slideUp">
          {saveError}
        </div>
      )}

      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">Gym Day</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {totalActiveExercises} exercises · {completedSets} sets logged
            {elapsed > 0 && <span className="ml-3 text-indigo-400 font-mono tabular-nums">{formatDuration(elapsed)}</span>}
          </p>
        </div>
      </header>

      {xpGain && (
        <div className="bg-zinc-900 border border-indigo-500/50 rounded-xl p-4 text-center animate-pulse">
          <p className="text-2xl font-bold text-indigo-400">+{xpGain.xp} XP!</p>
          <p className="text-xs text-zinc-400 mt-1">{xpGain.levelName} · Lv. {xpGain.level}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {catalog.map((cat) => {
          const open = openCategories.has(cat.id);
          const doneInCat = cat.exercises.filter((e) => isActive(e.name)).length;
          return (
            <section key={cat.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  const n = new Set(openCategories);
                  if (open) n.delete(cat.id); else n.add(cat.id);
                  setOpenCategories(n);
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
                  <span className="text-base font-semibold text-white">{cat.name}</span>
                </div>
                {doneInCat > 0 && (
                  <span className="text-[10px] bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">{doneInCat} active</span>
                )}
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-2 border-t border-zinc-800/60 pt-3">
                  {cat.exercises.map((ex) => {
                    const active = isActive(ex.name);
                    const bmList = benchmarkSets(ex.name);
                    const editing = editingBenchmark === ex.name;
                    const sets = active ? activeSetsFor(ex.name) : [];
                    const prev = previousData.get(ex.name);
                    const best = prevBest(ex.name);
                    const pw = prevMaxWeight(ex.name);
                    const bmFirstWeight = bmList[0]?.weight ?? 0;
                    const doneCount = sets.filter((s) => s.completed).length;
                    const bmE1RM = benchmarkBestE1RM(ex.name);
                    const curE1RM = active ? currentBestE1RM(ex.name) : 0;
                    const beatBenchmark = bmE1RM > 0 && curE1RM > bmE1RM;

                    return (
                      <div key={ex.id} className={active ? "bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2.5" : "py-0.5"}>
                        {/* Row header: add toggle + name + benchmark */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { if (!active) addExerciseToSession(ex.name); }}
                            aria-label={active ? "Added" : `Add ${ex.name}`}
                            className={`w-7 h-7 shrink-0 rounded-full text-sm font-bold flex items-center justify-center transition-all active:scale-90 ${active ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                          >
                            {active ? "✓" : "+"}
                          </button>
                          <button onClick={() => { if (!active) addExerciseToSession(ex.name); }} className="flex-1 text-left text-sm text-white">
                            {ex.name}
                          </button>
                          <button
                            onClick={() => editing ? setEditingBenchmark(null) : startEditBenchmark(ex.name)}
                            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${hasBenchmark(ex.name) ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "text-zinc-500 hover:text-amber-400"}`}
                          >
                            {hasBenchmark(ex.name) ? `🎯 ${benchmarkSummary(ex.name)}` : "Set benchmark"}
                          </button>
                        </div>

                        {/* Inline benchmark editor — one row per set */}
                        {editing && (
                          <div className="ml-9 space-y-1.5 mt-1">
                            {bmSets.map((s, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 w-8">Set {i + 1}</span>
                                <div className="flex items-center gap-1"><span className="text-[10px] text-zinc-500">kg</span>
                                  <input type="number" inputMode="decimal" step="0.5" value={s.weight} onChange={(e) => updateBmSet(i, "weight", e.target.value)} placeholder="–"
                                    className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-500" /></div>
                                <div className="flex items-center gap-1"><span className="text-[10px] text-zinc-500">reps</span>
                                  <input type="number" inputMode="numeric" value={s.reps} onChange={(e) => updateBmSet(i, "reps", e.target.value)} placeholder="–"
                                    className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-500" /></div>
                                <div className="flex items-center gap-1"><span className="text-[10px] text-zinc-500">RPE</span>
                                  <select value={s.rpe} onChange={(e) => updateBmSet(i, "rpe", e.target.value)}
                                    className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-1 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500">
                                    <option value="">–</option>
                                    {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (<option key={v} value={v}>{v}</option>))}
                                  </select></div>
                                {bmSets.length > 1 && (
                                  <button onClick={() => setBmSets((prev) => prev.filter((_, j) => j !== i))} className="text-[10px] text-zinc-600 hover:text-red-400">✕</button>
                                )}
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pt-0.5">
                              <button onClick={() => setBmSets((prev) => [...prev, { weight: "", reps: "", rpe: "" }])} className="text-[10px] text-zinc-500 hover:text-amber-400">+ Add set</button>
                              <button onClick={() => saveBenchmark(ex.name)} className="px-2.5 py-1.5 bg-amber-500 text-black rounded-lg text-[11px] font-bold active:scale-95">Save benchmark</button>
                              <button onClick={() => setEditingBenchmark(null)} className="text-[10px] text-zinc-500">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Active logger */}
                        {active && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-[10px] text-zinc-600">{doneCount}/{sets.length} sets</span>
                                {beatBenchmark && <span className="text-[10px] text-emerald-400 font-bold">↑ Beat benchmark! e1RM {curE1RM} vs {bmE1RM}</span>}
                                {bmE1RM > 0 && !beatBenchmark && curE1RM > 0 && <span className="text-[10px] text-zinc-500">e1RM {curE1RM} / target {bmE1RM}</span>}
                              </div>
                              <button onClick={() => removeExercise(ex.name)} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
                            </div>

                            {hasBenchmark(ex.name) && (
                              <p className="text-[10px] text-amber-400/80">🎯 Benchmark: {benchmarkSummary(ex.name)}{bmE1RM ? ` · best e1RM ${bmE1RM}` : ""}</p>
                            )}
                            {prev && (
                              <p className="text-[10px] text-zinc-500">Last ({new Date(prev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}): {prev.sets.map((s) => `${s.weight}×${s.reps}`).join(" · ")}</p>
                            )}
                            {!prev && !hasBenchmark(ex.name) && (
                              <p className="text-[10px] text-zinc-600">No benchmark or history yet — set a benchmark above to track progress.</p>
                            )}

                            {(pw > 0 || bmFirstWeight > 0) && <WarmupCalculator previousWeight={pw > 0 ? pw : bmFirstWeight} />}

                            <div className="space-y-2">
                              {sets.map((es) => {
                                const prevSet = prev?.sets.find((ps) => ps.setNumber === es.setNumber);
                                const seed = bmList[es.setNumber - 1];
                                return (
                                  <div key={es.id} className="relative group/set">
                                    <SetInput
                                      setNumber={es.setNumber}
                                      initialWeight={es.weight !== 0 ? es.weight : (prevSet?.weight ?? seed?.weight ?? undefined)}
                                      initialReps={es.reps !== 0 ? es.reps : (prevSet?.reps ?? seed?.reps ?? undefined)}
                                      initialRpe={es.rpe ?? (prevSet?.rpe ?? seed?.rpe ?? null)}
                                      initialFeeling={es.feeling}
                                      initialSetType={es.setType}
                                      onSave={(data) => handleSaveSet(es.id, data)}
                                      previous={prevSet || null}
                                      previousBestWeight={best.bestWeight || undefined}
                                      previousBestReps={best.bestReps || undefined}
                                    />
                                    {!es.completed && sets.length > 1 && (
                                      <button onClick={() => handleDeleteSet(es.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-700 hover:bg-red-600 text-zinc-400 hover:text-white rounded-full text-[10px] opacity-0 group-hover/set:opacity-100 transition-all flex items-center justify-center">✕</button>
                                    )}
                                  </div>
                                );
                              })}
                              <button onClick={() => handleAddSet(ex.name)}
                                className="w-full py-2 text-xs text-zinc-500 hover:text-indigo-400 border border-dashed border-zinc-800 hover:border-indigo-500/40 rounded-lg transition-colors">
                                + Add Set
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add new exercise to this category */}
                  {addingTo === cat.id ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input autoFocus value={newExercise} onChange={(e) => setNewExercise(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddCatalogExercise(cat.id); }} placeholder="New exercise name"
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      <button onClick={() => handleAddCatalogExercise(cat.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500">Add</button>
                      <button onClick={() => { setAddingTo(null); setNewExercise(""); }} className="px-2 py-1.5 text-zinc-500 text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingTo(cat.id); setNewExercise(""); }}
                      className="w-full py-2 text-xs text-zinc-500 hover:text-indigo-400 border border-dashed border-zinc-800 hover:border-indigo-500/40 rounded-lg transition-colors mt-1">
                      + New exercise
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="pt-1">
        <button onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
          {showNotes ? "▾ Hide notes" : "▸ Add session notes"}
        </button>
        {showNotes && (
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="How was the session? Any notes..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
        )}
      </div>

      <button
        onClick={handleComplete}
        disabled={completedSets === 0 || completing}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {completing ? "Saving..." : completedSets === 0 ? "Log at least one set to finish" : `Finish Gym Day (${completedSets} sets)`}
      </button>

      <PlateCalculator />
      <RestTimer />
    </div>
  );
}
