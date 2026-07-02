import { z } from "zod";
import { requireRole, requireSession } from "@/lib/auth";
import { parseDateInput, serializePatient } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const pmhKeys = ["HTN", "DM", "Asthma", "CKD", "Dyslipidemia", "CAD", "Stroke", "TB", "Others"];
const familyKeys = ["HTN", "DM", "CAD", "Stroke", "Cancer"];

const patientSchema = z.object({
  id: z.string().optional(),
  accountEmail: z.string().email().optional().or(z.literal("")),
  fullName: z.string().trim().min(2),
  dob: z.string().optional(),
  sex: z.enum(["M", "F"]),
  civilStatus: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  allergies: z.string().optional(),
  pmh: z.record(z.boolean()).optional(),
  pmhOther: z.string().optional(),
  psh: z.string().optional(),
  family: z.record(z.boolean()).optional(),
  smoking: z.string().optional(),
  alcohol: z.string().optional(),
  vaccination: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
});

const patientContactSchema = z.object({
  id: z.string(),
  contact: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(request: Request) {
  const { session, response } = await requireSession(request);
  if (!session) return response;

  const patients = await prisma.patient.findMany({
    where: session.user.role === "PATIENT" ? { id: session.user.patientId ?? "__none__" } : { archivedAt: null },
    include: { user: { select: { email: true } } },
    orderBy: { fullName: "asc" },
  });

  return Response.json({ patients: patients.map(serializePatient) });
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(request, ["ADMIN", "DOCTOR"]);
  if (!session) return response;

  const parsed = patientSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Patient name, DOB, and sex are required." }, { status: 400 });
  }

  const patientNo = await nextPatientNo();
  const patient = await prisma.patient.create({
    data: {
      patientNo,
      fullName: parsed.data.fullName,
      dob: parseDateInput(parsed.data.dob, new Date("1990-01-01")),
      sex: parsed.data.sex,
      civilStatus: parsed.data.civilStatus ?? "",
      contact: parsed.data.contact ?? "",
      address: parsed.data.address ?? "",
      occupation: parsed.data.occupation ?? "",
      allergies: parsed.data.allergies ?? "",
      pmh: parsed.data.pmh ?? emptyTicks(pmhKeys),
      pmhOther: parsed.data.pmhOther ?? "",
      psh: parsed.data.psh ?? "",
      family: parsed.data.family ?? emptyTicks(familyKeys),
      smoking: parsed.data.smoking ?? "None",
      alcohol: parsed.data.alcohol ?? "None",
      vaccination: parsed.data.vaccination ?? "",
      weight: parsed.data.weight ?? "",
      height: parsed.data.height ?? "",
    },
    include: { user: { select: { email: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE_PATIENT", target: patient.id },
  });

  return Response.json({ patient: serializePatient(patient) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireSession(request);
  if (!session) return response;

  const payload = await request.json().catch(() => null);

  if (session.user.role === "PATIENT") {
    const parsed = patientContactSchema.safeParse(payload);
    if (!parsed.success || parsed.data.id !== session.user.patientId) {
      return Response.json({ error: "Patients can only edit their own contact details." }, { status: 403 });
    }

    const patient = await prisma.patient.update({
      where: { id: parsed.data.id },
      data: {
        contact: parsed.data.contact ?? "",
        address: parsed.data.address ?? "",
      },
      include: { user: { select: { email: true } } },
    });

    return Response.json({ patient: serializePatient(patient) });
  }

  const parsed = patientSchema.extend({ id: z.string() }).safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid patient update." }, { status: 400 });
  }

  const patient = await prisma.patient.update({
    where: { id: parsed.data.id },
    data: {
      fullName: parsed.data.fullName,
      dob: parseDateInput(parsed.data.dob, new Date("1990-01-01")),
      sex: parsed.data.sex,
      civilStatus: parsed.data.civilStatus ?? "",
      contact: parsed.data.contact ?? "",
      address: parsed.data.address ?? "",
      occupation: parsed.data.occupation ?? "",
      allergies: parsed.data.allergies ?? "",
      pmh: parsed.data.pmh ?? emptyTicks(pmhKeys),
      pmhOther: parsed.data.pmhOther ?? "",
      psh: parsed.data.psh ?? "",
      family: parsed.data.family ?? emptyTicks(familyKeys),
      smoking: parsed.data.smoking ?? "None",
      alcohol: parsed.data.alcohol ?? "None",
      vaccination: parsed.data.vaccination ?? "",
      weight: parsed.data.weight ?? "",
      height: parsed.data.height ?? "",
    },
    include: { user: { select: { email: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE_PATIENT", target: patient.id },
  });

  return Response.json({ patient: serializePatient(patient) });
}

function emptyTicks(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

async function nextPatientNo() {
  const count = await prisma.patient.count();
  return `PX-2026-${String(count + 1).padStart(4, "0")}`;
}
