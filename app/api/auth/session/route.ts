import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession(request);
  return Response.json({ user: session?.user ?? null });
}
