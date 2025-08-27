# Local Insights MVP – Sprint 1 (GitHub Ready)

A postcode → insights → PDF generator for UK estate agents.
This repo includes panels for Crime (live), Flood (EA warnings), Broadband/Mobile (Ofcom stubs), EPC (stub), and Schools (stub).

## Local Development
```bash
# Node 18+
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000
```

## Environment Variables (.env)
```
PORT=3000
OFCOM_API_KEY=        # optional for now
EPC_API_TOKEN=        # optional for now
```

## Endpoints
- `/api/health` → `{ ok: true }`
- `/api/preview?postcode=SW1A1AA`
- `/api/report.pdf?postcode=SW1A1AA`

---

## One‑Time: Push to GitHub
```bash
git init
git branch -M main
git add .
git commit -m "Initial commit - Local Insights MVP Sprint 1"
git remote add origin https://github.com/<your-username>/local-insights-mvp.git
git push -u origin main
```

> Replace `<your-username>` with your GitHub username and create the repo first on GitHub (empty repo, no README).

---

## Deploy to Render (Free)
1. Go to https://dashboard.render.com → **New +** → **Web Service** → connect GitHub → pick `local-insights-mvp` repo.
2. Settings:
   - **Environment:** Node
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start`
   - **Environment Variables:**
     - `PORT=3000`
     - `OFCOM_API_KEY=` (optional for now)
     - `EPC_API_TOKEN=` (optional)
3. Click **Create Web Service**. After build, test:
   - `https://<your-service>.onrender.com/api/health`
   - `https://<your-service>.onrender.com/api/preview?postcode=SW1A1AA`
   - `https://<your-service>.onrender.com/api/report.pdf?postcode=SW1A1AA`

---

## Next Up (still Sprint 1)
- Replace Ofcom placeholders with live responses once keys are issued.
- EPC API integration (choose latest certificate by date).
- GIAS/Ofsted data wiring to list nearest schools + outcomes.
- Flood summary: distance to nearest active alert + readable message.
- Add simple caching by postcode for 24–72h.
```
