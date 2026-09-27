import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@ggnmobilecenter.com.np";
  const password = process.env.ADMIN_SEED_PASSWORD || "changeme123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      name: "GGN Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Seeded admin login: ${email} (change the password after first login)`);

  const existingFaqCount = await prisma.faq.count();
  if (existingFaqCount === 0) {
    await prisma.faq.createMany({
      data: [
        { question: "How long does mobile repair take?", answer: "Most common repairs such as display or battery replacement are completed the same day.", order: 1 },
        { question: "Do you repair iPhones?", answer: "Yes, we repair both Android and iPhone devices.", order: 2 },
        { question: "Do you provide CCTV installation?", answer: "Yes, we install analog and IP CCTV systems for homes, shops, schools and offices.", order: 3 },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
