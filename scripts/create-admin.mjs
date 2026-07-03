import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const displayName = (process.env.ADMIN_NAME ?? "Clinix Admin").trim();

if (!email || !email.includes("@")) {
  console.error("Set ADMIN_EMAIL to a valid email address.");
  process.exitCode = 1;
} else if (password.length < 8) {
  console.error("Set ADMIN_PASSWORD to at least 8 characters.");
  process.exitCode = 1;
} else {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      displayName,
    },
    update: {
      passwordHash,
      role: "ADMIN",
      displayName,
    },
    select: {
      email: true,
      role: true,
      displayName: true,
    },
  });

  console.log(`Admin account ready: ${user.displayName} <${user.email}> (${user.role})`);
}

await prisma.$disconnect();
