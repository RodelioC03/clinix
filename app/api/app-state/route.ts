import { requireSession } from "@/lib/auth";
import { serializeAppointment, serializeConsult, serializePatient } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const settings = {
  darkMode: false,
  mfaEnabled: false,
  doctorName: "Dr. Maria Reyes",
  clinicName: "Clinix EMR",
  license: "PRC 123456",
};

export async function GET(request: Request) {
  const { session, response } = await requireSession(request);
  if (!session) return response;

  const wherePatient =
    session.user.role === "PATIENT"
      ? { id: session.user.patientId ?? "__none__" }
      : { archivedAt: null };

  const patients = await prisma.patient.findMany({
    where: wherePatient,
    include: {
      user: { select: { email: true } },
    },
    orderBy: { fullName: "asc" },
  });
  const patientIds = patients.map((patient) => patient.id);

  const consults = await prisma.consult.findMany({
    where: { patientId: { in: patientIds } },
    orderBy: { dateTime: "desc" },
  });

  const appointments = await prisma.appointment.findMany({
    where: { patientId: { in: patientIds } },
    orderBy: { preferredDate: "asc" },
  });

  return Response.json({
    patients: patients.map(serializePatient),
    consults: consults.map(serializeConsult),
    appointments: appointments.map(serializeAppointment),
    settings: {
      ...settings,
      mfaEnabled: session.user.mfaEnabled,
    },
  });
}
