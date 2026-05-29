const LEVEL_NAMES: Record<number, string> = {
  1: "Rookie",
  3: "Apprentice",
  5: "Trainee",
  8: "Grinder",
  12: "Warrior",
  16: "Berserker",
  20: "Beast",
  25: "Titan",
  30: "Gladiator",
  35: "Legend",
  40: "Mythic",
  45: "Demigod",
  50: "Immortal",
};

export function getLevelName(level: number): string {
  const thresholds = Object.keys(LEVEL_NAMES)
    .map(Number)
    .sort((a, b) => a - b);
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (level >= thresholds[i]) return LEVEL_NAMES[thresholds[i]];
  }
  return "Rookie";
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

export function getLevel(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number } {
  let level = 1;
  let xpNeeded = 0;

  while (true) {
    const nextXP = xpForLevel(level + 1);
    if (totalXP < nextXP) {
      return {
        level,
        currentLevelXP: totalXP - xpNeeded,
        nextLevelXP: nextXP - xpNeeded,
      };
    }
    xpNeeded = nextXP;
    level++;
  }
}

interface SetData {
  exerciseName: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface PreviousPRData {
  exerciseName: string;
  bestE1RM: number;
  bestVolume: number;
}

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  icon: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: "first_workout", title: "The First Rep", description: "Complete your first workout", tier: "bronze", icon: "🏁" },
  { key: "streak_7", title: "Momentum", description: "7-day workout streak", tier: "bronze", icon: "🔥" },
  { key: "streak_30", title: "Unstoppable", description: "30-day workout streak", tier: "silver", icon: "💪" },
  { key: "streak_100", title: "Iron Discipline", description: "100-day workout streak", tier: "gold", icon: "⚔️" },
  { key: "streak_365", title: "Unbreakable", description: "365-day workout streak", tier: "diamond", icon: "👑" },
  { key: "sessions_50", title: "Foundations", description: "Complete 50 sessions", tier: "bronze", icon: "🧱" },
  { key: "sessions_100", title: "Dedicated", description: "Complete 100 sessions", tier: "silver", icon: "🏋️" },
  { key: "sessions_500", title: "Relentless", description: "Complete 500 sessions", tier: "gold", icon: "🛡️" },
  { key: "sessions_1000", title: "Lifer", description: "Complete 1000 sessions", tier: "diamond", icon: "💎" },
  { key: "volume_100k", title: "Ton Up", description: "Lift 100,000kg lifetime", tier: "bronze", icon: "🚛" },
  { key: "volume_1m", title: "Megaton", description: "Lift 1,000,000kg lifetime", tier: "silver", icon: "🏗️" },
  { key: "volume_10m", title: "Gigaton", description: "Lift 10,000,000kg lifetime", tier: "gold", icon: "🌋" },
  { key: "volume_100m", title: "Titanomachy", description: "Lift 100,000,000kg lifetime", tier: "diamond", icon: "⭐" },
  { key: "prs_25", title: "Progress Seeker", description: "Hit 25 personal records", tier: "bronze", icon: "📈" },
  { key: "prs_100", title: "Record Breaker", description: "Hit 100 personal records", tier: "silver", icon: "🏆" },
  { key: "prs_500", title: "All-Time Great", description: "Hit 500 personal records", tier: "gold", icon: "🎖️" },
  { key: "prs_1000", title: "Perpetual Motion", description: "Hit 1000 personal records", tier: "diamond", icon: "🌟" },
  { key: "xp_5000", title: "Ascending", description: "Earn 5,000 total XP", tier: "bronze", icon: "⬆️" },
  { key: "xp_50000", title: "Legendary", description: "Earn 50,000 total XP", tier: "silver", icon: "⚡" },
  { key: "xp_500000", title: "Divine", description: "Earn 500,000 total XP", tier: "gold", icon: "🔱" },
  { key: "level_10", title: "Local Hero", description: "Reach level 10", tier: "bronze", icon: "🌟" },
  { key: "level_20", title: "Regional Champion", description: "Reach level 20", tier: "silver", icon: "🏅" },
  { key: "level_35", title: "National Icon", description: "Reach level 35", tier: "gold", icon: "🎗️" },
  { key: "level_50", title: "Immortal", description: "Reach level 50", tier: "diamond", icon: "♾️" },
];

