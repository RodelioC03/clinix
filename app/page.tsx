"use client";

import { useEffect, useState } from "react";

type Role = "DOCTOR" | "ADMIN" | "PATIENT";
type DoctorView = "Dashboard" | "Search" | "NewPatient" | "Chart" | "Consult" | "Today" | "FollowUps" | "Staff" | "Settings";
type PatientView = "Home" | "Appointments" | "Records" | "Prescriptions" | "Profile" | "Settings";
type Panel = "none" | "prescription" | "lab" | "imaging" | "certificate" | "referral" | "follow-up";
type Status = "Pending" | "Scheduled" | "Completed" | "Cancelled";

type PmhKey = "HTN" | "DM" | "Asthma" | "CKD" | "Dyslipidemia" | "CAD" | "Stroke" | "TB" | "Others";
type FamilyKey = "HTN" | "DM" | "CAD" | "Stroke" | "Cancer";

type Patient = {
  id: string;
  patientNo?: string;
  accountEmail: string;
  fullName: string;
  dob: string;
  sex: "M" | "F";
  civilStatus: string;
  contact: string;
  address: string;
  occupation: string;
  allergies: string;
  pmh: Record<PmhKey, boolean>;
  pmhOther: string;
  psh: string;
  family: Record<FamilyKey, boolean>;
  smoking: "None" | "Former" | "Current";
  alcohol: "None" | "Occasional" | "Regular";
  vaccination: string;
  weight: string;
  height: string;
  lastVisit: string;
};

type Vitals = {
  bp: string;
  hr: string;
  rr: string;
  temp: string;
  spo2: string;
  weight: string;
};

type LabOrder = {
  id: string;
  type: "lab" | "imaging";
  name: string;
  fields: Array<{ label: string; value: string; unit?: string; range?: string }>;
  date: string;
};

type Prescription = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  sig: string;
  quantity: string;
  dateIssued: string;
};

type Consult = {
  id: string;
  encounterNo?: string;
  patientId: string;
  dateTime: string;
  chiefComplaint: string;
  subjective: string;
  objective: string;
  vitals: Vitals;
  assessment: string;
  plan: string;
  labs: LabOrder[];
  prescriptions: Prescription[];
  certificateRecommendation: string;
  certificateGenerated: boolean;
  referral: string;
  followUpDate: string;
  saved: boolean;
};

type AppointmentRequest = {
  id: string;
  patientId: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  status: Status;
};

type Settings = {
  darkMode: boolean;
  mfaEnabled: boolean;
  doctorName: string;
  clinicName: string;
  license: string;
};

type AppState = {
  patients: Patient[];
  consults: Consult[];
  appointments: AppointmentRequest[];
  settings: Settings;
};

type Session = {
  id?: string;
  role: Role;
  email?: string;
  displayName?: string;
  patientId?: string;
};

type StaffUser = {
  id: string;
  email: string;
  role: "ADMIN" | "DOCTOR";
  displayName: string;
  mfaEnabled: boolean;
  createdAt: string;
};

const THEME_KEY = "clinix-emr-theme";

const pmhKeys: PmhKey[] = ["HTN", "DM", "Asthma", "CKD", "Dyslipidemia", "CAD", "Stroke", "TB", "Others"];
const familyKeys: FamilyKey[] = ["HTN", "DM", "CAD", "Stroke", "Cancer"];

const initialPatients: Patient[] = [
  {
    id: "PX-2026-0001",
    accountEmail: "juan.patient@clinix.local",
    fullName: "Dela Cruz, Juan",
    dob: "1992-01-15",
    sex: "M",
    civilStatus: "Married",
    contact: "0917 123 4567",
    address: "123 Mabini St., Brgy. San Jose, Dasmarinas, Cavite",
    occupation: "Driver",
    allergies: "Penicillin, shrimp",
    pmh: tickPmh(["HTN", "DM"]),
    pmhOther: "",
    psh: "Appendectomy 2018",
    family: tickFamily(["HTN", "DM"]),
    smoking: "Former",
    alcohol: "Occasional",
    vaccination: "COVID x3, Flu 2026",
    weight: "72",
    height: "170",
    lastVisit: "Jul 1, 2026",
  },
  {
    id: "PX-2026-0002",
    accountEmail: "maria.patient@clinix.local",
    fullName: "Santos, Maria",
    dob: "1984-09-02",
    sex: "F",
    civilStatus: "Single",
    contact: "0918 222 8899",
    address: "45 Rizal Ave., Imus, Cavite",
    occupation: "Teacher",
    allergies: "None known",
    pmh: tickPmh(["Asthma"]),
    pmhOther: "",
    psh: "Cesarean section 2016",
    family: tickFamily(["HTN"]),
    smoking: "None",
    alcohol: "None",
    vaccination: "COVID x4",
    weight: "61",
    height: "158",
    lastVisit: "Jun 28, 2026",
  },
];

const drugShortcuts: Prescription[] = [
  {
    id: "RX-TPL-PARA",
    drug: "Paracetamol",
    dose: "500mg",
    frequency: "q6 PRN",
    duration: "3 days",
    sig: "Take for fever",
    quantity: "10 tablets",
    dateIssued: "Jul 1, 2026",
  },
  {
    id: "RX-TPL-AMOX",
    drug: "Amoxicillin",
    dose: "500mg",
    frequency: "TID",
    duration: "7 days",
    sig: "Take after meals",
    quantity: "21 capsules",
    dateIssued: "Jul 1, 2026",
  },
  {
    id: "RX-TPL-LORA",
    drug: "Loratadine",
    dose: "10mg",
    frequency: "OD",
    duration: "7 days",
    sig: "Take once daily",
    quantity: "7 tablets",
    dateIssued: "Jul 1, 2026",
  },
];

