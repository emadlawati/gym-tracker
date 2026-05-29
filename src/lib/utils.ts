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
  return formatDate(date);
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

export function getWarmupSets(workingWeight: number): { percentage: number; weight: number; reps: number }[] {
  if (workingWeight <= 0) return [];
  const sets: { percentage: number; weight: number; reps: number }[] = [];
  const percentages = [
    { pct: 50, reps: 8 },
    { pct: 60, reps: 5 },
    { pct: 70, reps: 4 },
    { pct: 80, reps: 2 },
    { pct: 90, reps: 1 },
  ];

  let lastWeight = 0;
  for (const { pct, reps } of percentages) {
    let w = Math.round((workingWeight * pct) / 100 / 2.5) * 2.5;
    if (w <= BARBELL) w = BARBELL;
    if (w > lastWeight && w <= workingWeight) {
      sets.push({ percentage: pct, weight: w, reps });
      lastWeight = w;
    }
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

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
