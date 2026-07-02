import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pmhKeys = ["HTN", "DM", "Asthma", "CKD", "Dyslipidemia", "CAD", "Stroke", "TB", "Others"];
const familyKeys = ["HTN", "DM", "CAD", "Stroke", "Cancer"];

function tick(keys, enabled) {
  return Object.fromEntries(keys.map((key) => [key, enabled.includes(key)]));
}

async function main() {
  const doctorPassword = await bcrypt.hash("demo123", 12);
  const patientPassword = await bcrypt.hash("demo123", 12);

  await prisma.user.upsert({
    where: { email: "doctor@clinix.local" },
    update: {},
    create: {
      email: "doctor@clinix.local",
      passwordHash: doctorPassword,
      role: "DOCTOR",
      displayName: "Dr. Maria Reyes",
    },
  });

  const juanUser = await prisma.user.upsert({
    where: { email: "juan.patient@clinix.local" },
    update: {},
    create: {
      email: "juan.patient@clinix.local",
      passwordHash: patientPassword,
      role: "PATIENT",
      displayName: "Dela Cruz, Juan",
    },
  });

  const mariaUser = await prisma.user.upsert({
    where: { email: "maria.patient@clinix.local" },
    update: {},
    create: {
      email: "maria.patient@clinix.local",
      passwordHash: patientPassword,
      role: "PATIENT",
      displayName: "Santos, Maria",
    },
  });

  const juan = await prisma.patient.upsert({
    where: { patientNo: "PX-2026-0001" },
    update: {},
    create: {
      patientNo: "PX-2026-0001",
      userId: juanUser.id,
      fullName: "Dela Cruz, Juan",
      dob: new Date("1992-01-15"),
      sex: "M",
      civilStatus: "Married",
      contact: "0917 123 4567",
      address: "123 Mabini St., Brgy. San Jose, Dasmarinas, Cavite",
      occupation: "Driver",
      allergies: "Penicillin, shrimp",
      pmh: tick(pmhKeys, ["HTN", "DM"]),
      psh: "Appendectomy 2018",
      family: tick(familyKeys, ["HTN", "DM"]),
      smoking: "Former",
      alcohol: "Occasional",
      vaccination: "COVID x3, Flu 2026",
      weight: "72",
      height: "170",
      lastVisit: "Jul 1, 2026",
    },
  });

  await prisma.patient.upsert({
    where: { patientNo: "PX-2026-0002" },
    update: {},
    create: {
      patientNo: "PX-2026-0002",
      userId: mariaUser.id,
      fullName: "Santos, Maria",
      dob: new Date("1984-09-02"),
      sex: "F",
      civilStatus: "Single",
      contact: "0918 222 8899",
      address: "45 Rizal Ave., Imus, Cavite",
      occupation: "Teacher",
      allergies: "None known",
      pmh: tick(pmhKeys, ["Asthma"]),
      psh: "Cesarean section 2016",
      family: tick(familyKeys, ["HTN"]),
      smoking: "None",
      alcohol: "None",
      vaccination: "COVID x4",
      weight: "61",
      height: "158",
      lastVisit: "Jun 28, 2026",
    },
  });

  await prisma.consult.upsert({
    where: { encounterNo: "ENC-2026-0001" },
    update: {},
    create: {
      encounterNo: "ENC-2026-0001",
      patientId: juan.id,
      dateTime: new Date("2026-07-01T10:42:00"),
      chiefComplaint: "Cough x 5 days",
      subjective: "Productive cough with colds and nasal congestion. No fever. No shortness of breath.",
      objective: "Awake, alert, not in distress. Chest: occasional rhonchi, no wheezing. Heart: regular rhythm.",
      vitals: { bp: "120/80", hr: "88", rr: "20", temp: "36.7", spo2: "98", weight: "72" },
      assessment: "URTI",
      plan: "Increase fluids. Rest. Paracetamol q6 PRN fever. Return if symptoms persist or worsen.",
      labs: [
        {
          id: "LAB-SEED-CBC",
          type: "lab",
          name: "CBC",
          date: "Jul 1, 2026",
          fields: [
            { label: "WBC", value: "", unit: "x10^9/L", range: "4.5-11" },
            { label: "Hgb", value: "13.2", unit: "g/dL", range: "13-17" },
            { label: "Hct", value: "", unit: "%", range: "40-50" },
            { label: "Platelets", value: "", unit: "x10^9/L", range: "150-450" },
          ],
        },
      ],
      prescriptions: [
        {
          id: "RX-SEED-PARA",
          drug: "Paracetamol",
          dose: "500mg",
          frequency: "q6 PRN",
          duration: "3 days",
          sig: "Take for fever",
          quantity: "10 tablets",
          dateIssued: "Jul 1, 2026",
        },
      ],
      certificateRecommendation: "Fit to rest for 2 days.",
      certificateGenerated: true,
    },
  });

  await prisma.appointment.upsert({
    where: { id: "seed-follow-up-juan" },
    update: {},
    create: {
      id: "seed-follow-up-juan",
      patientId: juan.id,
      preferredDate: new Date("2026-07-03"),
      preferredTime: "09:30",
      reason: "Follow-up if cough persists",
      status: "Pending",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
