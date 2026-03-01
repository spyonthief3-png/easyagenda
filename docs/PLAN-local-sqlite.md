# PLAN-local-sqlite: Local SQLite Backend Migration

## 1. Overview
Current state: Frontend application (Vite/React) using mock data.
Goal: Create a local Node.js backend using SQLite (via `better-sqlite3`) and Drizzle ORM to persist data locally.
Future Goal: Migrate this local setup to Turso/Vercel Functions later (hence, keeping architecture modular).

## 2. Architecture & Tech Stack
- **Runtime:** Node.js (Local Server)
- **Framework:** Express.js (Simple, separate process, easy to adapt to Vercel later)
- **Database:** SQLite (Local file `local.db`)
- **ORM:** Drizzle ORM
- **Driver:** `better-sqlite3` (High performance local driver)
- **Frontend Integration:** Proxy via Vite or direct CORS calls.

## 3. Implementation Steps

### Phase 1: Foundation (Backend Setup)
- [ ] **Install Dependencies**
    - `npm install drizzle-orm better-sqlite3 express cors dotenv`
    - `npm install -D drizzle-kit @types/express @types/cors @types/better-sqlite3 @types/node tsx`
- [ ] **Configure Environment**
    - Create `.env` for server config (`PORT=3000`, `DATABASE_URL=file:local.db`)
    - Ignore `.env` and `local.db` in `.gitignore`.
- [ ] **Initialize Drizzle**
    - Create `drizzle.config.ts`
    - Create `server/db/client.ts` (DB connection logic)

### Phase 2: Schema Design (Data Layer)
- [ ] **Define Schema** (`server/db/schema.ts`)
    - Mirror `types.ts` structures:
        - `users` table (id, name, email, role, password_hash)
        - `locations` table
        - `room_types` table
        - `rooms` table (capacity, resources json)
        - `periods` table (time slots)
        - `bookings` table (relations to user, room, period)
        - `holidays` & `blackouts`
- [ ] **Generate Migrations**
    - Run `drizzle-kit generate` to create SQL migrations.
- [ ] **Run Migrations**
    - Run `drizzle-kit migrate` to apply to `local.db`.

### Phase 3: Seeding (Migration of Mock Data)
- [ ] **Create Seed Script** (`server/db/seed.ts`)
    - Extract mock data from Frontend.
    - Insert default Admin user.
    - Insert basic Periods, Rooms, and Locations.
    - Run seed script.

### Phase 4: Server & API Implementation
- [ ] **Setup Express App** (`server/index.ts`)
    - Basic middleware (JSON, CORS, Logger).
- [ ] **Implement Routes**
    - `POST /api/auth/login` (Real DB check)
    - `POST /api/auth/logout`
    - `GET /api/auth/me`
    - `GET /api/bookings`
    - `POST /api/bookings`
    - `DELETE /api/bookings/:id`
    - `GET /api/rooms`
    - `GET /api/availability`
- [ ] **Update Package Scripts**
    - Add `"server": "tsx watch server/index.ts"`
    - Add `"dev:full": "concurrently \"npm run server\" \"npm run dev\""`

### Phase 5: Frontend Integration
- [ ] **Update API Client**
    - Point `services/api.ts` to `http://localhost:3000/api`.
    - Handle Authentication (store token/cookie).
- [ ] **Verify End-to-End**
    - Create a booking.
    - Restart server -> Verify data persists.

## 4. Verification Checklist (Phase X)
- [ ] **Database Persistence:** Restarting the server does NOT lose data.
- [ ] **Auth Flow:** Login works with DB credentials.
- [ ] **Booking Flow:** Can create, view, and cancel bookings.
- [ ] **Data Integrity:** No "ghost" bookings or overlaps allowed.
- [ ] **Lint & Build:** `npm run lint` passes.
