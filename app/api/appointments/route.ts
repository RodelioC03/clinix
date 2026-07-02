import { z } from "zod";
import { requireRole, requireSession } from "@/lib/auth";
import { parseDateInput, serializeAppointment } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const requestSchema = z.object({
  preferredDate: z.string().min(1),
  preferredTime: z.string().optional(),
  reason: z.string().optional(),
});

const statusSchema = z.object({
  id: z.string(),
  status: z.enum(["Pending", "Scheduled", "Completed", "Cancelled"]),
});

export async function POST(request: Request) {
  const { session, response } = await requireSession(request);
  if (!session) return response;
  if (session.user.role !== "PATIENT" || !session.user.patientId) {
    return Response.json({ error: "Only patients can request appointments here." }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Preferred date is required." }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.patientId,
      preferredDate: parseDateInput(parsed.data.preferredDate),
      preferredTime: parsed.data.preferredTime ?? "",
      reason: parsed.data.reason ?? "",
      status: "Pending",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "REQUEST_APPOINTMENT", target: appointment.id },
  });

  return Response.json({ appointment: serializeAppointment(appointment) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN", "DOCTOR"]);
  if (!session) return response;

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid appointment status." }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE_APPOINTMENT", target: appointment.id },
  });

  return Response.json({ appointment: serializeAppointment(appointment) });
}
