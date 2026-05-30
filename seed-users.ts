import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const p = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function seed() {
  const imad = await p.user.upsert({
    where: { id: "user_imad" },
    create: { id: "user_imad", name: "Imad al-Lawati" },
    update: { name: "Imad al-Lawati" },
  });
  console.log("Created:", imad.name);

  const ali = await p.user.upsert({
    where: { id: "user_ali" },
    create: { id: "user_ali", name: "Ali al-Lawati" },
    update: { name: "Ali al-Lawati" },
  });
  console.log("Created:", ali.name);

  await p.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
