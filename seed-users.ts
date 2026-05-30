import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const p = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function seed() {
  const imad = await p.user.upsert({
    where: { id: "user_imad" },
    create: { id: "user_imad", name: "Imad al-Lawati", title: "OEM" },
    update: { name: "Imad al-Lawati", title: "OEM" },
  });
  console.log("Updated:", imad.name, "-", imad.title);

  const ali = await p.user.upsert({
    where: { id: "user_ali" },
    create: { id: "user_ali", name: "Ali al-Lawati", title: "Rotating Engineering Legend" },
    update: { name: "Ali al-Lawati", title: "Rotating Engineering Legend" },
  });
  console.log("Updated:", ali.name, "-", ali.title);

  await p.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
