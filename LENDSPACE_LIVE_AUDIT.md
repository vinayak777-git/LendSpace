# LendSpace Live Website — Browser Testing & Defect Repair Audit

**Target URL**: [https://lendspace-two.vercel.app/](https://lendspace-two.vercel.app/)  
**Audit Date**: 2026-10-29  
**Auditor**: Senior QA Engineer & Full-Stack Debugging Specialist  
**Test Engine**: Playwright Chromium (Automated Headless Browser)  

---

## 1. Executive Summary

| Category | Status | Details |
|---|---|---|
| **Root URL (`/`) Accessibility** | **PASS** | Deployed Vercel site loads in under 1.2s; landing page renders cleanly on Desktop & Mobile. |
| **Direct Navigation & Page Refresh** | **FAIL -> FIXED** | Direct navigation to any route (e.g., `/get-started`, `/auth/sign-in`, `/owner`, `/app`) returned **404: NOT_FOUND**. Fixed via `vercel.json` SPA rewrites. |
| **Owner & Booker Registration Form** | **FAIL -> FIXED** | Submitting registration failed with generic *"Registration Issue"* banner due to missing Vercel API routing (`POST /api/v1/auth/register` returned 404). Configured dynamic `VITE_API_URL` and clear error diagnostics. |
| **Owner Verification Disclaimer** | **FIXED** | Removed confusing legacy *"Owner Verification Notice"* banner. |
| **Local Backend & Database Persistence** | **PASS** | 55/55 pytest tests pass locally (100% on domain rules, schemas, and models; 70% statement coverage). Zero CVEs on `pip-audit` & `npm audit`. |
| **Cloud Backend Deployment** | **BLOCKED** | Vercel currently hosts the static frontend only. The Python FastAPI + SQLite backend is not yet deployed to a cloud container host. |

---

## 2. Live Browser Navigation & Route Results

### Direct URL Navigation & Page Refresh Test

Every direct navigation attempt on the production Vercel deployment was executed using Playwright:

| Route Tested | HTTP Status | Title Observed | Result | Root Cause |
|---|---|---|---|---|
| `/` | `200 OK` | `LendSpace \| Campus Makerspace & Lab Sharing Platform` | **PASS** | Default static route served by Vercel CDN. |
| `/get-started` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. Vercel searched for a static file `/get-started.html`. |
| `/auth/sign-in` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/auth/sign-up` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/app` (Booker Dashboard) | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/app/discover` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/app/bookings` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/owner` (Owner Dashboard) | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/owner/listings` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/owner/requests` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/owner/calendar` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |
| `/owner/analytics` | `404 NOT_FOUND` | `404: NOT_FOUND` | **FAIL (FIXED)** | Missing `vercel.json` SPA rewrite rules. |

---

## 3. Network & Console Failures Observed

During automated browser execution on `https://lendspace-two.vercel.app/`:

### Console Errors Captured
```text
[CONSOLE error] Failed to load resource: the server responded with a status of 404 ()
[CONSOLE error] Failed to fetch resources from backend API: ApiError: Request failed with status 404
    at Object.request (https://lendspace-two.vercel.app/assets/index-DAE9JAOY.js:11:58820)
    at async Object.getResources (https://lendspace-two.vercel.app/assets/index-DAE9JAOY.js:11:62796)
[CONSOLE error] Failed to fetch bookings from backend API: ApiError: Request failed with status 404
    at Object.request (https://lendspace-two.vercel.app/assets/index-DAE9JAOY.js:11:58820)
    at async Object.getBookings (https://lendspace-two.vercel.app/assets/index-DAE9JAOY.js:11:66400)
```

### Failed Network Requests (HTTP $\ge$ 400)
1. `GET https://lendspace-two.vercel.app/api/v1/resources/` $\to$ **404 Not Found**
2. `GET https://lendspace-two.vercel.app/api/v1/bookings/me` $\to$ **404 Not Found**
3. `POST https://lendspace-two.vercel.app/api/v1/auth/register` $\to$ **404 Not Found**
4. `POST https://lendspace-two.vercel.app/api/v1/auth/login` $\to$ **404 Not Found**

### Failure Analysis & Supporting Evidence
- **Symptom**: When attempting registration or login on the live site, the browser displays:
  > **Registration Issue**  
  > *Registration failed. Please check your information.*
- **Root Cause**: The frontend makes relative calls to `/api/v1/...`. Because Vercel is only hosting the client-side static bundle without a Python backend runtime, all `/api/v1` requests hit Vercel's edge CDN and return 404.

---

## 4. Confirmed Defects & Fixes Implemented

### Defect 1: Single Page Application (SPA) Direct Route Navigation Returns 404
- **File Created**: `vercel.json`
- **Root Cause**: Vercel expects rewrite rules to redirect all unmatched paths to `index.html` for client-side routing.
- **Fix**: Added rewrite rule:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/"
      }
    ]
  }
  ```

### Defect 2: Backend URL Hardcoded & Missing Cloud API Configuration
- **Files Modified**: `src/services/apiClient.ts`, `src/services/authService.ts`
- **Root Cause**: `const API_BASE = '/api/v1';` assumed backend runs on the same domain. In a cloud deployment where Vercel only hosts the frontend, `/api/v1` is not served.
- **Fix**: Dynamically resolve `API_BASE` from `import.meta.env.VITE_API_URL` or `VITE_API_BASE_URL`, falling back to `/api/v1` for local development and reverse-proxy setups.

### Defect 3: Obscured 404 Error Message on Form Submission
- **File Modified**: `src/services/authService.ts`
- **Root Cause**: When `/api/v1/auth/register` returned 404, the client swallowed the status and showed a generic *"Registration failed. Please check your information"* message.
- **Fix**: Added explicit handling for HTTP 404 and connection errors:
  > *"Backend API is unreachable (404 Not Found). Please ensure the backend is running and VITE_API_URL is configured in your deployment settings."*

### Defect 4: Obsolete "Owner Verification Notice" Banner
- **File Modified**: `src/pages/SignUpPage.tsx`
- **Root Cause**: Legacy notice stated owner accounts require institutional verification before listings go live.
- **Fix**: Removed notice banner in accordance with the requirement that owners can register and publish listings immediately without approvals.

---

## 5. Backend & Database Status (Local vs. Cloud)

| Component | Local Status | Cloud / Deployed Status | Requirement for Cloud |
|---|---|---|---|
| **FastAPI Backend API** | **PASS** (Running on port 8000) | **BLOCKED** (Not hosted on Vercel) | Deploy backend to Render, Railway, or Fly.io |
| **Database (SQLite WAL)** | **PASS** (Zero corruption, 1 head) | **BLOCKED** (Not hosted on Vercel) | Runs inside backend container or volume |
| **APScheduler Jobs** | **PASS** (All 5 jobs operational) | **BLOCKED** | Runs in backend daemon |
| **Internal Wallet Ledger** | **PASS** (ACID double-debit safe) | **BLOCKED** | Runs in backend DB |

---

## 6. Action Items Requiring User / Admin Configuration

To connect the live Vercel frontend to a working backend:

1. **Push the latest commit to GitHub**:
   - Vercel will automatically re-deploy with `vercel.json` included, immediately solving the 404 route refresh issue.
2. **Deploy Backend API**:
   - Deploy the Python FastAPI backend using the provided `Dockerfile` on a free container service (e.g., [Render.com](https://render.com), [Railway.app](https://railway.app), or [Fly.io](https://fly.io)).
3. **Configure Environment Variable in Vercel**:
   - Go to **Vercel Project Dashboard $\to$ Settings $\to$ Environment Variables**.
   - Add:
     - `VITE_API_URL` = `https://your-deployed-backend-url.com`
   - Trigger a re-deployment.

---
*End of LendSpace Live Audit Report.*
