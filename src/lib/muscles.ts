interface MuscleInfo { primary: string; secondary?: string[] }

const MUSCLE_MAP: Record<string, MuscleInfo> = {
  "bench": { primary: "Chest", secondary: ["Triceps", "Shoulders"] },
  "ohp": { primary: "Shoulders", secondary: ["Triceps"] },
  "overhead": { primary: "Shoulders", secondary: ["Triceps"] },
  "arnold": { primary: "Shoulders", secondary: ["Triceps"] },
  "squat": { primary: "Quads", secondary: ["Glutes", "Hamstrings"] },
  "goblet": { primary: "Quads", secondary: ["Glutes"] },
  "front squat": { primary: "Quads", secondary: ["Glutes"] },
  "bulgarian": { primary: "Quads", secondary: ["Glutes"] },
  "deadlift": { primary: "Hamstrings", secondary: ["Back", "Glutes"] },
  "rdl": { primary: "Hamstrings", secondary: ["Glutes"] },
  "romanian": { primary: "Hamstrings", secondary: ["Glutes"] },
  "pull": { primary: "Back", secondary: ["Biceps"] },
  "chin": { primary: "Back", secondary: ["Biceps"] },
  "row": { primary: "Back", secondary: ["Biceps"] },
  "hip thrust": { primary: "Glutes", secondary: ["Hamstrings"] },
  "kas": { primary: "Glutes" },
  "glute bridge": { primary: "Glutes" },
  "glute abduction": { primary: "Glutes" },
  "leg curl": { primary: "Hamstrings" },
  "leg press": { primary: "Quads", secondary: ["Glutes"] },
  "skullcrusher": { primary: "Triceps" },
  "tricep": { primary: "Triceps" },
  "dips": { primary: "Triceps", secondary: ["Chest"] },
  "curl": { primary: "Biceps" },
  "hammer": { primary: "Biceps", secondary: ["Forearms"] },
  "wrist": { primary: "Forearms" },
  "farmer": { primary: "Forearms", secondary: ["Traps"] },
  "lateral raise": { primary: "Shoulders" },
  "plank": { primary: "Abs" },
  "leg raise": { primary: "Abs" },
  "hanging": { primary: "Abs" },
  "russian twist": { primary: "Abs" },
  "nordic": { primary: "Hamstrings" },
  "face pull": { primary: "Shoulders", secondary: ["Back"] },
  "extension": { primary: "Back", secondary: ["Glutes"] },
  "incline": { primary: "Chest", secondary: ["Shoulders"] },
  "fly": { primary: "Chest" },
  "press": { primary: "Chest", secondary: ["Triceps", "Shoulders"] },
  "chest": { primary: "Chest" },
  "abductor": { primary: "Glutes" },
  "calve": { primary: "Calves" },
  "calf": { primary: "Calves" },
  "shrug": { primary: "Traps" },
  "trap": { primary: "Traps" },
};

export function getMuscles(exerciseName: string): MuscleInfo {
  const lower = exerciseName.toLowerCase();
  for (const [keyword, info] of Object.entries(MUSCLE_MAP)) {
    if (lower.includes(keyword)) return info;
  }
  return { primary: "Other" };
}

export const ALL_MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Triceps", "Biceps",
  "Quads", "Hamstrings", "Glutes", "Calves", "Abs",
  "Forearms", "Traps",
];
