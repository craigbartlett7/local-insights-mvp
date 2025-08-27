
# Local Insights MVP – Pretty UI + HTML Report

This build includes:
- Card-based preview UI (no raw JSON)
- `/api/report.html` endpoint (pretty HTML report for demos)
- PDF route still present; we’ll harden Puppeteer in the next update.

## Run locally
```bash
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000
```

## Render deploy
- Build: `npm install`
- Start: `npm run start`
- Env: `PORT=3000`, `OFCOM_API_KEY` (optional), `EPC_API_TOKEN` (optional)
