import type { Appointment, Consult, Patient, User } from "@prisma/client";

type PatientWithUser = Patient & {
  user: Pick<User, "email"> | null;
};

export function serializePatient(patient: PatientWithUser) {
  return {
    id: patient.id,
    patientNo: patient.patientNo,
    accountEmail: patient.user?.email ?? "",
    fullName: patient.fullName,
    dob: toDateInput(patient.dob),
    sex: patient.sex,
    civilStatus: patient.civilStatus,
    contact: patient.contact,
    address: patient.address,
    occupation: patient.occupation,
    allergies: patient.allergies,
    pmh: patient.pmh,
    pmhOther: patient.pmhOther,
    psh: patient.psh,
    family: patient.family,
    smoking: patient.smoking,
    alcohol: patient.alcohol,
    vaccination: patient.vaccination,
    weight: patient.weight,
    height: patient.height,
    lastVisit: patient.lastVisit,
  };
}

export function serializeConsult(consult: Consult) {
  return {
    id: consult.id,
    encounterNo: consult.encounterNo,
    patientId: consult.patientId,
    dateTime: formatDateTime(consult.dateTime),
    chiefComplaint: consult.chiefComplaint,
    subjective: consult.subjective,
    objective: consult.objective,
    vitals: consult.vitals,
    assessment: consult.assessment,
    plan: consult.plan,
    labs: consult.labs,
    prescriptions: consult.prescriptions,
    certificateRecommendation: consult.certificateRecommendation,
    certificateGenerated: consult.certificateGenerated,
    referral: consult.referral,
    followUpDate: consult.followUpDate ? toDateInput(consult.followUpDate) : "",
    saved: consult.saved,
  };
}

export function serializeAppointment(appointment: Appointment) {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    preferredDate: toDateInput(appointment.preferredDate),
    preferredTime: appointment.preferredTime,
    reason: appointment.reason,
    status: appointment.status,
  };
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function parseDateInput(value: string | undefined, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}
