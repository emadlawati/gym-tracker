"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SetInput from "@/components/SetInput";
import RestTimer from "@/components/RestTimer";

interface TemplateExercise {
  id: string;
  exerciseName: string;
  sets: number;
  sortOrder: number;
  notes: string | null;
}

interface ExerciseSet {
  id: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
}

interface Session {
  id: string;
  templateId: string;
  date: string;
  notes: string | null;
  completed: boolean;
  template: {
    name: string;
    exercises: TemplateExercise[];
  };
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
  const [error, setError] = useState<string | null>(null);

  async function fetchPrevious(exerciseName: string, sessionId: string) {
    const res = await fetch(
      `/api/previous?exerciseName=${encodeURIComponent(exerciseName)}&excludeSessionId=${sessionId}`
    );
    const data = await res.json();
    if (data) {
      setPreviousData((prev) => new Map(prev).set(exerciseName, data));
    }
  }

  useEffect(() => {
    const templateId = params.id;

    (async () => {
      try {
        const existingRes = await fetch("/api/sessions");
        const existingSessions = await existingRes.json();

        const existing = existingSessions.find(
          (s: Session) => s.templateId === templateId && !s.completed
        );

        if (existing) {
          const res = await fetch(`/api/sessions/${existing.id}`);
          const data = await res.json();
          setSession(data);

          data.template.exercises.forEach((exercise: TemplateExercise) => {
            fetchPrevious(exercise.exerciseName, data.id);
          });
        } else {
          const res = await fetch(`/api/templates/${templateId}`);
          const template = await res.json();

          if (template.error) {
            setError("Template not found");
            setLoading(false);
            return;
          }

          const createRes = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId }),
          });
          const newSession = await createRes.json();
          setSession(newSession);

          newSession.template.exercises.forEach((exercise: TemplateExercise) => {
            fetchPrevious(exercise.exerciseName, newSession.id);
          });
        }
        setLoading(false);
      } catch {
        setError("Failed to load workout");
        setLoading(false);
      }
    })();

    return () => {};
  }, [params.id]);

  async function handleSaveSet(setId: string, data: { weight: number; reps: number; rpe: number | null }) {
    await fetch(`/api/sets/${setId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exerciseSets: prev.exerciseSets.map((s) =>
          s.id === setId ? { ...s, ...data, completed: true } : s
        ),
      };
    });
  }

  async function handleComplete() {
    if (!session) return;
    await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <p className="text-zinc-500">Loading workout...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 space-y-4">
        <p className="text-zinc-500">{error || "Session not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm"
        >
          Go Home
        </button>
      </div>
    );
  }

  const exercises = session.template.exercises;
  const allSetsCompleted = session.exerciseSets.every((s) => s.completed);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">{session.template.name}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exercises.length} exercises · {session.exerciseSets.length} sets
          </p>
        </div>
        <button
          onClick={() => router.push(`/history/${session.id}`)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          View detail
        </button>
      </header>

      {exercises.map((exercise) => {
        const exerciseSets = session.exerciseSets
          .filter((s) => s.exerciseName === exercise.exerciseName)
          .sort((a, b) => a.setNumber - b.setNumber);

        const prev = previousData.get(exercise.exerciseName);
        const completedCount = exerciseSets.filter((s) => s.completed).length;

        return (
          <section key={exercise.id} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-white">{exercise.exerciseName}</h2>
              <span className="text-xs text-zinc-600">
                {completedCount}/{exercise.sets} sets
              </span>
              {exercise.notes && (
                <span className="text-xs text-zinc-600 italic ml-auto max-w-[200px] truncate">
                  {exercise.notes}
                </span>
              )}
            </div>

            {prev && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                <p className="text-xs text-zinc-500">
                  Last time ({prev.templateName}, {new Date(prev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}):
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {prev.sets.map((ps, i) => (
                    <span key={i} className="text-xs text-zinc-300">
                      Set {ps.setNumber}: {ps.weight}kg x {ps.reps}
                      {ps.rpe ? ` @ RPE ${ps.rpe}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {exerciseSets.map((es) => {
                const prevSet = prev?.sets.find((ps) => ps.setNumber === es.setNumber);
                return (
                  <SetInput
                    key={es.id}
                    setNumber={es.setNumber}
                    initialWeight={es.weight || undefined}
                    initialReps={es.reps || undefined}
                    initialRpe={es.rpe}
                    onSave={(data) => handleSaveSet(es.id, data)}
                    previous={prevSet || null}
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
          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {allSetsCompleted ? "Finish Workout" : "Complete all sets to finish"}
        </button>
        {!allSetsCompleted && (
          <p className="text-center text-xs text-zinc-600 mt-2">
            {session.exerciseSets.filter((s) => !s.completed).length} sets remaining
          </p>
        )}
      </div>

      <RestTimer />
    </div>
  );
}