const labTemplates: Record<string, LabOrder> = {
  CBC: {
    id: "LAB-TPL-CBC",
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
  HbA1c: {
    id: "LAB-TPL-HBA1C",
    type: "lab",
    name: "HbA1c",
    date: "Jul 1, 2026",
    fields: [{ label: "HbA1c", value: "6.9", unit: "%", range: "<5.7" }],
  },
  CMP: {
    id: "LAB-TPL-CMP",
    type: "lab",
    name: "CMP",
    date: "Jul 1, 2026",
    fields: [
      { label: "Creatinine", value: "", unit: "mg/dL", range: "0.6-1.2" },
      { label: "ALT", value: "", unit: "U/L", range: "7-56" },
      { label: "AST", value: "", unit: "U/L", range: "10-40" },
      { label: "Sodium", value: "", unit: "mmol/L", range: "135-145" },
    ],
  },
  Lipid: {
    id: "LAB-TPL-LIPID",
    type: "lab",
    name: "Lipid",
    date: "Jul 1, 2026",
    fields: [
      { label: "Total Chol", value: "", unit: "mg/dL", range: "<200" },
      { label: "LDL", value: "", unit: "mg/dL", range: "<100" },
      { label: "HDL", value: "", unit: "mg/dL", range: ">40" },
      { label: "Triglycerides", value: "", unit: "mg/dL", range: "<150" },
    ],
  },
  CXR: {
    id: "IMG-TPL-CXR",
    type: "imaging",
    name: "CXR",
    date: "Jul 1, 2026",
    fields: [{ label: "Finding", value: "No active infiltrates" }],
  },
  ECG: {
    id: "IMG-TPL-ECG",
    type: "imaging",
    name: "ECG",
    date: "Jul 1, 2026",
    fields: [{ label: "Finding", value: "Normal sinus rhythm" }],
  },
  UTZ: {
    id: "IMG-TPL-UTZ",
    type: "imaging",
    name: "UTZ",
    date: "Jul 1, 2026",
    fields: [{ label: "Finding", value: "" }],
  },
};

const initialConsult: Consult = {
  id: "ENC-2026-0001",
  patientId: "PX-2026-0001",
  dateTime: "Jul 1, 2026 10:42 AM",
  chiefComplaint: "Cough x 5 days",
  subjective: "Productive cough with colds and nasal congestion. No fever. No shortness of breath.",
  objective: "Awake, alert, not in distress. Chest: occasional rhonchi, no wheezing. Heart: regular rhythm.",
  vitals: { bp: "120/80", hr: "88", rr: "20", temp: "36.7", spo2: "98", weight: "72" },
  assessment: "URTI",
  plan: "Increase fluids. Rest. Paracetamol q6 PRN fever. Return if symptoms persist or worsen.",
  labs: [cloneOrder(labTemplates.CBC)],
  prescriptions: [cloneRx(drugShortcuts[0])],
  certificateRecommendation: "Fit to rest for 2 days.",
  certificateGenerated: false,
  referral: "",
  followUpDate: "",
  saved: true,
};

const initialState: AppState = {
  patients: initialPatients,
  consults: [initialConsult],
  appointments: [
    {
      id: "APT-001",
      patientId: "PX-2026-0001",
      preferredDate: "2026-07-03",
      preferredTime: "09:30",
      reason: "Follow-up if cough persists",
      status: "Pending",
    },
  ],
  settings: {
    darkMode: false,
    mfaEnabled: false,
    doctorName: "Dr. Maria Reyes",
    clinicName: "Clinix EMR",
    license: "PRC 123456",
  },
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const [session, setSession] = useState<Session | null>(null);
  const [doctorView, setDoctorView] = useState<DoctorView>("Dashboard");
  const [patientView, setPatientView] = useState<PatientView>("Home");
  const [activePatientId, setActivePatientId] = useState(initialPatients[0].id);
  const [draft, setDraft] = useState<Consult>(() => newConsult(initialPatients[0].id));
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<Panel>("none");
  const [notice, setNotice] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      queueMicrotask(() => {
        setState((current) => ({
          ...current,
          settings: { ...current.settings, darkMode: savedTheme === "dark" },
        }));
      });
    }
    void (async () => {
      try {
        const payload = await apiJson<{ user: ApiUser | null }>("/api/auth/session");
        if (!payload.user) return;
        const nextSession = sessionFromUser(payload.user);
        setSession(nextSession);
        const appState = await apiJson<AppState>("/api/app-state");
        const firstPatientId = appState.patients[0]?.id ?? initialPatients[0].id;
        setState((current) => ({
          ...appState,
          settings: {
            ...appState.settings,
            darkMode: current.settings.darkMode,
          },
        }));
        setActivePatientId(firstPatientId);
        setDraft(newConsult(firstPatientId));
      } catch {
        setNotice("Database auth is not ready. Check DATABASE_URL and run Prisma migration/seed.");
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, state.settings.darkMode ? "dark" : "light");
    document.documentElement.dataset.theme = state.settings.darkMode ? "dark" : "light";
  }, [state.settings.darkMode]);

  const activePatient = state.patients.find((patient) => patient.id === activePatientId) ?? state.patients[0];
  const currentUserPatient = state.patients.find((patient) => patient.id === session?.patientId) ?? state.patients[0];
  const filteredPatients = state.patients.filter((patient) =>
    [patient.fullName, patient.patientNo ?? patient.id, patient.contact].some((value) => value.toLowerCase().includes(query.toLowerCase())),
  );
  const pendingFollowUps = state.appointments.filter((item) => item.status === "Pending");

  async function loadAppState(nextSession = session) {
    if (!nextSession) return;
    const payload = await apiJson<AppState>("/api/app-state");
    const firstPatientId = payload.patients[0]?.id ?? initialPatients[0].id;
    setState((current) => ({
      ...payload,
      settings: {
        ...payload.settings,
        darkMode: current.settings.darkMode,
      },
    }));
    setActivePatientId((current) => payload.patients.some((patient) => patient.id === current) ? current : firstPatientId);
    setDraft((current) => payload.patients.some((patient) => patient.id === current.patientId) ? current : newConsult(firstPatientId));
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const payload = await apiJson<{ user: ApiUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const nextSession = sessionFromUser(payload.user);
      setSession(nextSession);
      setDoctorView("Dashboard");
      setPatientView("Home");
      await loadAppState(nextSession);
      setNotice(nextSession.role === "PATIENT" ? "Patient portal opened securely." : "Clinic workspace opened securely.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsBusy(false);
    }
  }

  async function registerPatient(formData: FormData) {
    const fullName = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    if (!fullName || !email || password.length < 8) {
      setNotice("Name, email, and an 8-character password are required.");
      return;
    }

    setIsBusy(true);
    try {
      const payload = await apiJson<{ user: ApiUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          dob: String(formData.get("dob") ?? "1990-01-01"),
          sex: String(formData.get("sex") ?? "M"),
          contact: String(formData.get("contact") ?? ""),
        }),
      });
      const nextSession = sessionFromUser(payload.user);
      setSession(nextSession);
      setRegisterOpen(false);
      await loadAppState(nextSession);
      setNotice("Patient account created with PATIENT role.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create patient account.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createPatient(formData: FormData) {
    const fullName = String(formData.get("fullName") ?? "").trim();
    if (!fullName) {
      setNotice("Patient name is needed before opening a chart.");
      return;
    }

    try {
      const payload = await apiJson<{ patient: Patient }>("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          accountEmail: String(formData.get("email") ?? "").trim(),
          fullName,
          dob: String(formData.get("dob") ?? "1990-01-01"),
          sex: String(formData.get("sex") ?? "M"),
          civilStatus: String(formData.get("civilStatus") ?? ""),
          contact: String(formData.get("contact") ?? ""),
          address: String(formData.get("address") ?? ""),
          occupation: String(formData.get("occupation") ?? ""),
          allergies: String(formData.get("allergies") ?? ""),
          pmh: tickPmh([]),
          family: tickFamily([]),
          weight: String(formData.get("weight") ?? ""),
          height: String(formData.get("height") ?? ""),
        }),
      });
      setState((current) => ({ ...current, patients: [...current.patients, payload.patient] }));
      setActivePatientId(payload.patient.id);
      setDraft(newConsult(payload.patient.id));
      setDoctorView("Chart");
      setNotice("New patient created. Chart is ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create patient.");
    }
  }

  function openPatient(patientId: string, target: DoctorView = "Chart") {
    setActivePatientId(patientId);
    setDraft(newConsult(patientId));
    setDoctorView(target);
    setPanel("none");
  }

  function updatePatient(patch: Partial<Patient>) {
    if (!activePatient) return;
    const nextPatient = { ...activePatient, ...patch };
    setState((current) => ({
      ...current,
      patients: current.patients.map((patient) => (patient.id === activePatient.id ? nextPatient : patient)),
    }));
    void apiJson<{ patient: Patient }>("/api/patients", {
      method: "PATCH",
      body: JSON.stringify(nextPatient),
    }).catch((error) => setNotice(error instanceof Error ? error.message : "Unable to save patient changes."));
  }

  function updatePatientById(patientId: string, patch: Partial<Patient>) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;
    const nextPatient = { ...patient, ...patch };
    setState((current) => ({
      ...current,
      patients: current.patients.map((item) => (item.id === patientId ? nextPatient : item)),
    }));
    void apiJson<{ patient: Patient }>("/api/patients", {
      method: "PATCH",
      body: JSON.stringify(nextPatient),
    }).catch((error) => setNotice(error instanceof Error ? error.message : "Unable to save profile changes."));
  }

  function updateDraft(patch: Partial<Consult>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function saveAll() {
    const saved = { ...draft, saved: true };
    try {
      const payload = await apiJson<{ consult: Consult }>("/api/consults", {
        method: "POST",
        body: JSON.stringify(saved),
      });
      setState((current) => ({
        ...current,
        consults: upsertConsult(current.consults, payload.consult),
        patients: current.patients.map((patient) =>
          patient.id === payload.consult.patientId ? { ...patient, lastVisit: payload.consult.dateTime } : patient,
        ),
      }));
      setDraft(payload.consult);
      setNotice("SOAP, labs, prescriptions, and certificate saved together.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save consult.");
    }
  }

  function addOrder(name: string) {
    const template = labTemplates[name] ?? labTemplates.CBC;
    setDraft((current) => ({ ...current, labs: [...current.labs, cloneOrder(template)] }));
    setNotice(`${template.name} added.`);
  }

  function addPrescription(template: Prescription) {
    setDraft((current) => ({ ...current, prescriptions: [...current.prescriptions, cloneRx(template)] }));
    setNotice(`${template.drug} added.`);
  }

  async function requestAppointment(formData: FormData) {
    if (!session?.patientId) return;
    try {
      const payload = await apiJson<{ appointment: AppointmentRequest }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          preferredDate: String(formData.get("date") ?? ""),
          preferredTime: String(formData.get("time") ?? ""),
          reason: String(formData.get("reason") ?? ""),
        }),
      });
      setState((current) => ({ ...current, appointments: [payload.appointment, ...current.appointments] }));
      setNotice("Appointment request sent to the doctor.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to request appointment.");
    }
  }

  async function updateAppointment(id: string, status: Status) {
    setState((current) => ({
      ...current,
      appointments: current.appointments.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
    try {
      await apiJson<{ appointment: AppointmentRequest }>("/api/appointments", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update appointment.");
      await loadAppState();
    }
  }

  async function signOut() {
    await apiJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setSession(null);
    setDoctorView("Dashboard");
    setPatientView("Home");
    setNotice("");
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="brand-line"><span className="brand-icon">C</span><strong>Clinix EMR</strong></div>
          <h1>Solo clinic records without the drag.</h1>
          <p>Role-aware login keeps doctors fast and patients separated.</p>
          <form onSubmit={login} className="auth-form">
            <label>Email or username<input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /></label>
            <label>Password<div className="password-row"><input type={passwordVisible ? "text" : "password"} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? "Hide" : "Show"}</button></div></label>
            <div className="remember-row"><label><input type="checkbox" /> Remember me</label><button type="button" onClick={() => setNotice("A reset link would be emailed in production.")}>Forgot password?</button></div>
            <button className="primary-button" disabled={isBusy} type="submit">{isBusy ? "Signing in..." : "Sign in"}</button>
          </form>
          <div className="auth-hints">
            <button onClick={() => setRegisterOpen(!registerOpen)}>Register patient</button>
          </div>
          {registerOpen && (
            <form action={registerPatient} className="register-grid">
              <input name="name" placeholder="Patient name" />
              <input name="email" placeholder="Email" />
              <input name="password" type="password" placeholder="Password" />
              <input name="dob" type="date" defaultValue="1990-01-01" />
              <select name="sex" defaultValue="M"><option>M</option><option>F</option></select>
              <input name="contact" placeholder="Contact" />
              <button className="secondary-button" disabled={isBusy} type="submit">{isBusy ? "Creating..." : "Create patient account"}</button>
            </form>
          )}
          {notice && <p className="notice">{notice}</p>}
        </section>
      </main>
    );
  }

  if (session.role === "PATIENT") {
    return (
      <Shell
        brand={state.settings.clinicName}
        darkMode={state.settings.darkMode}
        nav={["Home", "Appointments", "Records", "Prescriptions", "Profile", "Settings"]}
        active={patientView}
        setActive={(view) => setPatientView(view as PatientView)}
        onSignOut={signOut}
        toggleDark={() => setState((current) => ({ ...current, settings: { ...current.settings, darkMode: !current.settings.darkMode } }))}
      >
        {notice && <Notice text={notice} onClose={() => setNotice("")} />}
        {patientView === "Home" && (
          <PatientHome
            patient={currentUserPatient}
            appointments={state.appointments.filter((item) => item.patientId === currentUserPatient.id)}
            setView={setPatientView}
          />
        )}
        {patientView === "Appointments" && (
          <PatientAppointments
            appointments={state.appointments.filter((item) => item.patientId === currentUserPatient.id)}
            requestAppointment={requestAppointment}
          />
        )}
        {patientView === "Records" && (
          <PatientRecords consults={state.consults.filter((item) => item.patientId === currentUserPatient.id)} />
        )}
        {patientView === "Prescriptions" && (
          <PatientPrescriptions consults={state.consults.filter((item) => item.patientId === currentUserPatient.id)} />
        )}
        {patientView === "Profile" && (
          <PatientProfile patient={currentUserPatient} update={(patch) => updatePatientById(currentUserPatient.id, patch)} />
        )}
        {patientView === "Settings" && (
          <section className="page-stack"><PageTitle title="Patient Settings" detail="Password and notification preferences are placeholders for the production backend." /><SimpleCard title="Account security"><button className="secondary-button" onClick={() => setNotice("Password change would be handled by a protected backend endpoint.")}>Change password</button></SimpleCard></section>
        )}
      </Shell>
    );
  }

  return (
    <Shell
      brand={state.settings.clinicName}
      darkMode={state.settings.darkMode}
      nav={session.role === "ADMIN" ? ["Dashboard", "Search", "NewPatient", "Chart", "Consult", "Today", "FollowUps", "Staff", "Settings"] : ["Dashboard", "Search", "NewPatient", "Chart", "Consult", "Today", "FollowUps", "Settings"]}
      active={doctorView}
      setActive={(view) => setDoctorView(view as DoctorView)}
      onSignOut={signOut}
      toggleDark={() => setState((current) => ({ ...current, settings: { ...current.settings, darkMode: !current.settings.darkMode } }))}
    >
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      {doctorView === "Dashboard" && (
        <DoctorDashboard pendingCount={pendingFollowUps.length} setView={setDoctorView} startNew={() => activePatient ? openPatient(activePatient.id, "Consult") : setDoctorView("NewPatient")} />
      )}
      {doctorView === "Search" && (
        <PatientSearch query={query} setQuery={setQuery} patients={filteredPatients} openPatient={openPatient} />
      )}
      {doctorView === "NewPatient" && (
        <NewPatientForm createPatient={createPatient} />
      )}
      {doctorView === "Chart" && (
        activePatient ? <ChartView patient={activePatient} updatePatient={updatePatient} startConsult={() => setDoctorView("Consult")} /> : <EmptyPatientState setView={setDoctorView} />
      )}
      {doctorView === "Consult" && (
        activePatient ? (
          <ConsultView
            addOrder={addOrder}
            addPrescription={addPrescription}
            draft={draft}
            panel={panel}
            patient={activePatient}
            saveAll={saveAll}
            setPanel={setPanel}
            updateDraft={updateDraft}
          />
        ) : <EmptyPatientState setView={setDoctorView} />
      )}
      {doctorView === "Today" && (
        <TodayConsults consults={state.consults} patients={state.patients} open={(consult) => { setDraft(consult); setActivePatientId(consult.patientId); setDoctorView("Consult"); }} />
      )}
      {doctorView === "FollowUps" && (
        <FollowUps appointments={state.appointments} patients={state.patients} updateAppointment={updateAppointment} />
      )}
      {doctorView === "Staff" && session.role === "ADMIN" && (
        <StaffAccounts onNotice={setNotice} />
      )}
      {doctorView === "Settings" && (
        <DoctorSettings
          settings={state.settings}
          update={(patch) => setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))}
        />
      )}
    </Shell>
  );
}

