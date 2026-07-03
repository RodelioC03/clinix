# Clinix EMR

Clinix EMR is a solo-clinic electronic medical record app for fast doctor workflows: patient search, essential charting, one-page SOAP consults, prescriptions, labs/imaging, medical certificates, referrals, follow-ups, and a simple patient portal.

The app follows the supplied solo-clinic workflow and intentionally does not include timeline analytics, complex billing, insurance, inventory, telemedicine, or AI diagnosis in this version.

## Stack

- Next.js
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

For deployment, use a Node-compatible host with PostgreSQL support, such as Railway, Render, Fly.io, a VPS, or Vercel plus a managed PostgreSQL provider. This Prisma/PostgreSQL version is not meant for static GitHub Pages or Cloudflare Worker-only hosting.

## Cloud Deployment

The app is prepared for cloud deployment with:

- `npm run build` generating Prisma Client and building Next.js
- `npm start` listening on the host-provided `PORT`
- `npm run deploy:migrate` applying Prisma migrations
- `railway.json` for Railway
- `render.yaml` for Render Blueprint deployments
- `vercel.json` for Vercel builds

### Railway

1. Create a Railway project from the GitHub repo.
2. Add a Railway PostgreSQL service.
3. In the Clinix web service, set:

```text
DATABASE_URL=<Railway PostgreSQL connection string>
```

4. Railway will use:

```bash
npm ci && npm run build
npm run deploy:migrate
npm start
```

5. Do not run `npm run prisma:seed` in production unless you intentionally want demo accounts.

### Render

Render can use `render.yaml` to create both the web service and PostgreSQL database.

1. Create a new Render Blueprint from this repository.
2. Render will create:
   - `clinix` web service
   - `clinix-postgres` PostgreSQL database
3. The blueprint wires `DATABASE_URL` from the database into the web service.
4. Render runs migrations with:

```bash
npm run deploy:migrate
```

### Vercel

Vercel works best with a managed PostgreSQL provider such as Neon, Supabase, or Vercel Postgres.

1. Import the GitHub repo into Vercel.
2. Create/connect a PostgreSQL database.
3. Add `DATABASE_URL` in Vercel Project Settings.
4. Set the build command to:

```bash
npm run build
```

5. Run migrations from your machine or a one-off deployment job:

```bash
npm run deploy:migrate
```

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
