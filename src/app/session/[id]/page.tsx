"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SetInput from "@/components/SetInput";
import RestTimer from "@/components/RestTimer";
import PlateCalculator from "@/components/PlateCalculator";
import WarmupCalculator from "@/components/WarmupCalculator";
import ProgressRing from "@/components/ProgressRing";
import Confetti from "@/components/Confetti";
import { formatDuration } from "@/lib/utils";

interface TemplateExercise {
  id: string;
  exerciseName: string;
  sets: number;
  sortOrder: number;
  notes: string | null;
  settings?: string | null;
  defaultWeight?: number | null;
  defaultReps?: number | null;
  defaultRpe?: number | null;
}

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
  templateId: string;
  date: string;
  notes: string | null;
  completed: boolean;
  duration: number | null;
  xpEarned: number | null;
  template: { name: string; exercises: TemplateExercise[] };
  exerciseSets: ExerciseSet[];
}

interface PreviousData {
  date: string;
  templateName: string;
  sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousData, setPreviousData] = useState<Map<string, PreviousData>>(new Map());
  const [collapsedPrev, setCollapsedPrev] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGain, setXpGain] = useState<{
    xp: number; level: number; levelName: string;
    newAchievements: { icon: string; title: string }[];
  } | null>(null);
  const [showProgression, setShowProgression] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [pendingResume, setPendingResume] = useState<{ session: Session; date: string } | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);

  // Auto-collapse an exercise only when it transitions into "all sets done" —
  // manual re-expands survive, and already-complete exercises start collapsed.
  // Render-phase "adjust state when props change" pattern (no effect needed).
  const [prevComplete, setPrevComplete] = useState<Map<string, boolean> | null>(null);
  if (session) {
    const next = new Map<string, boolean>();
    for (const ex of session.template.exercises) {
      const sets = session.exerciseSets.filter((s) => s.exerciseName === ex.exerciseName);
      next.set(ex.exerciseName, sets.length > 0 && sets.every((s) => s.completed));
    }
    const prev = prevComplete;
    const firstRun = prev === null;
    const toCollapse: string[] = [];
    for (const [name, complete] of next) {
      if (complete && (firstRun || prev.get(name) === false)) toCollapse.push(name);
    }
    const newToCollapse = toCollapse.filter((n) => !collapsedExercises.has(n));
    const mapChanged = firstRun || [...next].some(([k, v]) => prev.get(k) !== v);
    if (mapChanged) setPrevComplete(next);
    if (newToCollapse.length > 0) {
      setCollapsedExercises((prevSet) => new Set([...prevSet, ...newToCollapse]));
    }
  }

  useEffect(() => {
    if (session && !session.completed) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [session?.completed]);

  useEffect(() => {
    if (session?.date) {
      const startTime = new Date(session.date).getTime();
      const updateElapsed = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
      updateElapsed();
      const tick = setInterval(updateElapsed, 1000);
      return () => clearInterval(tick);
    }
  }, [session?.date]);

  async function fetchPrevious(exerciseName: string, sessionId: string) {
    const res = await fetch(`/api/previous?exerciseName=${encodeURIComponent(exerciseName)}&excludeSessionId=${sessionId}`);
    const data = await res.json();
    if (data) setPreviousData((prev) => new Map(prev).set(exerciseName, data));
  }

  useEffect(() => {
    const templateId = params.id;
    (async () => {
      try {
        const existingRes = await fetch("/api/sessions");
        const existingSessions = await existingRes.json();
        const existing = existingSessions.find((s: Session) => s.templateId === templateId && !s.completed);

        if (existing) {
          const completedSets = existing.exerciseSets?.filter((s: ExerciseSet) => s.completed).length || 0;
          if (completedSets > 0) {
            const res = await fetch(`/api/sessions/${existing.id}`);
            const data = await res.json();
            setPendingResume({ session: data, date: new Date(existing.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) });
            setLoading(false);
            return;
          }
          const res = await fetch(`/api/sessions/${existing.id}`);
          const data = await res.json();
          setSession(data);
          data.template.exercises.forEach((exercise: TemplateExercise) => { fetchPrevious(exercise.exerciseName, data.id); });
        } else {
          const res = await fetch(`/api/templates/${templateId}`);
          const template = await res.json();
          if (template.error) { setError("Template not found"); setLoading(false); return; }

          const createRes = await fetch("/api/sessions", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId }),
          });
          const newSession = await createRes.json();
          setSession(newSession);
          newSession.template.exercises.forEach((exercise: TemplateExercise) => { fetchPrevious(exercise.exerciseName, newSession.id); });
        }
        setLoading(false);
      } catch { setError("Failed to load workout"); setLoading(false); }
    })();
  }, [params.id]);

  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSaveAndSync(setId: string, data: { weight: number; reps: number; rpe: number | null; feeling: string | null; setType: string | null }) {
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
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, exerciseSets: prev.exerciseSets.map((s) => s.id === setId ? { ...s, ...data, completed: true } : s) };
      });
    } catch {
      setSaveError("Network error. Set was not saved.");
      setTimeout(() => setSaveError(null), 4000);
    }
  }

  function copyPreviousToSet(setId: string, ps: { weight: number; reps: number; rpe: number | null }) {
    handleSaveAndSync(setId, { weight: ps.weight, reps: ps.reps, rpe: ps.rpe, feeling: null, setType: "working" });
  }

  async function handleAddSet(exerciseName: string) {
    if (!session) return;
    const existingSets = session.exerciseSets.filter((s) => s.exerciseName === exerciseName);
    const nextSetNumber = existingSets.length + 1;
    const res = await fetch("/api/sets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, exerciseName, setNumber: nextSetNumber }),
    });
    if (res.ok) {
      const newSet = await res.json();
      setSession((prev) => prev ? { ...prev, exerciseSets: [...prev.exerciseSets, newSet] } : prev);
    }
  }

  async function handleResumeSession() {
    if (!pendingResume) return;
    setSession(pendingResume.session);
    pendingResume.session.template.exercises.forEach((exercise: TemplateExercise) => {
      fetchPrevious(exercise.exerciseName, pendingResume.session.id);
    });
    setPendingResume(null);
  }

  async function handleDiscardAndStartFresh() {
    if (!pendingResume) return;
    await fetch(`/api/sessions/${pendingResume.session.id}`, { method: "DELETE" });
    setPendingResume(null);
    setLoading(true);
    const res = await fetch(`/api/templates/${params.id}`);
    const template = await res.json();
    if (template.error) { setError("Template not found"); setLoading(false); return; }
    const createRes = await fetch("/api/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: params.id }),
    });
    const newSession = await createRes.json();
    setSession(newSession);
    newSession.template.exercises.forEach((exercise: TemplateExercise) => { fetchPrevious(exercise.exerciseName, newSession.id); });
    setLoading(false);
  }

  async function handleDeleteSet(setId: string) {
    const res = await fetch(`/api/sets/${setId}`, { method: "DELETE" });
    if (res.ok) {
      setSession((prev) => prev ? { ...prev, exerciseSets: prev.exerciseSets.filter((s) => s.id !== setId) } : prev);
    }
  }

  function getVolumePR(exerciseName: string): { current: number; previous: number } | null {
    if (!session) return null;
    const currentSets = session.exerciseSets.filter((s) => s.exerciseName === exerciseName && s.completed);
    const currentVolume = currentSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    if (currentVolume === 0) return null;
    const prev = previousData.get(exerciseName);
    if (!prev) return null;
    const prevVolume = prev.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    if (currentVolume > prevVolume && prevVolume > 0) return { current: currentVolume, previous: prevVolume };
    return null;
  }

  function getPreviousBest(exerciseName: string): { bestWeight: number; bestReps: number } {
    const prev = previousData.get(exerciseName);
    if (!prev || prev.sets.length === 0) return { bestWeight: 0, bestReps: 0 };
    let bestWeight = 0;
    let bestReps = 0;
    for (const s of prev.sets) {
      if (s.weight > bestWeight) bestWeight = s.weight;
      if (s.reps > bestReps) bestReps = s.reps;
    }
    return { bestWeight, bestReps };
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
      setShowProgression(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 6000);
    } else { router.push("/"); router.refresh(); }
  }

  function getPreviousWeight(exerciseName: string): number {
    const prev = previousData.get(exerciseName);
    if (prev && prev.sets.length > 0) {
      return Math.max(...prev.sets.map((s) => s.weight));
    }
    return 0;
  }

  if (pendingResume) {
    const completedCount = pendingResume.session.exerciseSets.filter((s) => s.completed).length;
    const totalCount = pendingResume.session.exerciseSets.length;
    return (
      <div className="flex flex-col items-center justify-center pt-20 space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-sm w-full text-center">
          <p className="text-base font-semibold text-white">Unfinished Session</p>
          <p className="text-sm text-zinc-400">
            You have a session from {pendingResume.date} with {completedCount}/{totalCount} sets completed.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={handleResumeSession}
              className="w-full py-3 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright transition-all active:scale-[0.98]">
              Resume Session
            </button>
            <button onClick={handleDiscardAndStartFresh}
              className="w-full py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-all active:scale-[0.98]">
              Discard & Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-20 space-y-4 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-40" />
        <div className="h-4 bg-zinc-800 rounded w-56" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="h-5 bg-zinc-800 rounded w-32" />
            <div className="h-24 bg-zinc-800/50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 space-y-4">
        <p className="text-zinc-500">{error || "Session not found"}</p>
        <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright">Go Home</button>
      </div>
    );
  }

  const exercises = session.template.exercises;
  const completedSets = session.exerciseSets.filter((s) => s.completed).length;
  const totalSets = session.exerciseSets.length;
  const allSetsCompleted = completedSets === totalSets;

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
          <h1 className="text-xl font-bold text-white">{session.template?.name || "Workout"}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exercises.length} exercises · {totalSets} sets
            {elapsed > 0 && <span className="ml-3 text-volt font-mono tabular-nums">{formatDuration(elapsed)}</span>}
          </p>
        </div>
        <button onClick={() => router.push(`/history/${session.id}`)} className="text-xs text-zinc-500 hover:text-zinc-300">Detail</button>
      </header>

      <ProgressRing completed={completedSets} total={totalSets} />

      {xpGain && (
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-volt/50 rounded-xl p-4 text-center animate-popIn">
            <p className="text-2xl font-bold text-volt">+{xpGain.xp} XP</p>
            <p className="text-xs text-zinc-400 mt-1">{xpGain.levelName} · Lv. {xpGain.level}</p>
          </div>

          {showProgression && session && (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white text-center">Progressive Overload</p>
              {exercises.map((exercise) => {
                const sets = session.exerciseSets.filter((s) => s.exerciseName === exercise.exerciseName && s.completed);
                if (sets.length === 0) return null;
                const allHitTarget = sets.every((s) => s.reps >= 8);
                const maxWeight = Math.max(...sets.map((s) => s.weight));
                const isCompound = ["squat", "bench", "deadlift", "press", "row"].some((k) => exercise.exerciseName.toLowerCase().includes(k));
                const increment = isCompound ? 2.5 : 1.25;
                return allHitTarget ? (
                  <p key={exercise.id} className="text-xs text-emerald-400">
                    {exercise.exerciseName}: +{increment}kg (→ {maxWeight + increment}kg)
                  </p>
                ) : (
                  <p key={exercise.id} className="text-[10px] text-zinc-500">
                    {exercise.exerciseName}: keep at {maxWeight}kg, build reps
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      {exercises.map((exercise) => {
        const exerciseSets = session.exerciseSets.filter((s) => s.exerciseName === exercise.exerciseName).sort((a, b) => a.setNumber - b.setNumber);
        const prev = previousData.get(exercise.exerciseName);
        const completedCount = exerciseSets.filter((s) => s.completed).length;
        const volumePR = getVolumePR(exercise.exerciseName);
        const prevWeight = getPreviousWeight(exercise.exerciseName);
        const prevBest = getPreviousBest(exercise.exerciseName);
        const isCollapsed = collapsedPrev.has(exercise.exerciseName);

        const isExerciseCollapsed = collapsedExercises.has(exercise.exerciseName);
        const exerciseComplete = completedCount === exerciseSets.length;

        return (
          <section key={exercise.id} className={`bg-zinc-900 border rounded-xl p-4 space-y-3 transition-colors ${
            exerciseComplete ? "border-emerald-500/25" : "border-zinc-800"
          }`}>
            <button
              onClick={() => {
                const n = new Set(collapsedExercises);
                if (isExerciseCollapsed) n.delete(exercise.exerciseName); else n.add(exercise.exerciseName);
                setCollapsedExercises(n);
              }}
              aria-expanded={!isExerciseCollapsed}
              className="flex items-center gap-2 w-full text-left"
            >
              <span className={`text-[10px] text-zinc-500 transition-transform ${isExerciseCollapsed ? "" : "rotate-90"}`}>▸</span>
              <h2 className="text-base font-semibold text-white">{exercise.exerciseName}</h2>
              <span className="text-xs text-zinc-600 tabular-nums">{completedCount}/{exerciseSets.length}</span>
              {exerciseComplete && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">Done</span>}
              {volumePR && (
                <span className="text-[10px] bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded font-bold">PR</span>
              )}
            </button>

            {!isExerciseCollapsed && exercise.notes && <p className="text-xs text-zinc-500 italic">{exercise.notes}</p>}
            {!isExerciseCollapsed && exercise.settings && <p className="text-[10px] text-zinc-600">Settings: {exercise.settings}</p>}

            {!isExerciseCollapsed && prevWeight > 0 && <WarmupCalculator previousWeight={prevWeight} />}

            {!isExerciseCollapsed && prev && (
              <div>
                <button
                  onClick={() => {
                    const n = new Set(collapsedPrev);
                    if (isCollapsed) n.delete(exercise.exerciseName); else n.add(exercise.exerciseName);
                    setCollapsedPrev(n);
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <span className={`text-[10px] transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▸</span>
                  Last: {new Date(prev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {!isCollapsed && (
                    <span className="ml-1 text-zinc-600 tabular-nums">
                      {prev.sets.map((ps) => `${ps.weight}×${ps.reps}`).join(" · ")}
                    </span>
                  )}
                </button>
                {isCollapsed && (
                  <div className="mt-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 space-y-1">
                    {prev.sets.map((ps) => (
                      <div key={ps.setNumber} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 tabular-nums">Set {ps.setNumber}: {ps.weight}kg × {ps.reps}{ps.rpe ? ` @RPE ${ps.rpe}` : ""}</span>
                        <button
                          onClick={() => {
                            const es = exerciseSets.find((e) => e.setNumber === ps.setNumber);
                            if (es) copyPreviousToSet(es.id, ps);
                          }}
                          className="text-[10px] text-volt hover:text-volt-bright px-2 py-0.5 rounded bg-zinc-800"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isExerciseCollapsed && <div className="space-y-2">
              {exerciseSets.map((es) => {
                const prevSet = prev?.sets.find((ps) => ps.setNumber === es.setNumber);
                return (
                  <div key={es.id} className="relative group/set">
                    <SetInput
                      setNumber={es.setNumber}
                      initialWeight={es.weight !== 0 ? es.weight : (prevSet?.weight || exercise.defaultWeight || undefined)}
                      initialReps={es.reps !== 0 ? es.reps : (prevSet?.reps || exercise.defaultReps || undefined)}
                      initialRpe={es.rpe ?? (prevSet?.rpe ?? exercise.defaultRpe ?? null)}
                      initialFeeling={es.feeling}
                      initialSetType={es.setType}
                      onSave={(data) => handleSaveAndSync(es.id, data)}
                      previous={prevSet || null}
                      previousBestWeight={prevBest.bestWeight || undefined}
                      previousBestReps={prevBest.bestReps || undefined}
                    />
                    {!es.completed && exerciseSets.length > 1 && (
                      <button onClick={() => handleDeleteSet(es.id)} aria-label="Delete set"
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-zinc-700 hover:bg-red-600 text-zinc-300 hover:text-white rounded-full text-[10px] opacity-60 group-hover/set:opacity-100 transition-all flex items-center justify-center">✕</button>
                    )}
                  </div>
                );
              })}
              <button onClick={() => handleAddSet(exercise.exerciseName)}
                className="w-full py-2 text-xs text-zinc-500 hover:text-volt border border-dashed border-zinc-800 hover:border-volt/40 rounded-lg transition-colors">
                + Add Set
              </button>
            </div>}
          </section>
        );
      })}

      <div className="pt-2">
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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-volt resize-none mb-3"
          />
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={handleComplete}
          disabled={!allSetsCompleted || completing}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {completing ? "Saving..." : allSetsCompleted ? "Finish Workout" : `Complete all sets (${totalSets - completedSets} remaining)`}
        </button>
      </div>

      <PlateCalculator />
      <RestTimer />
    </div>
  );
}