function Shell({
  active,
  brand,
  children,
  darkMode,
  nav,
  onSignOut,
  setActive,
  toggleDark,
}: {
  active: string;
  brand: string;
  children: React.ReactNode;
  darkMode: boolean;
  nav: string[];
  onSignOut: () => void;
  setActive: (view: string) => void;
  toggleDark: () => void;
}) {
  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-line"><span className="brand-icon">C</span><strong>{brand}</strong></div>
        <nav>{nav.map((item) => <button className={item === active ? "active" : ""} key={item} onClick={() => setActive(item)}><span>{formatLabel(item)[0]}</span>{formatLabel(item)}</button>)}</nav>
      </aside>
      <section className="app-main">
        <header className="app-header">
          <div><strong>{active}</strong><span>Solo clinic mode</span></div>
          <div className="header-actions"><button onClick={toggleDark}>{darkMode ? "Light" : "Dark"}</button><button onClick={onSignOut}>Sign out</button></div>
        </header>
        <div className="app-content">{children}</div>
      </section>
    </main>
  );
}

function DoctorDashboard({ pendingCount, setView, startNew }: { pendingCount: number; setView: (view: DoctorView) => void; startNew: () => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Doctor Dashboard" detail="Quick actions only. No analytics, no chart clutter." action={<button className="primary-button" onClick={startNew}>New consult</button>} />
      <section className="quick-grid">
        <button onClick={() => setView("Search")}><strong>Search patient</strong><span>Name, ID, contact</span></button>
        <button onClick={() => setView("NewPatient")}><strong>New patient</strong><span>Add essential demographics</span></button>
        <button onClick={() => setView("Today")}><strong>Today&apos;s consults</strong><span>Open saved encounters</span></button>
        <button onClick={() => setView("FollowUps")}><strong>Pending follow-ups</strong><span>{pendingCount} requests waiting</span></button>
      </section>
    </section>
  );
}

