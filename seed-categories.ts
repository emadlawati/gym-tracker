import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const categories: { name: string; exercises: string[] }[] = [
  { name: "Chest", exercises: ["Dumbbell Bench Press", "Bench Press", "Smith Press"] },
  { name: "Shoulders", exercises: ["Dumbbell Press", "Smith Press", "Standing Military Press", "Rear Delt"] },
  { name: "Back", exercises: ["Pull Up", "Lat Pull Down", "Horizontal Row"] },
  { name: "Biceps", exercises: ["Hammer Curl", "Bicep Curl", "Reverse Curl"] },
  { name: "Triceps", exercises: ["Pushdown", "Tricep Pull"] },
  { name: "Abs", exercises: ["Hanging Raise", "Rope Abs"] },
  { name: "Legs 1", exercises: ["Squat", "Leg Press", "Leg Extension", "Leg Curl", "Hip Thrust", "Adductor"] },
  { name: "Legs 2", exercises: ["Squat", "Leg Press", "Hip Thrust", "Adductor", "Leg Curl", "Leg Extension"] },
];

async function seed() {
  console.log("Seeding exercise categories...\n");

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const category = await prisma.exerciseCategory.upsert({
      where: { name: cat.name },
      update: { sortOrder: i },
      create: { name: cat.name, sortOrder: i },
    });

    // Add any missing exercises without clobbering user-added ones.
    const existing = await prisma.catalogExercise.findMany({
      where: { categoryId: category.id },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

    for (let j = 0; j < cat.exercises.length; j++) {
      const name = cat.exercises[j];
      if (existingNames.has(name.toLowerCase())) continue;
      await prisma.catalogExercise.create({
        data: { categoryId: category.id, name, sortOrder: j },
      });
    }
    console.log(`${cat.name}: ${cat.exercises.length} exercises ensured`);
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
