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

  useEffect(() => { const tick = setInterval(() => setElapsed((p) => p + 1), 1000); return () => clearInterval(tick); }, []);

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
    return () => {};
  }, [params.id]);

  async function handleSaveAndSync(setId: string, data: { weight: number; reps: number; rpe: number | null; feeling: string | null; setType: string | null }) {
    await fetch(`/api/sets/${setId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, exerciseSets: prev.exerciseSets.map((s) => s.id === setId ? { ...s, ...data, completed: true } : s) };
    });
  }

  function copyPreviousToSet(setId: string, ps: { weight: number; reps: number; rpe: number | null }) {
    handleSaveAndSync(setId, { weight: ps.weight, reps: ps.reps, rpe: ps.rpe, feeling: null, setType: "working" });
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
    if (!session) return;
    await fetch(`/api/sessions/${session.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true, duration: elapsed }),
    });

    const xpRes = await fetch("/api/user", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id }),
    });
    const xpData = await xpRes.json();

    if (xpData.xp) {
      setXpGain({ xp: xpData.xp, level: xpData.level, levelName: xpData.levelName, newAchievements: xpData.newAchievements || [] });
      setShowConfetti(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 4000);
    } else { router.push("/"); router.refresh(); }
  }

  function getFirstWorkingWeight(exerciseName: string): number {
    if (!session) return 0;
    const sets = session.exerciseSets.filter((s) => s.exerciseName === exerciseName && s.completed);
    if (sets.length === 0) {
      const prev = previousData.get(exerciseName);
      if (prev && prev.sets.length > 0) return prev.sets[0].weight;
      return 0;
    }
    return sets[0].weight;
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
        <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Go Home</button>
      </div>
    );
  }

  const exercises = session.template.exercises;
  const completedSets = session.exerciseSets.filter((s) => s.completed).length;
  const totalSets = session.exerciseSets.length;
  const allSetsCompleted = completedSets === totalSets;

  return (
    <div className="space-y-6 pb-8">
      <Confetti show={showConfetti} achievements={xpGain?.newAchievements} />

      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">{session.template?.name || "Workout"}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exercises.length} exercises · {totalSets} sets
            {elapsed > 0 && <span className="ml-3 text-indigo-400 font-mono tabular-nums">{formatDuration(elapsed)}</span>}
          </p>
        </div>
        <button onClick={() => router.push(`/history/${session.id}`)} className="text-xs text-zinc-500 hover:text-zinc-300">Detail</button>
      </header>

      <ProgressRing completed={completedSets} total={totalSets} />

      {xpGain && (
        <div className="bg-zinc-900 border border-indigo-500/50 rounded-xl p-4 text-center animate-pulse">
          <p className="text-2xl font-bold text-indigo-400">+{xpGain.xp} XP!</p>
          <p className="text-xs text-zinc-400 mt-1">{xpGain.levelName} · Lv. {xpGain.level}</p>
        </div>
      )}

      {exercises.map((exercise) => {
        const exerciseSets = session.exerciseSets.filter((s) => s.exerciseName === exercise.exerciseName).sort((a, b) => a.setNumber - b.setNumber);
        const prev = previousData.get(exercise.exerciseName);
        const completedCount = exerciseSets.filter((s) => s.completed).length;
        const volumePR = getVolumePR(exercise.exerciseName);
        const workingWeight = getFirstWorkingWeight(exercise.exerciseName);
        const prevBest = getPreviousBest(exercise.exerciseName);
        const isCollapsed = collapsedPrev.has(exercise.exerciseName);

        return (
          <section key={exercise.id} className="space-y-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white">{exercise.exerciseName}</h2>
              <span className="text-xs text-zinc-600">{completedCount}/{exercise.sets}</span>
              {volumePR && (
                <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded font-bold">PR!</span>
              )}
            </div>

            {exercise.notes && <p className="text-xs text-zinc-500 italic">{exercise.notes}</p>}
            {exercise.settings && <p className="text-[10px] text-zinc-600">Settings: {exercise.settings}</p>}

            {workingWeight > 0 && <WarmupCalculator workingWeight={workingWeight} />}

            {prev && (
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
                    <span className="ml-1 text-zinc-600">
                      {prev.sets.map((ps) => `${ps.weight}×${ps.reps}`).join(" · ")}
                    </span>
                  )}
                </button>
                {isCollapsed && (
                  <div className="mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 space-y-1">
                    {prev.sets.map((ps) => (
                      <div key={ps.setNumber} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Set {ps.setNumber}: {ps.weight}kg × {ps.reps}{ps.rpe ? ` @RPE ${ps.rpe}` : ""}</span>
                        <button
                          onClick={() => {
                            const es = exerciseSets.find((e) => e.setNumber === ps.setNumber);
                            if (es) copyPreviousToSet(es.id, ps);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-zinc-800"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {exerciseSets.map((es) => {
                const prevSet = prev?.sets.find((ps) => ps.setNumber === es.setNumber);
                return (
                  <SetInput
                    key={es.id}
                    setNumber={es.setNumber}
                    initialWeight={es.weight !== 0 ? es.weight : (prevSet?.weight || undefined)}
                    initialReps={es.reps !== 0 ? es.reps : (prevSet?.reps || undefined)}
                    initialRpe={es.rpe}
                    initialFeeling={es.feeling}
                    initialSetType={es.setType}
                    onSave={(data) => handleSaveAndSync(es.id, data)}
                    previous={prevSet || null}
                    previousBestWeight={prevBest.bestWeight || undefined}
                    previousBestReps={prevBest.bestReps || undefined}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="pt-4">
        <button
          onClick={handleComplete}
          disabled={!allSetsCompleted}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {allSetsCompleted ? "Finish Workout" : `Complete all sets (${totalSets - completedSets} remaining)`}
        </button>
      </div>

      <PlateCalculator />
      <RestTimer />
    </div>
  );
}
