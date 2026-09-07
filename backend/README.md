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
   MONGO_URI=mongodb://localhost:27017/aarohan
   PORT=5000
   JWT_SECRET=supersecretjwtkey_replace_me_in_production
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173
   ```
3. **Seed Initial Admin:**
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
