# Blood Donation Management System (BDMS)

## Tech Stack

- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL (Docker) + Prisma ORM
- **Package Manager:** pnpm

---

## Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/installation)

Install pnpm globally:

```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/one-project-one-month/BDMS_Nest.git
cd BDMS_Nest
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in the values:

```env
NODE_ENV=development
PORT=3000
APP_NAME=BloodDonationManagmentSystem
DATABASE_URL="postgresql://opom:i_got_hacked@localhost:5432/bdms"
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d
```

### 4. Start the database

```bash
docker-compose up -d
```

Verify it's running:

```bash
docker ps
```

You should see `bdms_db` running.

### 5. Run Prisma migrations

```bash
pnpm run db:migrate
```

### 6. Generate Prisma client

```bash
pnpm run db:generate
```

### 7. Start the application

```bash
pnpm run start
```

### 8. Start the application in Watch Mode

```bash
pnpm run start:dev
```

App runs at: `http://localhost:3000`

---

## Useful Commands

```bash
# Run migrations after schema change
npx prisma migrate dev --name <migration_name>

# Regenerate Prisma client after schema change
pnpm run db:generate

# Seed data into the database (make sure database container is running before running this command)
pnpm run db:seed

# Open Prisma Studio (DB GUI)
pnpm run db:studio

# Stop Docker database
docker-compose down

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format codes before commit
pnpm run format
```

---

## Project Structure

```
src/
├── config/             # App configuration
├── common/             # Shared filters, interceptors,
├── database/           # Prisma service
├── auth/               # Authentication & authorization
├── users/              # User management
├── donations/          # Donation management
├── requests/           # Blood requests
├── appointments/       # Appointment scheduling
├── blood-inventory/    # Blood inventory tracking
└── announcements/      # Announcements
```

---

## Git Workflow

### Branch Structure

```
main          → production ready code
dev             → integration branch (merge all features here first)
feature/*       → individual feature branches
```

### Flow

```
feature/donations → dev → main
```

### Steps

```bash
# 1. Always branch off from dev
git checkout dev
git pull origin dev
git checkout -b feature/

# 2. Work on your feature, commit regularly
git add .
git commit -m "feat: add donation CRUD"

# 3. Push your feature branch
git push origin feature/

# 4. Create PR → target dev (NOT main)
```

### Rules

- Never push directly to `main` or `dev`
- Always branch off from `dev`
- Always create a PR and target is always `dev`
- Pull latest `dev` before starting new work

**Branch naming:**
| Module | Branch |
|--------|--------|
| Auth | `feature/auth` |
| Users | `feature/users` |
| Donations | `feature/donations` |
| Requests | `feature/requests` |
| Appointments | `feature/appointments` |
| Blood Inventory | `feature/blood-inventory` |
| Announcements | `feature/announcements` |

---

## Environment Variables

| Variable                 | Required | Description                         |
| ------------------------ | -------- | ----------------------------------- |
| `NODE_ENV`               | No       | development / production            |
| `PORT`                   | No       | App port (default: 3000)            |
| `APP_NAME`               | No       | App name                            |
| `DATABASE_URL`           | ✅ Yes   | PostgreSQL connection string        |
| `JWT_SECRET`             | ✅ Yes   | JWT signing secret                  |
| `JWT_EXPIRES_IN`         | No       | JWT expiry (default: 7d)            |
| `JWT_REFRESH_SECRET`     | ✅ Yes   | Refresh token secret                |
| `JWT_REFRESH_EXPIRES_IN` | No       | Refresh token expiry (default: 30d) |

### Rules

- Never hardcode secrets in code
- Never commit `.env` file
- Always update `.env.example` when adding new variables
- Required variables → use `Joi.string().required()`
- Optional variables → use `Joi.string().default('value')`
- App will **refuse to start** if required variables are missing

**Use it anywhere**

```typescript
constructor(private appConfig: AppConfigService) {}

someMethod() {
  const value = this.appConfig.newVariable;
}
```

---

## Troubleshooting

**Prisma client not initialized:**

```bash
npx prisma generate
```

**Database connection failed:**

```bash
# Make sure Docker is running
docker-compose up -d
docker ps
```

**pnpm store error (Windows):**

If you see `ENOENT` or `UNKNOWN` errors during `pnpm install`:

```bash
pnpm config set store-dir "C:/.pnpm-store"
pnpm install
```

**Port already in use:**

```bash
# Change PORT in .env
PORT=3001
```
