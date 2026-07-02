import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, withCookie } from "@/lib/auth";
import { parseDateInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const pmhKeys = ["HTN", "DM", "Asthma", "CKD", "Dyslipidemia", "CAD", "Stroke", "TB", "Others"];
const familyKeys = ["HTN", "DM", "CAD", "Stroke", "Cancer"];

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  dob: z.string().optional(),
  sex: z.enum(["M", "F"]).default("M"),
  contact: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
    return Response.json({ error: "Too many registration attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Name, valid email, DOB, contact, and an 8-character password are required." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const patientNo = await nextPatientNo();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "PATIENT",
      displayName: parsed.data.name,
      patient: {
        create: {
          patientNo,
          fullName: parsed.data.name,
          dob: parseDateInput(parsed.data.dob, new Date("1990-01-01")),
          sex: parsed.data.sex,
          contact: parsed.data.contact ?? "",
          pmh: emptyTicks(pmhKeys),
          family: emptyTicks(familyKeys),
        },
      },
    },
    include: {
      patient: {
        select: { id: true },
      },
    },
  });

  const { cookie } = await createSession(user.id);
  await prisma.auditLog.create({
    data: { userId: user.id, action: "REGISTER_PATIENT", target: user.email },
  });

  return withCookie(
    Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          mfaEnabled: user.mfaEnabled,
          patientId: user.patient?.id ?? null,
        },
      },
      { status: 201 },
    ),
    cookie,
  );
}

function emptyTicks(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

async function nextPatientNo() {
  const count = await prisma.patient.count();
  return `PX-2026-${String(count + 1).padStart(4, "0")}`;
}