function EmptyPatientState({ setView }: { setView: (view: DoctorView) => void }) {
  return (
    <section className="page-stack">
      <PageTitle
        title="No Patient Selected"
        detail="Create the first patient chart before opening a chart or consultation."
        action={<button className="primary-button" onClick={() => setView("NewPatient")}>New patient</button>}
      />
      <p className="empty-state">No patient charts are available yet.</p>
    </section>
  );
}

function PatientSearch({ openPatient, patients, query, setQuery }: { openPatient: (id: string, view?: DoctorView) => void; patients: Patient[]; query: string; setQuery: (value: string) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Patient Search" detail="Search bar only. One click opens the chart." />
      <input className="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, patient ID, or contact..." />
      <section className="result-list">
        {patients.map((patient) => (
          <button key={patient.id} onClick={() => openPatient(patient.id)}>
            <strong>{patient.fullName}</strong>
            <span className="mono">{patient.patientNo ?? patient.id}</span>
            <span>{age(patient.dob)}/{patient.sex}</span>
            <span>Last consult: {patient.lastVisit}</span>
          </button>
        ))}
      </section>
    </section>
  );
}

function NewPatientForm({ createPatient }: { createPatient: (formData: FormData) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="New Patient" detail="Essential demographics only. Clinical profile can be completed from the chart." />
      <form action={createPatient} className="card form-card">
        <div className="form-grid">
          <label>Full name<input name="fullName" placeholder="Family name, Given name" /></label>
          <label>DOB<input name="dob" type="date" defaultValue="1990-01-01" /></label>
          <label>Sex<select name="sex" defaultValue="M"><option>M</option><option>F</option></select></label>
          <label>Civil status<input name="civilStatus" placeholder="Single, married..." /></label>
          <label>Contact<input name="contact" placeholder="Mobile number" /></label>
          <label>Email<input name="email" placeholder="Patient portal email" /></label>
          <label>Occupation<input name="occupation" /></label>
          <label>Weight<input name="weight" placeholder="kg" /></label>
          <label>Height<input name="height" placeholder="cm" /></label>
          <label className="span-2">Address<input name="address" /></label>
          <label className="span-2">Allergies<input name="allergies" placeholder="Free text, e.g. Penicillin, shrimp" /></label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit">Create chart</button>
        </div>
      </form>
    </section>
  );
}

