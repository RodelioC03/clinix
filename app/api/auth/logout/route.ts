import { clearSessionCookie, destroySession, withCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await destroySession(request);
  return withCookie(Response.json({ ok: true }), clearSessionCookie());
}
