export function estimate1RM(weight: number, reps: number): number {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return formatDate(date);
}

export function isSameUTCDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate();
}

const PLATES = [20, 15, 10, 5, 2.5, 1.25];
const BARBELL = 20;

export function calculatePlates(targetWeight: number): { perSide: number[]; total: number } | null {
  if (targetWeight <= BARBELL) return null;
  const weightPerSide = (targetWeight - BARBELL) / 2;
  const perSide: number[] = [];
  let remaining = weightPerSide;

  for (const plate of PLATES) {
    while (remaining >= plate) {
      perSide.push(plate);
      remaining = parseFloat((remaining - plate).toFixed(2));
    }
  }

  const actualWeight = BARBELL + perSide.reduce((a, b) => a + b, 0) * 2;
  return { perSide, total: actualWeight };
}

export function getWarmupSets(previousWeight: number): { percentage: number; weight: number; reps: number }[] {
  if (previousWeight <= 0) return [];
  const sets: { percentage: number; weight: number; reps: number }[] = [];

  for (const { pct, reps } of [{ pct: 50, reps: 8 }, { pct: 80, reps: 3 }]) {
    let w = Math.round((previousWeight * pct) / 100 / 2.5) * 2.5;
    if (w <= BARBELL) w = BARBELL;
    if (w < previousWeight) sets.push({ percentage: pct, weight: w, reps });
  }

  return sets;
}

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [...new Set(dates.map((d) => new Date(d).toDateString()))].sort().reverse();

  let streak = 0;
  const today = new Date().toDateString();

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (uniqueDays[i] === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  if (uniqueDays[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (uniqueDays[0] === yesterday.toDateString()) {
      return streak;
    }
    return 0;
  }

  return streak;
}

export function normalizeExerciseName(name: string): string {
  return name.trim().replace(/\s+/g, " ").split(" ").map((w) =>
    w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(" ");
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
