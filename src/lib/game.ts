const LEVEL_NAMES: Record<number, string> = {
  1: "Newcomer", 3: "Apprentice", 5: "Trainee", 8: "Grinder",
  12: "Warrior", 16: "Berserker", 20: "Beast", 25: "Titan",
  30: "Gladiator", 35: "Legend", 40: "Mythic", 45: "Demigod",
  50: "Immortal",
};

export function getLevelName(level: number): string {
  const thresholds = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => a - b);
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (level >= thresholds[i]) return LEVEL_NAMES[thresholds[i]];
  }
  return "Newcomer";
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
      return { level, currentLevelXP: totalXP - xpNeeded, nextLevelXP: nextXP - xpNeeded };
    }
    xpNeeded = nextXP;
    level++;
  }
}

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond" | "ruby";
  icon: string;
  category: string;
  hidden?: boolean;
}

interface ExerciseBest {
  exerciseName: string;
  bestE1RM: number;
  bestWeight: number;
  bestReps: number;
  bestVolume: number;
}

interface SetInputData {
  exerciseName: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface EvalProfile {
  bodyweight: number | null;
  exerciseBests: ExerciseBest[];
  totalSessions: number;
  totalPRs: number;
  lifetimeVolume: number;
  currentStreak: number;
  bestStreak: number;
  totalXP: number;
  level: number;
  uniqueExercises: number;
  totalSets: number;
  rpe10Sets: number;
  completedAllTemplatesIn4Days: boolean;
  completedAllTemplatesIn7Days: boolean;
  sessionsWith5plusPRs: number;
}

// ---- Bodyweight-ratio strength tiers per lift ----
type LiftName = "bench" | "squat" | "deadlift" | "ohp" | "row" | "pullup";

const LIFT_RATIOS: Record<LiftName, { bronze: number; silver: number; gold: number; diamond: number; ruby: number }> = {
  bench:   { bronze: 0.50, silver: 0.75, gold: 1.25, diamond: 1.75, ruby: 2.00 },
  squat:   { bronze: 0.75, silver: 1.25, gold: 1.50, diamond: 2.25, ruby: 2.75 },
  deadlift:{ bronze: 1.00, silver: 1.50, gold: 2.00, diamond: 2.50, ruby: 3.00 },
  ohp:     { bronze: 0.35, silver: 0.55, gold: 0.80, diamond: 1.10, ruby: 1.40 },
  row:     { bronze: 0.50, silver: 0.75, gold: 1.00, diamond: 1.50, ruby: 1.75 },
  pullup:  { bronze: 0.05, silver: 0.15, gold: 0.45, diamond: 0.75, ruby: 1.10 },
};

const LIFT_NAMES: Record<LiftName, string> = {
  bench: "Bench Press", squat: "Squat", deadlift: "Deadlift",
  ohp: "Overhead Press", row: "Barbell Row", pullup: "Weighted Pull-up",
};

const LIFT_KEYWORDS: Record<LiftName, string[]> = {
  bench: ["bench"],
  squat: ["squat"],
  deadlift: ["deadlift", "rdl", "romanian"],
  ohp: ["ohp", "overhead", "press", "arnold"],
  row: ["row"],
  pullup: ["pull", "chin"],
};

// ---- Achievement definitions ----
export function getAllAchievementDefs(): AchievementDef[] {
  const defs: AchievementDef[] = [];
  const tiers: { tier: AchievementDef["tier"]; label: string; emoji: string }[] = [
    { tier: "bronze", label: "First Steps", emoji: "🥉" },
    { tier: "silver", label: "Building Foundations", emoji: "🥈" },
    { tier: "gold", label: "Specialist", emoji: "🥇" },
    { tier: "diamond", label: "Master", emoji: "💎" },
    { tier: "ruby", label: "Immortal", emoji: "👑" },
  ];

  // Category 1: Per-lift strength tiers (6 lifts x 5 tiers = 30)
  for (const [lift, ratios] of Object.entries(LIFT_RATIOS)) {
    const l = lift as LiftName;
    for (const t of tiers) {
      const ratio = ratios[t.tier];
      defs.push({
        key: `strength_${l}_${t.tier}`,
        title: `${LIFT_NAMES[l]}: ${t.label}`,
        description: t.tier === "bronze"
          ? `Lift ${(ratio * 100).toFixed(0)}% of your bodyweight`
          : `${t.emoji} ${LIFT_NAMES[l]} ${t.label}`,
        tier: t.tier,
        icon: t.emoji,
        category: "strength",
      });
    }
  }

  // Category 2: Absolute plate milestones (7)
  const plates: { key: string; weight: number; title: string; liftPattern: string; tier: AchievementDef["tier"]; icon: string }[] = [
    { key: "plate_1", weight: 60, title: "1 Plate OHP (60kg)", liftPattern: "ohp", tier: "silver", icon: "🏋️" },
    { key: "plate_2", weight: 100, title: "2 Plate Bench (100kg)", liftPattern: "bench", tier: "gold", icon: "🏆" },
    { key: "plate_3", weight: 140, title: "3 Plate Squat (140kg)", liftPattern: "squat", tier: "diamond", icon: "💪" },
    { key: "plate_4", weight: 180, title: "4 Plate Deadlift (180kg)", liftPattern: "deadlift", tier: "diamond", icon: "🦍" },
    { key: "plate_5", weight: 220, title: "5 Plate Deadlift (220kg)", liftPattern: "deadlift", tier: "ruby", icon: "👑" },
    { key: "bodyweight_ohp", weight: -1, title: "Bodyweight OHP", liftPattern: "ohp", tier: "diamond", icon: "⭐" },
    { key: "pullup_20", weight: -1, title: "20 Pull-ups", liftPattern: "pullup", tier: "diamond", icon: "🦾" },
  ];
  for (const p of plates) {
    defs.push({
      key: p.key,
      title: p.title,
      description: p.weight > 0 ? `Lift ${p.weight}kg on ${LIFT_NAMES[p.liftPattern as LiftName]}` : p.title,
      tier: p.tier,
      icon: p.icon,
      category: "plates",
    });
  }

  // Category 3: Club badges (5)
  const clubs: { key: string; total: number; title: string; tier: AchievementDef["tier"]; icon: string }[] = [
    { key: "club_500", total: 227, title: "500 lb Club", tier: "bronze", icon: "🔩" },
    { key: "club_750", total: 340, title: "750 lb Club", tier: "silver", icon: "⚙️" },
    { key: "club_1000", total: 454, title: "1000 lb Club", tier: "gold", icon: "🏅" },
    { key: "club_1250", total: 567, title: "1250 lb Club", tier: "diamond", icon: "🎖️" },
    { key: "club_1500", total: 680, title: "1500 lb Club", tier: "ruby", icon: "👑" },
  ];
  for (const c of clubs) {
    defs.push({
      key: c.key,
      title: c.title,
      description: `Bench + Squat + Deadlift total ≥ ${c.total}kg`,
      tier: c.tier,
      icon: c.icon,
      category: "clubs",
    });
  }

  // Category 4: Consistency / streaks (7)
  const streaks: { key: string; days: number; title: string; tier: AchievementDef["tier"]; icon: string }[] = [
    { key: "streak_7", days: 7, title: "Momentum", tier: "bronze", icon: "🔥" },
    { key: "streak_14", days: 14, title: "Discipline", tier: "bronze", icon: "📅" },
    { key: "streak_30", days: 30, title: "Unstoppable", tier: "silver", icon: "⚡" },
    { key: "streak_60", days: 60, title: "Iron Will", tier: "gold", icon: "🛡️" },
    { key: "streak_100", days: 100, title: "Obsession", tier: "gold", icon: "🎯" },
    { key: "streak_200", days: 200, title: "Machine", tier: "diamond", icon: "🤖" },
    { key: "streak_365", days: 365, title: "Immortal Discipline", tier: "ruby", icon: "♾️" },
  ];
  for (const s of streaks) {
    defs.push({
      key: s.key,
      title: s.title,
      description: `${s.days}-day workout streak`,
      tier: s.tier,
      icon: s.icon,
      category: "consistency",
    });
  }

  // Category 5: Session count (6)
  const sessions: { key: string; count: number; title: string; tier: AchievementDef["tier"]; icon: string }[] = [
    { key: "sessions_1", count: 1, title: "First Rep", tier: "bronze", icon: "🏁" },
    { key: "sessions_25", count: 25, title: "Foundations", tier: "bronze", icon: "🧱" },
    { key: "sessions_100", count: 100, title: "Committed", tier: "silver", icon: "💍" },
    { key: "sessions_250", count: 250, title: "Relentless", tier: "gold", icon: "⚔️" },
    { key: "sessions_500", count: 500, title: "Lifer", tier: "diamond", icon: "💎" },
    { key: "sessions_1000", count: 1000, title: "Legacy", tier: "ruby", icon: "🌟" },
  ];
  for (const s of sessions) {
    defs.push({
      key: s.key,
      title: s.title,
      description: `Complete ${s.count} workout session${s.count > 1 ? "s" : ""}`,
      tier: s.tier,
      icon: s.icon,
      category: "consistency",
    });
  }

  // Category 6: Volume (6)
  const volumes: { key: string; kg: number; title: string; equiv: string; tier: AchievementDef["tier"]; icon: string }[] = [
    { key: "vol_100k", kg: 100_000, title: "Ton Up", equiv: "A loaded semi-truck", tier: "bronze", icon: "🚛" },
    { key: "vol_500k", kg: 500_000, title: "Kiloton", equiv: "A small ship", tier: "silver", icon: "🚢" },
    { key: "vol_1m", kg: 1_000_000, title: "Megaton", equiv: "The Eiffel Tower", tier: "gold", icon: "🗼" },
    { key: "vol_10m", kg: 10_000_000, title: "Titan", equiv: "10,000 cars", tier: "diamond", icon: "🏗️" },
    { key: "vol_50m", kg: 50_000_000, title: "Planet Mover", equiv: "An aircraft carrier", tier: "ruby", icon: "🌍" },
    { key: "vol_100m", kg: 100_000_000, title: "God of Iron", equiv: "Every person in NYC", tier: "ruby", icon: "🌌" },
  ];
  for (const v of volumes) {
    defs.push({
      key: v.key,
      title: v.title,
      description: `Lift ${(v.kg / 1000).toLocaleString()}k kg lifetime (${v.equiv})`,
      tier: v.tier,
      icon: v.icon,
      category: "volume",
    });
  }

  // Category 7: Exercise mastery (5)
  defs.push(
    { key: "explorer", title: "Explorer", description: "Perform 10 different exercises", tier: "bronze", icon: "🗺️", category: "mastery" },
    { key: "versatile", title: "Versatile", description: "Perform 25 different exercises", tier: "silver", icon: "🎨", category: "mastery" },
    { key: "atlas", title: "Atlas", description: "Perform 50 different exercises", tier: "gold", icon: "🌐", category: "mastery" },
    { key: "sets_500", title: "Century", description: "Log 500 total sets", tier: "bronze", icon: "💯", category: "mastery" },
    { key: "sets_2500", title: "Millennium", description: "Log 2,500 total sets", tier: "diamond", icon: "🔢", category: "mastery" },
  );

  // Category 8: XP / Level (5)
  defs.push(
    { key: "lvl_10", title: "Local Hero", description: "Reach Level 10", tier: "bronze", icon: "🌟", category: "xp" },
    { key: "lvl_20", title: "Regional Champion", description: "Reach Level 20", tier: "silver", icon: "🏅", category: "xp" },
    { key: "lvl_30", title: "National Icon", description: "Reach Level 30", tier: "gold", icon: "🎗️", category: "xp" },
    { key: "lvl_40", title: "World Class", description: "Reach Level 40", tier: "diamond", icon: "🌍", category: "xp" },
    { key: "lvl_50", title: "Immortal", description: "Reach Level 50", tier: "ruby", icon: "♾️", category: "xp" },
  );

  // Category 9: Hidden (4)
  defs.push(
    { key: "perfect_week", title: "Perfect Week", description: "Complete all 3 templates in 7 days", tier: "gold", icon: "🔄", category: "hidden", hidden: true },
    { key: "pr_spree", title: "PR Spree", description: "Hit 5+ PRs in a single session", tier: "silver", icon: "🎯", category: "hidden", hidden: true },
    { key: "grinder", title: "Grinder", description: "Log 50 sets at RPE 10", tier: "gold", icon: "💀", category: "hidden", hidden: true },
    { key: "dead_by_sunday", title: "Dead by Sunday", description: "Complete all 3 templates in 4 days", tier: "gold", icon: "🪦", category: "hidden", hidden: true },
  );

  return defs;
}

export function getOrCreateAllDefs(): AchievementDef[] {
  return getAllAchievementDefs();
}

export interface AchievementCheckResult {
  key: string;
  unlocked: boolean;
  progress: number;
  neededDescription: string;
}

export function checkAllAchievements(profile: EvalProfile): AchievementCheckResult[] {
  const allDefs = getAllAchievementDefs();
  const results: AchievementCheckResult[] = [];

  for (const def of allDefs) {
    results.push(checkSingleAchievement(def.key, profile));
  }

  return results;
}

function checkSingleAchievement(key: string, p: EvalProfile): AchievementCheckResult {
  const noResult = (desc: string) => ({ key, unlocked: true, progress: 100, neededDescription: desc });
  const progressResult = (prog: number, desc: string) => ({ key, unlocked: prog >= 100, progress: Math.min(100, prog), neededDescription: desc });

  // ---- Strength tiers ----
  const strengthMatch = key.match(/^strength_(bench|squat|deadlift|ohp|row|pullup)_(bronze|silver|gold|diamond|ruby)$/);
  if (strengthMatch) {
    const lift = strengthMatch[1] as LiftName;
    const tier = strengthMatch[2] as AchievementDef["tier"];
    const ratio = LIFT_RATIOS[lift][tier];
    const liftName = LIFT_NAMES[lift];

    if (!p.bodyweight) return progressResult(0, `Log your body weight first`);

    const best = getBestForLift(p.exerciseBests, lift);
    const bw = p.bodyweight;
    const targetWeight = Math.round(ratio * bw * 100) / 100;
    const currentRatio = best ? best.bestE1RM / bw : 0;
    const prog = ratio > 0 ? Math.min(100, Math.round((currentRatio / ratio) * 100)) : 100;

    if (lift === "pullup") {
      const current = best ? best.bestWeight + bw : 0;
      if (current >= ratio * bw + bw) return noResult(`${liftName}: Pull-up Mastery`);
      const pullupProg = Math.min(100, Math.round((current / (ratio * bw + bw)) * 100));
      return progressResult(pullupProg, `${Math.round(ratio * bw)}kg added at ${Math.round(bw)}kg BW`);
    }

    return progressResult(
      prog,
      `${Math.round(targetWeight)}kg on ${liftName} (${(ratio * 100).toFixed(0)}% BW)`
    );
  }

  // ---- Plate milestones ----
  if (key === "plate_1") return checkPlate(p, "ohp", 60, "60kg on Overhead Press");
  if (key === "plate_2") return checkPlate(p, "bench", 100, "100kg on Bench Press");
  if (key === "plate_3") return checkPlate(p, "squat", 140, "140kg on Squat");
  if (key === "plate_4") return checkPlate(p, "deadlift", 180, "180kg on Deadlift");
  if (key === "plate_5") return checkPlate(p, "deadlift", 220, "220kg on Deadlift");
  if (key === "bodyweight_ohp") {
    if (!p.bodyweight) return progressResult(0, "Log your body weight first");
    return checkPlate(p, "ohp", p.bodyweight, `${Math.round(p.bodyweight)}kg OHP (bodyweight)`);
  }
  if (key === "pullup_20") {
    const best = getBestForLift(p.exerciseBests, "pullup");
    const reps = best?.bestReps || 0;
    return progressResult(Math.min(100, (reps / 20) * 100), `${reps}/20 pull-ups`);
  }

  // ---- Clubs ----
  const clubMatch = key.match(/^club_(\d+)$/);
  if (clubMatch) {
    const target = parseInt(clubMatch[1]);
    const bench = getBestForLift(p.exerciseBests, "bench")?.bestE1RM || 0;
    const squat = getBestForLift(p.exerciseBests, "squat")?.bestE1RM || 0;
    const dead = getBestForLift(p.exerciseBests, "deadlift")?.bestE1RM || 0;
    const total = bench + squat + dead;
    return progressResult(
      Math.min(100, Math.round((total / target) * 100)),
      `${Math.round(total)}/${target}kg SBD total`
    );
  }

  // ---- Streaks ----
  const streakMatch = key.match(/^streak_(\d+)$/);
  if (streakMatch) {
    const target = parseInt(streakMatch[1]);
    return progressResult(
      Math.min(100, Math.round((p.bestStreak / target) * 100)),
      `${p.bestStreak}/${target} day streak`
    );
  }

  // ---- Sessions ----
  const sessionMatch = key.match(/^sessions_(\d+)$/);
  if (sessionMatch) {
    const target = parseInt(sessionMatch[1]);
    return progressResult(
      Math.min(100, Math.round((p.totalSessions / target) * 100)),
      `${p.totalSessions}/${target} sessions`
    );
  }

  // ---- Volume ----
  const volMatch = key.match(/^vol_(\d+)/);
  if (volMatch) {
    const target = parseInt(volMatch[1]);
    return progressResult(
      Math.min(100, Math.round((p.lifetimeVolume / target) * 100)),
      `${(p.lifetimeVolume / 1000).toFixed(0)}k/${(target / 1000).toFixed(0)}k kg`
    );
  }

  // ---- Mastery ----
  if (key === "explorer") return progressResult(Math.min(100, (p.uniqueExercises / 10) * 100), `${p.uniqueExercises}/10 exercises`);
  if (key === "versatile") return progressResult(Math.min(100, (p.uniqueExercises / 25) * 100), `${p.uniqueExercises}/25 exercises`);
  if (key === "atlas") return progressResult(Math.min(100, (p.uniqueExercises / 50) * 100), `${p.uniqueExercises}/50 exercises`);
  if (key === "sets_500") return progressResult(Math.min(100, (p.totalSets / 500) * 100), `${p.totalSets}/500 sets`);
  if (key === "sets_2500") return progressResult(Math.min(100, (p.totalSets / 2500) * 100), `${p.totalSets}/2500 sets`);

  // ---- XP/Level ----
  if (key === "lvl_10") return progressResult(Math.min(100, (p.level / 10) * 100), `Lv. ${p.level}/10`);
  if (key === "lvl_20") return progressResult(Math.min(100, (p.level / 20) * 100), `Lv. ${p.level}/20`);
  if (key === "lvl_30") return progressResult(Math.min(100, (p.level / 30) * 100), `Lv. ${p.level}/30`);
  if (key === "lvl_40") return progressResult(Math.min(100, (p.level / 40) * 100), `Lv. ${p.level}/40`);
  if (key === "lvl_50") return progressResult(Math.min(100, (p.level / 50) * 100), `Lv. ${p.level}/50`);

  // ---- Hidden ----
  if (key === "perfect_week") return noResult("All 3 templates in 7 days");
  if (key === "pr_spree") {
    return progressResult(
      p.sessionsWith5plusPRs > 0 ? 100 : 0,
      "Hit 5+ PRs in a single session"
    );
  }
  if (key === "grinder") return progressResult(Math.min(100, (p.rpe10Sets / 50) * 100), `${p.rpe10Sets}/50 RPE 10 sets`);
  if (key === "dead_by_sunday") return noResult("All 3 templates in 4 days");

  return { key, unlocked: false, progress: 0, neededDescription: "" };
}

function checkPlate(p: EvalProfile, lift: LiftName, weight: number, desc: string): AchievementCheckResult {
  const best = getBestForLift(p.exerciseBests, lift);
  const current = best?.bestE1RM || 0;
  return {
    key: "",
    unlocked: current >= weight,
    progress: Math.min(100, Math.round((current / weight) * 100)),
    neededDescription: desc,
  };
}

function getBestForLift(bests: ExerciseBest[], lift: LiftName): ExerciseBest | null {
  const keywords = LIFT_KEYWORDS[lift];
  let best: ExerciseBest | null = null;
  for (const b of bests) {
    const lower = b.exerciseName.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      if (!best || b.bestE1RM > best.bestE1RM) best = b;
    }
  }
  return best;
}