function ChartView({ patient, startConsult, updatePatient }: { patient: Patient; startConsult: () => void; updatePatient: (patch: Partial<Patient>) => void }) {
  const bmi = calculateBmi(patient.weight, patient.height);
  return (
    <section className="page-stack">
      <StickyPatientHeader patient={patient} />
      <div className="two-column">
        <SimpleCard title="Demographics">
          <div className="form-grid">
            <label>Full name<input value={patient.fullName} onChange={(event) => updatePatient({ fullName: event.target.value })} /></label>
            <label>DOB<input type="date" value={patient.dob} onChange={(event) => updatePatient({ dob: event.target.value })} /></label>
            <label>Sex<select value={patient.sex} onChange={(event) => updatePatient({ sex: event.target.value as "M" | "F" })}><option>M</option><option>F</option></select></label>
            <label>Civil status<input value={patient.civilStatus} onChange={(event) => updatePatient({ civilStatus: event.target.value })} /></label>
            <label>Contact<input value={patient.contact} onChange={(event) => updatePatient({ contact: event.target.value })} /></label>
            <label>Occupation<input value={patient.occupation} onChange={(event) => updatePatient({ occupation: event.target.value })} /></label>
            <label className="span-2">Address<input value={patient.address} onChange={(event) => updatePatient({ address: event.target.value })} /></label>
          </div>
        </SimpleCard>
        <SimpleCard title="Clinical Profile" action={<button className="primary-button" onClick={startConsult}>Start consult</button>}>
          <label>Allergies<input value={patient.allergies} onChange={(event) => updatePatient({ allergies: event.target.value })} /></label>
          <CheckGrid keys={pmhKeys} values={patient.pmh} toggle={(key) => updatePatient({ pmh: { ...patient.pmh, [key]: !patient.pmh[key] } })} />
          {patient.pmh.Others && <label>Others<input value={patient.pmhOther} onChange={(event) => updatePatient({ pmhOther: event.target.value })} /></label>}
          <label>PSH<textarea value={patient.psh} onChange={(event) => updatePatient({ psh: event.target.value })} /></label>
          <CheckGrid keys={familyKeys} values={patient.family} toggle={(key) => updatePatient({ family: { ...patient.family, [key]: !patient.family[key] } })} />
          <div className="form-grid">
            <label>Smoking<select value={patient.smoking} onChange={(event) => updatePatient({ smoking: event.target.value as Patient["smoking"] })}><option>None</option><option>Former</option><option>Current</option></select></label>
            <label>Alcohol<select value={patient.alcohol} onChange={(event) => updatePatient({ alcohol: event.target.value as Patient["alcohol"] })}><option>None</option><option>Occasional</option><option>Regular</option></select></label>
            <label>Weight<input value={patient.weight} onChange={(event) => updatePatient({ weight: event.target.value })} /></label>
            <label>Height<input value={patient.height} onChange={(event) => updatePatient({ height: event.target.value })} /></label>
          </div>
          <p className="data-line">BMI <span className="mono">{bmi || "Auto"}</span></p>
          <label>Vaccination<input value={patient.vaccination} onChange={(event) => updatePatient({ vaccination: event.target.value })} /></label>
        </SimpleCard>
      </div>
    </section>
  );
}

function ConsultView({
  addOrder,
  addPrescription,
  draft,
  panel,
  patient,
  saveAll,
  setPanel,
  updateDraft,
}: {
  addOrder: (name: string) => void;
  addPrescription: (template: Prescription) => void;
  draft: Consult;
  panel: Panel;
  patient: Patient;
  saveAll: () => void;
  setPanel: (panel: Panel) => void;
  updateDraft: (patch: Partial<Consult>) => void;
}) {
  return (
    <>
      <section className="consult-layout">
        <div className="consult-main page-stack">
          <StickyPatientHeader patient={patient} />
          <SimpleCard
            title="Fast SOAP"
            action={
              <div className="card-actions">
                <button className="secondary-button" onClick={() => window.print()}>Print Paper</button>
                <button className="primary-button" onClick={saveAll}>Save All</button>
              </div>
            }
          >
            <div className="auto-header">
              <span className="mono">{draft.encounterNo ?? draft.id}</span>
              <span className="mono">{draft.dateTime}</span>
              <span>{patient.fullName}</span>
              <span>{age(patient.dob)}/{patient.sex}</span>
            </div>
            <div className="consult-summary">
              <span>{draft.prescriptions.length} prescriptions</span>
              <span>{draft.labs.filter((order) => order.type === "lab").length} labs</span>
              <span>{draft.labs.filter((order) => order.type === "imaging").length} imaging</span>
              <span>{draft.certificateGenerated ? "Certificate ready" : "No certificate"}</span>
            </div>
            <div className="chips">
              {["Fever", "Cough", "Headache", "Follow-up", "Chest pain", "Other"].map((chip) => (
                <button key={chip} onClick={() => updateDraft({ chiefComplaint: chip === "Other" ? "" : chip })}>{chip}</button>
              ))}
            </div>
            <label>Chief complaint<input value={draft.chiefComplaint} onChange={(event) => updateDraft({ chiefComplaint: event.target.value })} /></label>
            <label>Subjective<textarea value={draft.subjective} onChange={(event) => updateDraft({ subjective: event.target.value })} /></label>
            <label>Objective<textarea value={draft.objective} onChange={(event) => updateDraft({ objective: event.target.value })} /></label>
            <div className="vital-grid">
              {Object.entries(draft.vitals).map(([key, value]) => (
                <label key={key}>{key.toUpperCase()}<input value={value} onChange={(event) => updateDraft({ vitals: { ...draft.vitals, [key]: event.target.value } })} /></label>
              ))}
            </div>
            <label>Assessment<input value={draft.assessment} onChange={(event) => updateDraft({ assessment: event.target.value })} /></label>
            <label>Plan<textarea value={draft.plan} onChange={(event) => updateDraft({ plan: event.target.value })} /></label>
          </SimpleCard>
        </div>
        <aside className="quick-panel">
          <h2>Quick Actions</h2>
          {[
            ["prescription", "+ Prescription"],
            ["lab", "+ Lab"],
            ["imaging", "+ Imaging"],
            ["certificate", "+ Certificate"],
            ["referral", "+ Referral"],
            ["follow-up", "+ Follow-up"],
          ].map(([key, label]) => <button className={panel === key ? "active" : ""} key={key} onClick={() => setPanel(key as Panel)}>{label}</button>)}
          <SlideOver panel={panel} draft={draft} addOrder={addOrder} addPrescription={addPrescription} updateDraft={updateDraft} />
        </aside>
      </section>
      <PrintableConsult patient={patient} consult={draft} />
    </>
  );
}

