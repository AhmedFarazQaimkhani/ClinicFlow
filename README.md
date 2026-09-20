# ClinicFlow

Simple clinic software for Pakistani GP / family doctor clinics.

**Not a hospital EMR.** Token → Doctor → Prescription → Medicine → Payment. Repeat medicine has no token and no visit.

## Two workflows

**See Doctor:** Search/create patient → Token → Queue → Consultation → Prescription → Give medicine → Payment

**Repeat Medicine:** Search patient → Previous prescription → Repeat → Give medicine → Payment

A repeat does **not** create a token or a doctor visit.

## Demo login

After seeding:

| Role | Email | Password |
| --- | --- | --- |
| Reception | reception@demo.clinic | Demo1234! |
| Doctor | doctor@demo.clinic | Demo1234! |
| Owner | owner@demo.clinic | Demo1234! |
| Dispenser | dispenser@demo.clinic | Demo1234! |

## Run locally

PostgreSQL is mapped to `localhost:5433` so it does not clash with a local Postgres on 5432.

```bash
docker compose up -d postgres
cd backend
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

API docs: http://localhost:4000/api/docs

## Docker

```bash
docker compose up --build
```

## Tests

```bash
cd backend
npm test
npm run test:e2e
```

The mandatory e2e test proves repeat medicine creates a `REPEAT` dispensing and payment, and does **not** create a visit or token.
