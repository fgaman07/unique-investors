# I&S BuildTech Production Setup

## 1. PostgreSQL install and database creation

Install PostgreSQL 15 or later on the target machine, then create a database and user.

Example SQL:

```sql
CREATE DATABASE isbuildtech_prod;
CREATE USER isbuildtech_app WITH ENCRYPTED PASSWORD 'replace-with-strong-password';
GRANT ALL PRIVILEGES ON DATABASE isbuildtech_prod TO isbuildtech_app;
```

Use this connection string format in [backend/.env](/D:/isBuildTech2/backend/.env):

```env
DATABASE_URL="postgresql://isbuildtech_app:replace-with-strong-password@localhost:5432/isbuildtech_prod?schema=public"
JWT_SECRET="replace-with-a-very-strong-secret"
PORT=5000
CLIENT_URL="https://your-frontend-domain.com"
```

Use this in [frontend/.env](/D:/isBuildTech2/frontend/.env) or [frontend/.env.example](/D:/isBuildTech2/frontend/.env.example):

```env
VITE_API_BASE_URL="https://your-api-domain.com/api"
```

## 2. Prisma schema and seed

After PostgreSQL is reachable:

```powershell
cd D:\isBuildTech2\backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

This project now uses PostgreSQL in [backend/prisma/schema.prisma](/D:/isBuildTech2/backend/prisma/schema.prisma) and seeds:

- admin and agent users
- company settings
- MLM commission slabs
- sample project and inventory

Default seeded credentials:

- admin: `admin` / `admin123`
- agent: `user123` / `admin123`

## 3. Local run

Backend:

```powershell
cd D:\isBuildTech2\backend
npm run dev
```

Frontend:

```powershell
cd D:\isBuildTech2\frontend
npm run dev
```

## 4. Production build

Backend:

```powershell
cd D:\isBuildTech2\backend
npm run build
```

Frontend:

```powershell
cd D:\isBuildTech2\frontend
npm run build
```

## 5. Production deployment checklist

- Put backend behind PM2, NSSM, or a Windows service.
- Put frontend behind Nginx, IIS, or a static hosting provider.
- Keep `JWT_SECRET` unique and secret.
- Use a managed PostgreSQL backup policy.
- Enable HTTPS on both frontend and backend.
- Restrict `CLIENT_URL` to the real frontend domain.
- Seed once, then use real admin flows to manage users, projects, sales, EMI, and commission settings.

## 6. Functional areas now wired to database

- login and auth
- admin user creation, edit, activate, block
- project creation and block creation
- property creation and inventory listing
- sales creation
- EMI recording
- company settings persistence
- MLM commission slab persistence
- commission ledger recalculation
