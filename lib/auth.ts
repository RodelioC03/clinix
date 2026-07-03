import type { Role, User } from "@prisma/client";
import { prisma } from "./prisma";

const SESSION_COOKIE = "clinix_session";
const SESSION_DAYS = 7;

type AuthedUser = Pick<User, "id" | "email" | "role" | "displayName" | "mfaEnabled"> & {
  patientId: string | null;
};

export type SessionContext = {
  user: AuthedUser;
};

export async function createSession(userId: string) {
  const token = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return {
    token,
    cookie: serializeCookie(SESSION_COOKIE, token, expiresAt),
  };
}

export async function getSession(request: Request): Promise<SessionContext | null> {
  const token = readCookie(request.headers.get("cookie") ?? "", SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          patient: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  if (session.user.disabledAt) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      displayName: session.user.displayName,
      mfaEnabled: session.user.mfaEnabled,
      patientId: session.user.patient?.id ?? null,
    },
  };
}

export async function requireSession(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return {
      session: null,
      response: Response.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  return { session, response: null };
}

export async function requireRole(request: Request, roles: Role[]) {
  const { session, response } = await requireSession(request);
  if (!session) return { session: null, response };

  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      response: Response.json({ error: "You do not have access to this resource" }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function destroySession(request: Request) {
  const token = readCookie(request.headers.get("cookie") ?? "", SESSION_COOKIE);
  if (!token) return;
  const tokenHash = await hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export function withCookie(response: Response, cookie: string) {
  response.headers.append("Set-Cookie", cookie);
  return response;
}

function serializeCookie(name: string, value: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

function readCookie(header: string, name: string) {
  const cookies = header.split(";").map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
