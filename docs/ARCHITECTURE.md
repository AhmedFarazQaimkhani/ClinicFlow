# Architecture

- `frontend/` Vite + React + MUI PWA
- `backend/` NestJS REST + Socket.IO
- `shared/` shared helpers
- PostgreSQL via Prisma
- JWT access (15m) + hashed refresh tokens
- RBAC: OWNER, DOCTOR, RECEPTIONIST, DISPENSER
- Clinic-level isolation on every query
- Dispensing and stock updates run in database transactions
- Historical prescription items store medicine snapshots

WhatsApp notifications are intentionally not in the MVP; events exist so they can be added later.