function PrintableConsult({ consult, patient }: { consult: Consult; patient: Patient }) {
  const labOrders = consult.labs.filter((order) => order.type === "lab");
  const imagingOrders = consult.labs.filter((order) => order.type === "imaging");

  return (
    <article className="print-sheet">
      <header className="print-header">
        <div>
          <h1>Clinix EMR</h1>
          <p>Solo Clinic Consultation Record</p>
        </div>
        <div>
          <strong>{consult.encounterNo ?? consult.id}</strong>
          <span>{consult.dateTime}</span>
        </div>
      </header>

      <section className="print-grid">
        <div><strong>Patient</strong><span>{patient.fullName}</span></div>
        <div><strong>Patient ID</strong><span>{patient.patientNo ?? patient.id}</span></div>
        <div><strong>Age / Sex</strong><span>{age(patient.dob)} / {patient.sex}</span></div>
        <div><strong>Contact</strong><span>{patient.contact || "--"}</span></div>
        <div className="print-span"><strong>Address</strong><span>{patient.address || "--"}</span></div>
      </section>

      <section className="print-section">
        <h2>Consultation</h2>
        <p><strong>Chief complaint:</strong> {consult.chiefComplaint || "--"}</p>
        <p><strong>Subjective:</strong> {consult.subjective || "--"}</p>
        <p><strong>Objective:</strong> {consult.objective || "--"}</p>
        <p><strong>Assessment:</strong> {consult.assessment || "--"}</p>
        <p><strong>Plan:</strong> {consult.plan || "--"}</p>
      </section>

      <section className="print-section">
        <h2>Vitals</h2>
        <div className="print-vitals">
          {Object.entries(consult.vitals).map(([key, value]) => <span key={key}>{key.toUpperCase()}: {value || "--"}</span>)}
        </div>
      </section>

      {consult.prescriptions.length > 0 && (
        <section className="print-section">
          <h2>Prescription</h2>
          <table>
            <thead><tr><th>Medication</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>SIG</th><th>Qty</th></tr></thead>
            <tbody>{consult.prescriptions.map((rx) => <tr key={rx.id}><td>{rx.drug}</td><td>{rx.dose}</td><td>{rx.frequency}</td><td>{rx.duration}</td><td>{rx.sig}</td><td>{rx.quantity}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {(labOrders.length > 0 || imagingOrders.length > 0) && (
        <section className="print-section">
          <h2>Labs / Imaging</h2>
          {[...labOrders, ...imagingOrders].map((order) => (
            <div key={order.id} className="print-order">
              <strong>{order.name}</strong>
              {order.fields.map((field) => <span key={field.label}>{field.label}: {field.value || "--"} {field.unit ?? ""} {field.range ? `(${field.range})` : ""}</span>)}
            </div>
          ))}
        </section>
      )}

      {consult.certificateGenerated && (
        <section className="print-section">
          <h2>Medical Certificate</h2>
          <p>This certifies that {patient.fullName}, {age(patient.dob)} years old, was seen on {consult.dateTime} for {consult.chiefComplaint || "consultation"}.</p>
          <p><strong>Diagnosis:</strong> {consult.assessment || "--"}</p>
          <p><strong>Recommendation:</strong> {consult.certificateRecommendation || "--"}</p>
        </section>
      )}

      <footer className="print-signature">
        <div>
          <strong>Dr. Maria Reyes</strong>
          <span>Attending Physician</span>
        </div>
      </footer>
    </article>
  );
}

function SlideOver({
  addOrder,
  addPrescription,
  draft,
  panel,
  updateDraft,
}: {
  addOrder: (name: string) => void;
  addPrescription: (template: Prescription) => void;
  draft: Consult;
  panel: Panel;
  updateDraft: (patch: Partial<Consult>) => void;
}) {
  const [search, setSearch] = useState("");
  const [trendOpen, setTrendOpen] = useState(false);
  const matchingDrugs = drugShortcuts.filter((rx) =>
    [rx.drug, rx.dose, rx.frequency, rx.duration, rx.sig].join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  if (panel === "none") return <p className="empty-panel">Choose an action. It opens here without leaving SOAP.</p>;
  if (panel === "prescription") {
    return (
      <div className="panel-body">
        <input value={search} placeholder="Search drug..." onChange={(event) => setSearch(event.target.value)} />
        <div className="suggestions">
          {matchingDrugs.map((rx) => <button key={rx.id} onClick={() => addPrescription(rx)}>{rx.drug} {rx.dose} {rx.frequency}</button>)}
        </div>
        <EditablePrescriptionList
          items={draft.prescriptions}
          remove={(id) => updateDraft({ prescriptions: draft.prescriptions.filter((rx) => rx.id !== id) })}
          update={(id, patch) => updateDraft({ prescriptions: draft.prescriptions.map((rx) => (rx.id === id ? { ...rx, ...patch } : rx)) })}
        />
      </div>
    );
  }
  if (panel === "lab" || panel === "imaging") {
    const names = panel === "lab" ? ["CBC", "CMP", "Lipid", "HbA1c"] : ["CXR", "ECG", "UTZ"];
    const matchingNames = names.filter((name) => name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="panel-body">
        <input value={search} placeholder={`Search ${panel}...`} onChange={(event) => setSearch(event.target.value)} />
        <div className="suggestions">{matchingNames.map((name) => <button key={name} onClick={() => addOrder(name)}>{name}</button>)}</div>
        <EditableOrderList
          orders={draft.labs.filter((order) => order.type === panel)}
          updateField={(orderId, fieldIndex, value) => updateDraft({
            labs: draft.labs.map((order) => order.id === orderId ? {
              ...order,
              fields: order.fields.map((field, index) => index === fieldIndex ? { ...field, value } : field),
            } : order),
          })}
          remove={(orderId) => updateDraft({ labs: draft.labs.filter((order) => order.id !== orderId) })}
        />
        <button className="secondary-button" onClick={() => setTrendOpen(!trendOpen)}>{trendOpen ? "Hide trends" : "View trends"}</button>
        {trendOpen && <SimpleTrend />}
      </div>
    );
  }
  if (panel === "certificate") {
    return (
      <div className="panel-body">
        <p className="meta">Auto-filled from consult: patient, age, date, complaint, diagnosis.</p>
        <label>Recommendation<input value={draft.certificateRecommendation} onChange={(event) => updateDraft({ certificateRecommendation: event.target.value })} /></label>
        <button className="secondary-button" onClick={() => { updateDraft({ certificateGenerated: true }); window.print(); }}>Generate PDF</button>
      </div>
    );
  }
  if (panel === "referral") {
    return <div className="panel-body"><label>Referral note<textarea value={draft.referral} onChange={(event) => updateDraft({ referral: event.target.value })} /></label></div>;
  }
  return <div className="panel-body"><label>Follow-up date<input type="date" value={draft.followUpDate} onChange={(event) => updateDraft({ followUpDate: event.target.value })} /></label></div>;
}

function PatientHome({ appointments, patient, setView }: { appointments: AppointmentRequest[]; patient: Patient; setView: (view: PatientView) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title={`Welcome, ${patient.fullName}`} detail="Your portal is read-only except appointment requests and profile contact details." />
      <section className="quick-grid">
        <button onClick={() => setView("Appointments")}><strong>Request appointment</strong><span>One short form</span></button>
        <button onClick={() => setView("Appointments")}><strong>Upcoming appointments</strong><span>{appointments.length} items</span></button>
        <button onClick={() => setView("Prescriptions")}><strong>My prescriptions</strong><span>Downloadable via print</span></button>
        <button onClick={() => setView("Records")}><strong>My records</strong><span>Plain-language summaries</span></button>
      </section>
    </section>
  );
}

function PatientAppointments({ appointments, requestAppointment }: { appointments: AppointmentRequest[]; requestAppointment: (formData: FormData) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Request Appointment" detail="Preferred time is optional. Requests appear in the doctor follow-up queue." />
      <form action={requestAppointment} className="inline-form">
        <label>Date<input name="date" type="date" /></label>
        <label>Time<input name="time" type="time" /></label>
        <label>Reason<input name="reason" placeholder="Reason for visit" /></label>
        <button className="primary-button" type="submit">Submit request</button>
      </form>
      <AppointmentTable appointments={appointments} patients={[]} />
    </section>
  );
}

function PatientRecords({ consults }: { consults: Consult[] }) {
  return (
    <section className="page-stack">
      <PageTitle title="My Records" detail="Read-only plain-language visit summaries." />
      {consults.map((consult) => (
        <SimpleCard key={consult.id} title={`${consult.dateTime} - ${plainDiagnosis(consult.assessment)}`}>
          <p>{consult.chiefComplaint}</p>
          <p>{consult.plan}</p>
        </SimpleCard>
      ))}
    </section>
  );
}

function PatientPrescriptions({ consults }: { consults: Consult[] }) {
  const prescriptions = consults.flatMap((consult) => consult.prescriptions);
  return (
    <section className="page-stack">
      <PageTitle title="My Prescriptions" detail="Issued prescriptions from your records." action={<button className="secondary-button" onClick={() => window.print()}>Download PDF</button>} />
      <PrescriptionList items={prescriptions} />
    </section>
  );
}

function PatientProfile({ patient, update }: { patient: Patient; update: (patch: Partial<Patient>) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Profile" detail="Contact details are editable. Clinical fields remain doctor-only." />
      <SimpleCard title="Editable contact details">
        <div className="form-grid">
          <label>Contact<input value={patient.contact} onChange={(event) => update({ contact: event.target.value })} /></label>
          <label className="span-2">Address<input value={patient.address} onChange={(event) => update({ address: event.target.value })} /></label>
        </div>
      </SimpleCard>
      <SimpleCard title="Read-only clinical information">
        <p>Allergies: {patient.allergies || "None listed"}</p>
        <p>Height/Weight: {patient.height || "--"} cm / {patient.weight || "--"} kg</p>
      </SimpleCard>
    </section>
  );
}

function TodayConsults({ consults, open, patients }: { consults: Consult[]; open: (consult: Consult) => void; patients: Patient[] }) {
  return (
    <section className="page-stack">
      <PageTitle title="Today's Consults" detail="Saved consults are retrievable with one click." />
      <table><thead><tr><th>Time</th><th>Patient</th><th>Diagnosis</th><th></th></tr></thead><tbody>{consults.map((consult) => <tr key={consult.id}><td className="mono">{consult.dateTime}</td><td>{patientName(patients, consult.patientId)}</td><td>{consult.assessment}</td><td><button className="secondary-button" onClick={() => open(consult)}>Open</button></td></tr>)}</tbody></table>
    </section>
  );
}

function FollowUps({ appointments, patients, updateAppointment }: { appointments: AppointmentRequest[]; patients: Patient[]; updateAppointment: (id: string, status: Status) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Pending Follow-ups" detail="Patient-initiated requests land here." />
      <AppointmentTable appointments={appointments} patients={patients} updateAppointment={updateAppointment} />
    </section>
  );
}

function StaffAccounts({ onNotice }: { onNotice: (text: string) => void }) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchStaff() {
      try {
        const payload = await apiJson<{ users: StaffUser[] }>("/api/admin/users");
        if (!cancelled) setStaff(payload.users);
      } catch (error) {
        if (!cancelled) onNotice(error instanceof Error ? error.message : "Unable to load staff accounts.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void fetchStaff();
    return () => {
      cancelled = true;
    };
  }, [onNotice]);

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) {
      onNotice("Temporary password must be at least 8 characters.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = await apiJson<{ user: StaffUser }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          displayName: String(formData.get("displayName") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          password,
          role: String(formData.get("role") ?? "DOCTOR"),
          mfaEnabled: formData.get("mfaEnabled") === "on",
        }),
      });
      setStaff((current) => [payload.user, ...current.filter((user) => user.id !== payload.user.id)]);
      form.reset();
      onNotice(`${payload.user.displayName} can now sign in as ${payload.user.role.toLowerCase()}.`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Unable to create staff account.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <PageTitle title="Staff Accounts" detail="Admin-only account setup for doctors and clinic administrators." />
      <div className="staff-layout">
        <form onSubmit={createStaff} className="card form-card">
          <header><h2>Create staff login</h2></header>
          <div className="form-grid">
            <label className="span-2">Name<input name="displayName" placeholder="Dr. First Last" required /></label>
            <label className="span-2">Email<input name="email" type="email" placeholder="doctor@clinic.com" required /></label>
            <label>Role<select name="role" defaultValue="DOCTOR"><option value="DOCTOR">Doctor</option><option value="ADMIN">Admin</option></select></label>
            <label>Password<input name="password" type="password" minLength={8} placeholder="Temporary password" required /></label>
            <label className="check-line span-2"><input name="mfaEnabled" type="checkbox" />Mark MFA required</label>
          </div>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Creating..." : "Create account"}</button>
          </div>
        </form>
        <SimpleCard title="Current staff">
          {isLoading ? (
            <p className="meta">Loading staff accounts...</p>
          ) : staff.length === 0 ? (
            <p className="empty-state">No staff accounts yet.</p>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>MFA</th><th>Created</th></tr></thead>
              <tbody>{staff.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td><Badge label={user.role === "ADMIN" ? "Admin" : "Doctor"} status={user.role === "ADMIN" ? "Completed" : "Scheduled"} /></td>
                  <td>{user.mfaEnabled ? "Required" : "Optional"}</td>
                  <td className="mono">{formatDate(user.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </SimpleCard>
      </div>
    </section>
  );
}

function DoctorSettings({ settings, update }: { settings: Settings; update: (patch: Partial<Settings>) => void }) {
  return (
    <section className="page-stack">
      <PageTitle title="Settings" detail="Admin-created doctor account with optional MFA." />
      <SimpleCard title="Clinic identity">
        <div className="form-grid">
          <label>Clinic<input value={settings.clinicName} onChange={(event) => update({ clinicName: event.target.value })} /></label>
          <label>Doctor<input value={settings.doctorName} onChange={(event) => update({ doctorName: event.target.value })} /></label>
          <label>License<input value={settings.license} onChange={(event) => update({ license: event.target.value })} /></label>
          <label>MFA<select value={settings.mfaEnabled ? "on" : "off"} onChange={(event) => update({ mfaEnabled: event.target.value === "on" })}><option value="off">Optional, off</option><option value="on">Enabled</option></select></label>
        </div>
      </SimpleCard>
    </section>
  );
}

function StickyPatientHeader({ patient }: { patient: Patient }) {
  const tags = pmhKeys.filter((key) => patient.pmh[key]).slice(0, 3);
  return <header className="patient-sticky"><strong>{patient.fullName}</strong><span>{age(patient.dob)}/{patient.sex}</span>{tags.map((tag) => <Badge key={tag} label={tag} status="Scheduled" />)}{patient.allergies && <Badge label="Allergy" status="Pending" />}<span>Last visit: {patient.lastVisit}</span></header>;
}

function PageTitle({ action, detail, title }: { action?: React.ReactNode; detail: string; title: string }) {
  return <header className="page-title"><div><h1>{title}</h1><p>{detail}</p></div>{action}</header>;
}

function SimpleCard({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: string }) {
  return <article className="card"><header><h2>{title}</h2>{action}</header>{children}</article>;
}

function Notice({ onClose, text }: { onClose: () => void; text: string }) {
  return <div className="notice"><span>{text}</span><button onClick={onClose}>Dismiss</button></div>;
}

function CheckGrid<T extends string>({ keys, toggle, values }: { keys: T[]; toggle: (key: T) => void; values: Record<T, boolean> }) {
  return <div className="check-grid">{keys.map((key) => <label key={key}><input type="checkbox" checked={values[key]} onChange={() => toggle(key)} />{key}</label>)}</div>;
}

function AppointmentTable({ appointments, patients, updateAppointment }: { appointments: AppointmentRequest[]; patients: Patient[]; updateAppointment?: (id: string, status: Status) => void }) {
  return <table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>{appointments.map((item) => <tr key={item.id}><td className="mono">{item.preferredDate}</td><td className="mono">{item.preferredTime || "Any"}</td><td>{patients.length ? patientName(patients, item.patientId) : "You"}</td><td>{item.reason}</td><td><Badge label={item.status} status={item.status} /></td><td>{updateAppointment && <div className="row-actions"><button onClick={() => updateAppointment(item.id, "Scheduled")}>Approve</button><button onClick={() => updateAppointment(item.id, "Completed")}>Done</button><button onClick={() => updateAppointment(item.id, "Cancelled")}>Cancel</button></div>}</td></tr>)}</tbody></table>;
}

function EditablePrescriptionList({
  items,
  remove,
  update,
}: {
  items: Prescription[];
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Prescription>) => void;
}) {
  if (!items.length) return <p className="meta">No prescriptions added yet.</p>;
  return (
    <div className="editable-list">
      {items.map((rx) => (
        <article key={rx.id} className="editable-item">
          <header><strong>{rx.drug}</strong><button className="text-button" onClick={() => remove(rx.id)}>Remove</button></header>
          <div className="form-grid compact-grid">
            <label>Drug<input value={rx.drug} onChange={(event) => update(rx.id, { drug: event.target.value })} /></label>
            <label>Dose<input value={rx.dose} onChange={(event) => update(rx.id, { dose: event.target.value })} /></label>
            <label>Frequency<input value={rx.frequency} onChange={(event) => update(rx.id, { frequency: event.target.value })} /></label>
            <label>Duration<input value={rx.duration} onChange={(event) => update(rx.id, { duration: event.target.value })} /></label>
            <label className="span-2">SIG<input value={rx.sig} onChange={(event) => update(rx.id, { sig: event.target.value })} /></label>
            <label>Quantity<input value={rx.quantity} onChange={(event) => update(rx.id, { quantity: event.target.value })} /></label>
          </div>
        </article>
      ))}
    </div>
  );
}

function EditableOrderList({
  orders,
  remove,
  updateField,
}: {
  orders: LabOrder[];
  remove: (orderId: string) => void;
  updateField: (orderId: string, fieldIndex: number, value: string) => void;
}) {
  if (!orders.length) return <p className="meta">No orders added yet.</p>;
  return (
    <div className="editable-list">
      {orders.map((order) => (
        <article key={order.id} className="editable-item">
          <header><strong>{order.name}</strong><button className="text-button" onClick={() => remove(order.id)}>Remove</button></header>
          <div className="result-grid">
            {order.fields.map((field, index) => (
              <label key={field.label}>
                {field.label}
                <input value={field.value} onChange={(event) => updateField(order.id, index, event.target.value)} />
                <span className="meta">{field.unit ? `${field.unit} ` : ""}{field.range ? `(${field.range})` : ""}</span>
              </label>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function PrescriptionList({ items }: { items: Prescription[] }) {
  return <table><thead><tr><th>Drug</th><th>Dose</th><th>Freq</th><th>Duration</th><th>SIG</th><th>Qty</th></tr></thead><tbody>{items.map((rx) => <tr key={rx.id}><td>{rx.drug}</td><td className="mono">{rx.dose}</td><td className="mono">{rx.frequency}</td><td>{rx.duration}</td><td>{rx.sig}</td><td className="mono">{rx.quantity}</td></tr>)}</tbody></table>;
}

function SimpleTrend() {
  return <div className="trend"><strong>HbA1c trend</strong><span>Jan - 8.4</span><span>Mar - 7.5</span><span>Jun - 6.9</span></div>;
}

function Badge({ label, status }: { label: string; status: Status }) {
  return <span className={`badge ${status.toLowerCase()}`}>{label}</span>;
}

type ApiUser = {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  mfaEnabled: boolean;
  patientId: string | null;
};

function sessionFromUser(user: ApiUser): Session {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    patientId: user.patientId ?? undefined,
  };
}

async function apiJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Request failed");
  }
  return payload as T;
}

function tickPmh(enabled: PmhKey[]): Record<PmhKey, boolean> {
  return pmhKeys.reduce((acc, key) => ({ ...acc, [key]: enabled.includes(key) }), {} as Record<PmhKey, boolean>);
}

function tickFamily(enabled: FamilyKey[]): Record<FamilyKey, boolean> {
  return familyKeys.reduce((acc, key) => ({ ...acc, [key]: enabled.includes(key) }), {} as Record<FamilyKey, boolean>);
}

function cloneOrder(order: LabOrder): LabOrder {
  return { ...order, id: makeId(order.type === "lab" ? "LAB" : "IMG"), fields: order.fields.map((field) => ({ ...field })) };
}

function cloneRx(rx: Prescription): Prescription {
  return { ...rx, id: makeId("RX") };
}

function newConsult(patientId: string): Consult {
  return { ...initialConsult, id: makeId("ENC"), patientId, dateTime: "Jul 2, 2026 09:00 AM", chiefComplaint: "", subjective: "", objective: "", assessment: "", plan: "", labs: [], prescriptions: [], certificateGenerated: false, saved: false };
}

function upsertConsult(consults: Consult[], consult: Consult) {
  return consults.some((item) => item.id === consult.id) ? consults.map((item) => (item.id === consult.id ? consult : item)) : [consult, ...consults];
}

function patientName(patients: Patient[], id: string) {
  return patients.find((patient) => patient.id === id)?.fullName ?? "Unknown";
}

function plainDiagnosis(value: string) {
  if (value.toUpperCase() === "URTI") return "Upper respiratory infection";
  return value || "Consultation";
}

function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
}

function calculateBmi(weight: string, height: string) {
  const kg = Number(weight);
  const meters = Number(height) / 100;
  if (!kg || !meters) return "";
  return (kg / (meters * meters)).toFixed(1);
}

function age(dob: string) {
  const birth = new Date(dob);
  const now = new Date("2026-07-02");
  let years = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
