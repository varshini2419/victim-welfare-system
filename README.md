# AAROHAN - Victim Welfare & Rehabilitation System

A comprehensive, role-based welfare and rehabilitation support system featuring an AI-assisted emotional distress monitoring chatbot, counselor case management, victim assistance tracking, and administrative governance.

---

## Architecture & Ports

| Component | Technology | Default Port | URL |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React + Vite | `5180` | [http://localhost:5180](http://localhost:5180) |
| **Backend API** | Node.js + Express + Mongoose | `5000` | [http://localhost:5000](http://localhost:5000) |
| **AI Support Service** | Python + Flask | `5001` | [http://127.0.0.1:5001](http://127.0.0.1:5001) |

> **Note on MongoDB:** The backend includes an automated in-memory MongoDB replica set fallback (`mongodb-memory-server`). If a local MongoDB instance or MongoDB Atlas cluster is unreachable, it will automatically launch an in-memory database without manual intervention.

---

## Quick Setup & Start Commands

Open **3 separate terminal windows** (PowerShell or Command Prompt) to run the services concurrently:

### Terminal 1: Backend Service (Node.js)
```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies (first time only)
npm install

# 3. Start the backend server
node src/server.js
```
*(Runs on `http://localhost:5000`. On startup, it automatically seeds and verifies Admin, Counselor, and Patient demo accounts.)*

---

### Terminal 2: Frontend Web App (React / Vite)
```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (first time only)
npm install

# 3. Start the Vite development server
npm run dev
```
*(Runs on `http://localhost:5180` with proxying configured to route `/api` calls directly to port `5000`.)*

---

### Terminal 3: AI Service (Python / Flask)
```powershell
# 1. Navigate to the ai-service directory
cd ai-service

# 2. Install requirements (first time only)
pip install -r requirements.txt

# 3. Start the Flask AI server
python flask_app.py
```
*(Runs on `http://127.0.0.1:5001` to provide sentiment detection, distress scoring, and multi-language support.)*

---

## Pre-Configured Demo Accounts & Dashboards

The backend auto-seeds verified accounts and links an active counselor-patient caseload assignment.

### 1. Patient (Victim) Portal
* **Portal URL:** [http://localhost:5180/login](http://localhost:5180/login)
* **Landing Page:** `/victim/dashboard`
* **Patient Name:** Priya Verma
* **Status:** Verified & Active (Assigned to Dr. Ananya Sharma)

| Field | Value |
| :--- | :--- |
| **Case ID** | `ARH-2026-001` |
| **Phone Number** | `9876501234` |
| **OTP** | `123456` |

**Login Steps:**
1. Navigate to [http://localhost:5180/login](http://localhost:5180/login).
2. Enter Case ID `ARH-2026-001` and Phone `9876501234`, then click **Send OTP**.
3. Enter OTP `123456` and click **Verify & Login**.

---

### 2. Counselor Portal
* **Portal URL:** [http://localhost:5180/counselor/login](http://localhost:5180/counselor/login)
* **Landing Page:** `/counselor/dashboard`
* **Counselor Name:** Dr. Ananya Sharma *(Clinical Psychologist & Trauma Specialist)*
* **Status:** Verified & Approved

| Field | Value |
| :--- | :--- |
| **Email** | `counselor@aarohan.gov` |
| **Password** | `counselorpassword123` |

*(When logged in, Priya Verma `ARH-2026-001` is already in her active caseload with distress indicators and appointment scheduling enabled.)*

---

### 3. Administrator Portal
* **Portal URL:** [http://localhost:5180/admin/login](http://localhost:5180/admin/login)
* **Landing Page:** `/admin/dashboard`
* **Role:** System Administrator

| Account | Email | Password |
| :--- | :--- | :--- |
| **Primary Admin** | `admin@aarohan.gov` | `adminpassword123` |
| **Developer Admin** | `varshini2419@gmail.com` | `1234` |

---

## Summary of All Portals

| Portal | Login URL | Credentials | Role |
| :--- | :--- | :--- | :--- |
| **Patient Portal** | [http://localhost:5180/login](http://localhost:5180/login) | Case: `ARH-2026-001`<br>Phone: `9876501234`<br>OTP: `123456` | Victim / Survivor |
| **Counselor Portal** | [http://localhost:5180/counselor/login](http://localhost:5180/counselor/login) | `counselor@aarohan.gov`<br>`counselorpassword123` | Counselor |
| **Administration Portal** | [http://localhost:5180/admin/login](http://localhost:5180/admin/login) | `admin@aarohan.gov`<br>`adminpassword123` | Admin |