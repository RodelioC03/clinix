import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
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

const staffStatusSchema = z.object({
  id: z.string().min(1),
  disabled: z.boolean(),
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
      disabledAt: true,
      createdAt: true,
    },
  });

  return Response.json({
    users: users.map(serializeStaffUser),
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
      disabledAt: true,
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
      user: serializeStaffUser(user),
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN"]);
  if (!session) return response;

  const parsed = staffStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Staff account and status are required." }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: parsed.data.id, role: { in: ["ADMIN", "DOCTOR"] } },
    select: { id: true, email: true, role: true, disabledAt: true },
  });
  if (!target) {
    return Response.json({ error: "Staff account was not found." }, { status: 404 });
  }

  if (parsed.data.disabled && target.id === session.user.id) {
    return Response.json({ error: "You cannot deactivate your own admin account." }, { status: 400 });
  }

  if (parsed.data.disabled && target.role === "ADMIN") {
    const otherActiveAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        disabledAt: null,
        NOT: { id: target.id },
      },
    });
    if (otherActiveAdmins === 0) {
      return Response.json({ error: "At least one active admin account is required." }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: { disabledAt: parsed.data.disabled ? new Date() : null },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      mfaEnabled: true,
      disabledAt: true,
      createdAt: true,
    },
  });

  if (parsed.data.disabled) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: parsed.data.disabled ? "DEACTIVATE_STAFF_ACCOUNT" : "RESTORE_STAFF_ACCOUNT",
      target: `${user.role}:${user.email}`,
    },
  });

  return Response.json({ user: serializeStaffUser(user) });
}

type StaffUserRecord = {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  mfaEnabled: boolean;
  disabledAt: Date | null;
  createdAt: Date;
};

function serializeStaffUser(user: StaffUserRecord) {
  return {
    ...user,
    disabledAt: user.disabledAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