export function calculateSessionXP(
  sessionSets: SetInputData[],
  previousBests: ExerciseBest[]
): { xp: number; newRepPRs: number; newWeightPRs: number; volume: number } {
  let volume = 0;
  let newWeightPRs = 0;
  let newRepPRs = 0;

  for (const set of sessionSets) {
    if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
    const setVol = set.weight * set.reps;
    volume += setVol;

    const prev = previousBests.find((pb) =>
      pb.exerciseName.toLowerCase() === set.exerciseName.toLowerCase()
    );
    const e1rm = set.weight * (1 + set.reps / 30);

    if (prev) {
      if (e1rm > prev.bestE1RM) newWeightPRs++;
      // Rep PR: same weight as previous best or higher, but more reps
      else if (set.weight >= prev.bestWeight - 0.5 && set.reps > prev.bestReps) {
        newRepPRs++;
      }
    } else {
      newWeightPRs++;
    }
  }

  const baseXP = 25;
  const volumeXP = Math.floor(volume / 50);
  const prXP = (newWeightPRs + newRepPRs) * 30;
  const xp = baseXP + volumeXP + prXP;

  return { xp, newRepPRs, newWeightPRs, volume };
}

export const VOLUME_MILESTONES = [
  { kg: 50000, label: "A bulldozer (50,000kg)" },
  { kg: 100000, label: "A loaded semi-truck (100,000kg)" },
  { kg: 500000, label: "A small ship (500,000kg)" },
  { kg: 1000000, label: "The Eiffel Tower (1,000,000kg)" },
  { kg: 10000000, label: "10,000 cars (10M kg)" },
  { kg: 50000000, label: "An aircraft carrier (50M kg)" },
];

export function getIdentityTitle(profile: {
  totalSessions: number;
  bestStreak: number;
  level: number;
  achievementCount: number;
}): string {
  if (profile.totalSessions >= 500 && profile.achievementCount >= 30) return "Living Legend";
  if (profile.bestStreak >= 100) return "Iron Disciple";
  if (profile.achievementCount >= 20) return "Elite Athlete";
  if (profile.level >= 20) return "Beast";
  if (profile.achievementCount >= 10) return "Grinder";
  if (profile.totalSessions >= 50) return "Dedicated";
  if (profile.totalSessions >= 10) return "Trainee";
  return "Newcomer";
}
