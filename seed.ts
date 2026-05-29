import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const templates = [
  {
    name: "Workout A — Bench + Glute Focus",
    exercises: [
      { exerciseName: "Barbell Bench Press", sets: 2, sortOrder: 0, notes: "2 x 6-10. Primary horizontal push" },
      { exerciseName: "Weighted Pull-ups (wide grip)", sets: 2, sortOrder: 1, notes: "2 x 6-10. Vertical pull" },
      { exerciseName: "Barbell Hip Thrust", sets: 2, sortOrder: 2, notes: "2 x 8-12. Full ROM, primary glute builder" },
      { exerciseName: "Seated Leg Curl", sets: 2, sortOrder: 3, notes: "2 x 10-15. Knee-flexion hamstring" },
      { exerciseName: "Skullcrushers (EZ bar)", sets: 2, sortOrder: 4, notes: "2 x 8-15. Long head tricep" },
      { exerciseName: "Barbell Curls", sets: 2, sortOrder: 5, notes: "2 x 8-12. Bicep" },
      { exerciseName: "Wrist Curls (palms up)", sets: 2, sortOrder: 6, notes: "2 x 15-20. Forearm flexors" },
      { exerciseName: "Hanging Leg Raises", sets: 2, sortOrder: 7, notes: "2 x 10-15. Core" },
    ],
  },
  {
    name: "Workout B — OHP + Hamstring Focus",
    exercises: [
      { exerciseName: "Standing Barbell OHP", sets: 2, sortOrder: 0, notes: "2 x 6-10. Primary vertical push" },
      { exerciseName: "Barbell Row (or DB Row)", sets: 2, sortOrder: 1, notes: "2 x 8-12. Horizontal pull" },
      { exerciseName: "Romanian Deadlift", sets: 2, sortOrder: 2, notes: "2 x 8-12. Hamstring + glute stretch" },
      { exerciseName: "Bulgarian Split Squats", sets: 2, sortOrder: 3, notes: "2 x 8-12. Glute-dominant single leg" },
      { exerciseName: "Dips (or Close-grip Bench)", sets: 2, sortOrder: 4, notes: "2 x 8-15. Tricep" },
      { exerciseName: "Hammer Curls", sets: 2, sortOrder: 5, notes: "2 x 8-12. Brachialis + brachioradialis" },
      { exerciseName: "Reverse Wrist Curls (palms down)", sets: 2, sortOrder: 6, notes: "2 x 15-20. Forearm extensors" },
      { exerciseName: "Lateral Raises", sets: 2, sortOrder: 7, notes: "2 x 12-20. Side delts" },
    ],
  },
  {
    name: "Workout C — Arnold Press + Squat",
    exercises: [
      { exerciseName: "Arnold Press (Dumbbell)", sets: 2, sortOrder: 0, notes: "2 x 8-12. Shoulder variety" },
      { exerciseName: "Pull-ups (neutral grip)", sets: 2, sortOrder: 1, notes: "2 x 6-10. Vertical pull" },
      { exerciseName: "Front Squat or Goblet Squat", sets: 2, sortOrder: 2, notes: "2 x 10-15. Quad-biased, deep ROM" },
      { exerciseName: "Chest-Supported Row (or Barbell Row)", sets: 2, sortOrder: 3, notes: "2 x 8-12. Horizontal pull" },
      { exerciseName: "Rope Tricep Pushdown", sets: 2, sortOrder: 4, notes: "2 x 10-15. Lateral head" },
      { exerciseName: "Concentration Curls", sets: 2, sortOrder: 5, notes: "2 x 10-15. Long head bicep" },
      { exerciseName: "Farmer's Walks", sets: 2, sortOrder: 6, notes: "2 x 40-60s. Grip, traps, forearms" },
      { exerciseName: "Plank", sets: 2, sortOrder: 7, notes: "2 x 45-60s. Core" },
    ],
  },
];

async function seed() {
  console.log("Updating workout templates...\n");

  for (const template of templates) {
    const existing = await prisma.workoutTemplate.findUnique({
      where: { name: template.name },
    });

    if (existing) {
      await prisma.workoutTemplate.update({
        where: { id: existing.id },
        data: {
          exercises: {
            deleteMany: {},
            create: template.exercises.map((ex) => ({
              exerciseName: ex.exerciseName,
              sets: ex.sets,
              sortOrder: ex.sortOrder,
              notes: ex.notes,
            })),
          },
        },
      });
      console.log(`Updated: ${template.name}`);
    } else {
      await prisma.workoutTemplate.create({
        data: {
          name: template.name,
          exercises: {
            create: template.exercises.map((ex) => ({
              exerciseName: ex.exerciseName,
              sets: ex.sets,
              sortOrder: ex.sortOrder,
              notes: ex.notes,
            })),
          },
        },
      });
      console.log(`Created: ${template.name}`);
    }
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
