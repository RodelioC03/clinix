import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, withCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (!checkRateLimit(`login:${ip}`, 8, 60_000)) {
    return Response.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patient: {
        select: { id: true },
      },
    },
  });

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const { cookie } = await createSession(user.id);
  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", target: user.email },
  });

  return withCookie(
    Response.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        mfaEnabled: user.mfaEnabled,
        patientId: user.patient?.id ?? null,
      },
    }),
    cookie,
  );
}
