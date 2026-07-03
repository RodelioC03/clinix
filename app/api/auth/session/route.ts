import { clearSessionCookie, getSession, withCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    return Response.json({ user: session?.user ?? null });
  } catch {
    return withCookie(Response.json({ user: null }), clearSessionCookie());
  }
}
