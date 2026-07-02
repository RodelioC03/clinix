# Clinix EMR

Clinix EMR is a solo-clinic electronic medical record app for fast doctor workflows: patient search, essential charting, one-page SOAP consults, prescriptions, labs/imaging, medical certificates, referrals, follow-ups, and a simple patient portal.

The app follows the supplied solo-clinic workflow and intentionally does not include timeline analytics, complex billing, insurance, inventory, telemedicine, or AI diagnosis in this version.

## Stack

- Next/Vinext
- React
- TypeScript
- PostgreSQL
- Prisma
- bcrypt password hashing
- HTTP-only database-backed sessions

## Current Security Shape

The app includes a PostgreSQL/Prisma backend for:

- Patient self-registration with `PATIENT` role
- Doctor/admin-only patient and consult writes
- Patient-scoped records
- Secure password hashing
- HTTP-only session cookies
- Server-side role checks on protected API routes
- Audit log records for sensitive actions

This is still a development build. Before real patient use, complete a full security/compliance review, production secrets management, HTTPS hosting, backups, audit-log review tools, and privacy/legal requirements for your location.

## Requirements

- Node.js 22+
- PostgreSQL
- npm

## Setup

1. Install dependencies:

```bash
npm.cmd install
```

2. Create a PostgreSQL database, then copy the environment template:

```bash
copy .env.example .env
```

3. Edit `.env` and set your database URL:

```text
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/clinix_emr?schema=public"
```

4. Generate Prisma Client:

```bash
npm.cmd run prisma:generate
```

5. Run the migration:

```bash
npm.cmd run prisma:migrate -- --name init
```

6. Seed demo users and sample clinic data:

```bash
npm.cmd run prisma:seed
```

## Run Locally

```bash
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3001/
```

## Demo Accounts

Doctor:

```text
doctor@clinix.local
demo123
```

Patient:

```text
juan.patient@clinix.local
demo123
```

## Validate

```bash
npm.cmd run lint
npm.cmd run build
```

## Printing

The consultation page has a print-only paper view. When you print from the consult screen, the app hides navigation, buttons, side panels, and web UI controls so only the clinical paper is printed.

## Notes

This repository is intended as the working Clinix EMR codebase. The previous `MyClinic EMR` prototype is separate and should not be mixed with this project.
