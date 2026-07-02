import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { parseDateInput, serializeConsult } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const consultSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  dateTime: z.string().optional(),
  chiefComplaint: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  vitals: z.record(z.string()).optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  labs: z.array(z.unknown()).optional(),
  prescriptions: z.array(z.unknown()).optional(),
  certificateRecommendation: z.string().optional(),
  certificateGenerated: z.boolean().optional(),
  referral: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function POST(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN", "DOCTOR"]);
  if (!session) return response;

  const parsed = consultSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid consult payload." }, { status: 400 });
  }

  const existing = parsed.data.id
    ? await prisma.consult.findUnique({ where: { id: parsed.data.id } })
    : null;
  const saved = existing
    ? await prisma.consult.update({
        where: { id: existing.id },
        data: dataFromConsult(parsed.data),
      })
    : await prisma.consult.create({
        data: {
          ...dataFromConsult(parsed.data),
          encounterNo: await nextEncounterNo(),
          patientId: parsed.data.patientId,
        },
      });

  await prisma.patient.update({
    where: { id: parsed.data.patientId },
    data: { lastVisit: serializeConsult(saved).dateTime },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "SAVE_CONSULT", target: saved.id },
  });

  return Response.json({ consult: serializeConsult(saved) });
}

function dataFromConsult(data: z.infer<typeof consultSchema>) {
  return {
    dateTime: parseDateInput(data.dateTime, new Date()),
    chiefComplaint: data.chiefComplaint ?? "",
    subjective: data.subjective ?? "",
    objective: data.objective ?? "",
    vitals: (data.vitals ?? {}) as Prisma.InputJsonValue,
    assessment: data.assessment ?? "",
    plan: data.plan ?? "",
    labs: (data.labs ?? []) as Prisma.InputJsonValue,
    prescriptions: (data.prescriptions ?? []) as Prisma.InputJsonValue,
    certificateRecommendation: data.certificateRecommendation ?? "",
    certificateGenerated: data.certificateGenerated ?? false,
    referral: data.referral ?? "",
    followUpDate: data.followUpDate ? parseDateInput(data.followUpDate) : null,
    saved: true,
  };
}

async function nextEncounterNo() {
  const count = await prisma.consult.count();
  return `ENC-2026-${String(count + 1).padStart(4, "0")}`;
}
