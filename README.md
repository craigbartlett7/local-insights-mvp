# Local Insights MVP – Sprint 1.5

**New:** EPC hybrid mode  
- If user supplies **house number/name + postcode** → show **property EPC** (mode: `property`).  
- If user supplies **postcode only** → show **postcode-wide EPC context** (mode: `postcode`): average rating, distribution A–G, properties analysed.

## Run locally
```bash
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000
```

## Endpoints
- `/api/preview?postcode=SW1A1AA&number=10`
- `/api/report.pdf?postcode=SW1A1AA&number=10`

## Env vars
- `OFCOM_API_KEY` (optional for now)
- `EPC_API_TOKEN` (required for live EPC; placeholders without it)

## Notes
- EPC API calls are stubbed with placeholders until tokens and exact endpoints are configured.
- Crime, Flood (alerts), Broadband/Mobile, Schools present as before.
