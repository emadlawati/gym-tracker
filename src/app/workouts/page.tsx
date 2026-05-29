"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Exercise {
  exerciseName: string;
  sets: number;
  sortOrder: number;
  notes?: string;
}

interface Template {
  id: string;
  name: string;
  exercises: Exercise[];
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  function startNew() {
    setIsCreating(true);
    setEditing(null);
    setName("");
    setExercises([]);
  }

  function startEdit(t: Template) {
    setIsCreating(false);
    setEditing(t);
    setName(t.name);
    setExercises(
      t.exercises.map((e) => ({
        exerciseName: e.exerciseName,
        sets: e.sets,
        sortOrder: e.sortOrder,
        notes: e.notes || "",
      }))
    );
  }

  function cancelForm() {
    setIsCreating(false);
    setEditing(null);
    setName("");
    setExercises([]);
  }

  async function handleSave() {
    if (!name.trim() || exercises.length === 0) return;

    const payload = {
      name: name.trim(),
      exercises: exercises.map((ex, i) => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        sortOrder: i,
        notes: ex.notes || undefined,
      })),
    };

    if (editing) {
      await fetch(`/api/templates/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    cancelForm();
    fetchTemplates();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workout template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
    router.refresh();
  }

  function addExercise() {
    setExercises([...exercises, { exerciseName: "", sets: 3, sortOrder: exercises.length }]);
  }

  function removeExercise(idx: number) {
    setExercises(exercises.filter((_, i) => i !== idx));
  }

  const showForm = editing !== null || isCreating;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        {!showForm && (
          <button
            onClick={startNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            + New
          </button>
        )}
      </header>

      {/* List */}
      {!showForm && (
        <div className="space-y-2">
          {loading ? (
            <p className="text-zinc-500 text-sm">Loading...</p>
          ) : templates.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No workout templates yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Create Workout A, B, C to start tracking.</p>
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(t)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {t.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center text-sm">
                      <span className="text-zinc-500 w-6 text-xs">{i + 1}.</span>
                      <span className="text-zinc-300 flex-1">{ex.exerciseName}</span>
                      <span className="text-zinc-500 text-xs">{ex.sets} sets</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Workout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workout A"
              className="w-full mt-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Exercises
              </label>
              <button
                onClick={addExercise}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={ex.exerciseName}
                      onChange={(e) => {
                        const n = [...exercises];
                        n[idx] = { ...n[idx], exerciseName: e.target.value };
                        setExercises(n);
                      }}
                      placeholder="Exercise name"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => removeExercise(idx)}
                      className="text-red-400 text-xs px-2 py-2 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-zinc-500">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.sets}
                        onChange={(e) => {
                          const n = [...exercises];
                          n[idx] = { ...n[idx], sets: parseInt(e.target.value) || 3 };
                          setExercises(n);
                        }}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={ex.notes || ""}
                      onChange={(e) => {
                        const n = [...exercises];
                        n[idx] = { ...n[idx], notes: e.target.value };
                        setExercises(n);
                      }}
                      placeholder="Notes (optional)"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || exercises.length === 0 || exercises.some((e) => !e.exerciseName.trim())}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editing ? "Update Workout" : "Create Workout"}
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
          {(!name.trim() || exercises.length === 0) && (
            <p className="text-xs text-zinc-500 mt-1">
              {!name.trim() ? "Enter a workout name" : "Add at least one exercise"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
