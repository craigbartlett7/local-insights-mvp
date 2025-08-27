# Local Insights MVP – Sprint 2

**New in this build**
- Mapbox static map snapshot on preview & HTML report.
- OpenRouteService isochrones summary (walk 15 min, drive 30 min).
- Hardened PDF renderer (Puppeteer flags for Render).
- Pretty preview UI retained.

## Environment variables
PORT=3000
OFCOM_API_KEY=      # optional until approved
EPC_API_TOKEN=      # optional until you add it
MAPBOX_TOKEN=       # required for map snapshot
ORS_API_KEY=        # required for isochrone summary

## Run locally
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000

## Endpoints
- /api/preview?postcode=SW1A1AA&number=10
- /api/report.html?postcode=SW1A1AA&number=10
- /api/report.pdf?postcode=SW1A1AA&number=10