export function getAchievementDefs() {
  return ACHIEVEMENT_DEFS;
}

export function checkAchievements(profile: {
  totalSessions: number;
  totalPRs: number;
  lifetimeVolume: number;
  currentStreak: number;
  bestStreak: number;
  currentXP: number;
  totalXP: number;
  level: number;
}): AchievementDef[] {
  const unlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    const met = evaluateAchievement(def.key, profile);
    if (met) unlocked.push(def);
  }

  return unlocked;
}

function evaluateAchievement(
  key: string,
  p: {
    totalSessions: number;
    totalPRs: number;
    lifetimeVolume: number;
    currentStreak: number;
    bestStreak: number;
    currentXP: number;
    totalXP: number;
    level: number;
  }
): boolean {
  switch (key) {
    case "first_workout": return p.totalSessions >= 1;
    case "streak_7": return p.bestStreak >= 7;
    case "streak_30": return p.bestStreak >= 30;
    case "streak_100": return p.bestStreak >= 100;
    case "streak_365": return p.bestStreak >= 365;
    case "sessions_50": return p.totalSessions >= 50;
    case "sessions_100": return p.totalSessions >= 100;
    case "sessions_500": return p.totalSessions >= 500;
    case "sessions_1000": return p.totalSessions >= 1000;
    case "volume_100k": return p.lifetimeVolume >= 100000;
    case "volume_1m": return p.lifetimeVolume >= 1000000;
    case "volume_10m": return p.lifetimeVolume >= 10000000;
    case "volume_100m": return p.lifetimeVolume >= 100000000;
    case "prs_25": return p.totalPRs >= 25;
    case "prs_100": return p.totalPRs >= 100;
    case "prs_500": return p.totalPRs >= 500;
    case "prs_1000": return p.totalPRs >= 1000;
    case "xp_5000": return p.totalXP >= 5000;
    case "xp_50000": return p.totalXP >= 50000;
    case "xp_500000": return p.totalXP >= 500000;
    case "level_10": return p.level >= 10;
    case "level_20": return p.level >= 20;
    case "level_35": return p.level >= 35;
    case "level_50": return p.level >= 50;
    default: return false;
  }
}

export function calculateSessionXP(
  sessionSets: SetData[],
  previousPRs: PreviousPRData[]
): { xp: number; newPRs: number; volume: number } {
  let volume = 0;
  let newPRs = 0;

  for (const set of sessionSets) {
    if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
    volume += set.weight * set.reps;

    const prevPR = previousPRs.find((p) => p.exerciseName === set.exerciseName);
    const e1rm = set.weight * (1 + set.reps / 30);
    const setVolume = set.weight * set.reps;

    if (prevPR) {
      if (e1rm > prevPR.bestE1RM) newPRs++;
      if (setVolume > prevPR.bestVolume) newPRs++;
    } else {
      newPRs++;
    }
  }

  const baseXP = 25;
  const volumeXP = Math.floor(volume / 50);
  const prXP = newPRs * 30;
  const xp = baseXP + volumeXP + prXP;

  return { xp, newPRs, volume };
}

export const VOLUME_MILESTONES = [
  { kg: 10000, label: "A car (10,000kg)" },
  { kg: 50000, label: "A bulldozer (50,000kg)" },
  { kg: 100000, label: "A blue whale's heart (100,000kg)" },
  { kg: 500000, label: "The Statue of Liberty (500,000kg)" },
  { kg: 1000000, label: "The Eiffel Tower (1,000,000kg)" },
  { kg: 10000000, label: "A loaded aircraft carrier (10M kg)" },
];
