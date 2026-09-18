# AAROHAN Backend - Phase 1

This is the backend service for the AAROHAN Victim Welfare System.

## Stack
- Node.js
- Express.js
- MongoDB / Mongoose

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` file in the `backend` directory based on `.env.example`:
   ```env
   # Persistent MongoDB database; the database name is required.
   MONGO_URI=mongodb://localhost:27017/aarohan
   PORT=5000
   # Use a unique, long random value; the server refuses the example placeholder.
   JWT_SECRET=generate_a_unique_long_random_secret_here
   # Optional prototype account provisioning; disabled by default.
   SEED_DEMO_DATA=false
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173
   ```
3. **Optional Prototype Seed:**
   The server never falls back to disposable in-memory storage and does not seed demo accounts unless explicitly enabled. For local prototype data, set `SEED_DEMO_DATA=true` before starting the server. Keep this disabled for shared or production databases.

   You must create the initial administrator securely via the seed script. Do not attempt to register an admin via the public API.
   ```bash
   cd database
   npm install bcryptjs
   MONGO_URI="mongodb://localhost:27017/aarohan" ADMIN_EMAIL="admin@aarohan.gov" ADMIN_PASSWORD="securepassword123" node scripts/seedDatabase.js
   ```
4. **Start Server:**
   ```bash
   cd backend
   npm run dev
   ```

The API logs the connected MongoDB host and database name at startup. If MongoDB is unavailable, startup fails instead of switching to an in-memory database. `USE_MEMORY_DB=true` is reserved for `NODE_ENV=test` only and is not a persistence option.

## Privacy Boundaries
- **Victim Chatbot:** Conversations are completely private. At this stage, neither Counselors nor Admins have automatic access to victim chatbot messages.
- **Counselor Scope:** Counselors only have access to demographic/assignment data for victims that are actively assigned to them.
- **Admin Scope:** Administrators handle verification and assignments, but do not have automatic read access to sensitive victim communications.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Role | Purpose |
| ------ | -------- | ---- | ------- |
| POST | `/auth/register/victim` | Public | Victim registration |
| POST | `/auth/register/counselor` | Public | Counselor registration |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Authenticated | Current user profile |
| GET | `/admin/counselors/pending` | Admin | List pending counselors |
| POST | `/admin/counselors/:id/verify` | Admin | Approve or reject counselor |
| POST | `/admin/assignments` | Admin | Assign counselor to a victim |
| GET | `/victim/counselor` | Victim | Get assigned counselor details |
| GET | `/counselor/victims` | Counselor | List assigned victims |

## Counselor Workflows

### Verification Workflow
1. Counselor registers (`/auth/register/counselor`). Status is set to `pending`.
2. Counselor cannot login or access APIs while pending.
3. Admin fetches pending counselors (`/admin/counselors/pending`).
4. Admin verifies counselor (`/admin/counselors/:id/verify` with `{ status: 'approved' }`).
5. Counselor becomes `active` and can log in.

### Assignment Workflow
1. Admin triggers assignment (`/admin/assignments` with `victimId` and `counselorId`).
2. System checks if victim is active and counselor is verified/active.
3. System checks counselor's `maxCaseload`.
4. If victim already has an active counselor, the old assignment is marked `transferred` and caseload is balanced.
5. New assignment is created, counselor's `currentCaseload` is incremented.

## Testing Instructions
*   Ensure MongoDB is running locally.
*   Use Postman/Insomnia to hit the `/api/v1/auth/register/victim` endpoint.
*   Check rate limit handling by spamming the auth endpoints.
*   Test JWT authorization by hitting `/auth/me` without a token (expect 401).
*   Test RBAC by hitting `/admin/assignments` with a victim token (expect 403).
