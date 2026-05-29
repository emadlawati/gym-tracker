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
      { exerciseName: "Barbell Bench Press", sets: 3, sortOrder: 0, notes: "3 x 6-10" },
      { exerciseName: "Weighted Pull-ups (wide grip)", sets: 2, sortOrder: 1, notes: "2 x 6-10" },
      { exerciseName: "Barbell Hip Thrust", sets: 3, sortOrder: 2, notes: "3 x 8-12. Full ROM, deep stretch at bottom" },
      { exerciseName: "Seated Leg Curl", sets: 2, sortOrder: 3, notes: "2 x 10-15. Short head biceps femoris" },
      { exerciseName: "Skullcrushers (EZ bar)", sets: 2, sortOrder: 4, notes: "2 x 8-15. Long head tricep" },
      { exerciseName: "Barbell Curls", sets: 2, sortOrder: 5, notes: "2 x 8-12. Short head emphasis" },
      { exerciseName: "Wrist Curls (palms up)", sets: 2, sortOrder: 6, notes: "2 x 15-20. Forearm flexor mass" },
      { exerciseName: "Hanging Leg Raises", sets: 2, sortOrder: 7, notes: "2 x 10-15" },
    ],
  },
  {
    name: "Workout B — OHP + Hamstring Focus",
    exercises: [
      { exerciseName: "Standing Barbell OHP", sets: 3, sortOrder: 0, notes: "3 x 6-10" },
      { exerciseName: "Chin-ups (underhand)", sets: 2, sortOrder: 1, notes: "2 x 6-10" },
      { exerciseName: "Romanian Deadlift", sets: 3, sortOrder: 2, notes: "3 x 8-12. Long head hamstring + glute stretch" },
      { exerciseName: "Bulgarian Split Squats", sets: 2, sortOrder: 3, notes: "2 x 8-12. Forward lean, longer stance for glutes" },
      { exerciseName: "Dips (or Close-grip Bench)", sets: 2, sortOrder: 4, notes: "2 x 8-15. Tricep, different angle from A" },
      { exerciseName: "Hammer Curls", sets: 2, sortOrder: 5, notes: "2 x 8-12. Brachialis + brachioradialis" },
      { exerciseName: "Reverse Wrist Curls (palms down)", sets: 2, sortOrder: 6, notes: "2 x 15-20. Forearm extensor balance" },
      { exerciseName: "Banded Glute Abduction (side-lying)", sets: 2, sortOrder: 7, notes: "2 x 15-20. Glute medius isolation" },
    ],
  },
  {
    name: "Workout C — Arnold Press + Glute Pump",
    exercises: [
      { exerciseName: "Arnold Press (Dumbbell)", sets: 3, sortOrder: 0, notes: "3 x 8-12. Full ROM shoulder variation" },
      { exerciseName: "Pull-ups (neutral grip)", sets: 2, sortOrder: 1, notes: "2 x 6-10. Joint-friendly pull" },
      { exerciseName: "Front Squat or Goblet Squat", sets: 2, sortOrder: 2, notes: "2 x 10-15. Deep ROM, quad-biased" },
      { exerciseName: "KAS Glute Bridge (banded, 2s hold)", sets: 2, sortOrder: 3, notes: "2 x 12-20. Constant tension, pump finisher" },
      { exerciseName: "Rope Tricep Pushdown", sets: 2, sortOrder: 4, notes: "2 x 10-15. Lateral head pump" },
      { exerciseName: "Concentration Curls", sets: 2, sortOrder: 5, notes: "2 x 10-15. Long head, slow eccentric" },
      { exerciseName: "Farmer's Walks", sets: 2, sortOrder: 6, notes: "2 x 40-60s. Grip, traps, brachioradialis" },
      { exerciseName: "Plank", sets: 2, sortOrder: 7, notes: "2 x 45-60s. Anti-extension core" },
    ],
  },
];

async function seed() {
  console.log("Seeding workout templates...\n");

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

  console.log("\nDone. All templates seeded.");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
