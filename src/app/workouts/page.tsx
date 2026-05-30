"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const COMMON_EXERCISES = [
  "Bench Press", "Barbell Bench Press", "Dumbbell Bench Press", "Incline Bench Press",
  "Overhead Press", "OHP", "Standing Barbell OHP", "Arnold Press",
  "Squat", "Barbell Squat", "Goblet Squat", "Front Squat", "Bulgarian Split Squats",
  "Deadlift", "Romanian Deadlift", "RDL", "Sumo Deadlift",
  "Pull-ups", "Weighted Pull-ups", "Chin-ups", "Barbell Row", "Dumbbell Row", "Chest-Supported Row",
  "Hip Thrust", "Barbell Hip Thrust", "KAS Glute Bridge",
  "Leg Curl", "Seated Leg Curl", "Lying Leg Curl", "Leg Press",
  "Skullcrushers", "Rope Tricep Pushdown", "Dips", "Close-grip Bench Press", "Tricep Pushdown",
  "Barbell Curls", "Dumbbell Curls", "Hammer Curls", "Concentration Curls", "Preacher Curls",
  "Wrist Curls", "Reverse Wrist Curls", "Farmer's Walks",
  "Lateral Raises", "Dumbbell Lateral Raise", "Cable Lateral Raise",
  "Plank", "Hanging Leg Raises", "Russian Twists", "Ab Wheel",
  "Banded Glute Abduction", "Nordic Curls", "Back Extension", "Face Pull",
];

interface Exercise {
  exerciseName: string;
  sets: number;
  sortOrder: number;
  notes?: string;
  settings?: string;
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
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
        settings: (e as Exercise & { settings?: string }).settings || "",
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
        settings: ex.settings || undefined,
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
    setExercises([...exercises, { exerciseName: "", sets: 3, sortOrder: exercises.length, settings: "" }]);
  }

  function removeExercise(idx: number) {
    setExercises(exercises.filter((_, i) => i !== idx));
  }

  function filterSuggestions(query: string) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return COMMON_EXERCISES.filter((e) => e.toLowerCase().includes(q)).slice(0, 6);
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
                  <div className="relative flex items-start gap-2">
                    <input
                      type="text"
                      value={ex.exerciseName}
                      onChange={(e) => {
                        const n = [...exercises];
                        n[idx] = { ...n[idx], exerciseName: e.target.value };
                        setExercises(n);
                        setActiveDropdown(idx);
                        setSuggestions(filterSuggestions(e.target.value));
                      }}
                      onFocus={() => {
                        setActiveDropdown(idx);
                        if (ex.exerciseName) setSuggestions(filterSuggestions(ex.exerciseName));
                      }}
                      onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      placeholder="Exercise name (e.g. Bench Press)"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    {activeDropdown === idx && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-10 mt-1 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                        {suggestions.map((s, si) => (
                          <button
                            key={si}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const n = [...exercises];
                              n[idx] = { ...n[idx], exerciseName: s };
                              setExercises(n);
                              setActiveDropdown(null);
                              setSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-700/50 last:border-0"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
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
                  <input
                    type="text"
                    value={ex.settings || ""}
                    onChange={(e) => {
                      const n = [...exercises];
                      n[idx] = { ...n[idx], settings: e.target.value };
                      setExercises(n);
                    }}
                    placeholder="Settings (e.g. seat pos 5, medium grip)"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                  />
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
