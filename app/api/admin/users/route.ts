import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const staffSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "DOCTOR"]),
  mfaEnabled: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN"]);
  if (!session) return response;

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "DOCTOR"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      mfaEnabled: true,
      createdAt: true,
    },
  });

  return Response.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN"]);
  if (!session) return response;

  const parsed = staffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Name, valid email, staff role, and an 8-character password are required." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: parsed.data.role,
      displayName: parsed.data.displayName,
      mfaEnabled: parsed.data.mfaEnabled,
    },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      mfaEnabled: true,
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_STAFF_ACCOUNT",
      target: `${user.role}:${user.email}`,
    },
  });

  return Response.json(
    {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
