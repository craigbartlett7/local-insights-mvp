

## Sprint 2.2 additions
- Live EPC integration (uses `EPC_API_TOKEN`; optional `EPC_BASE_URL`).
- Crime: 12-month total trend.
- Air quality: PM2.5 and NO₂ from OpenAQ (nearest site).
- River level: 7-day trend from nearest EA station.


## Sprint 2.4 additions
- ⚡ In-memory caching with TTL (crime, air, rivers, income).
- 🧮 Income panel: **Average annual household income within 5 km** (uses optional `data/msoa_income.csv` from ONS).
- 📉 Homepage mini **crime sparkline** (12 months).
- Hooks left in place to later overlay flood-risk polygons on the static map.


## Income dataset auto-bootstrap (Sprint 2.5)
The app now **auto-builds** `data/msoa_income.csv` on first run:
1. If the file already exists, it uses it.
2. Else it tries to **download** ONS sources (URLs can be set via env):
   - `INCOME_SOURCE_URL` → CSV with MSOA code + median household income
   - `MSOA_CENTROIDS_URL` → CSV with MSOA code + `lat,lng` centroids
3. If downloads fail, it falls back to a **national median estimate (£32,000)** so the report still shows a value.

> To make it fully live, set the two env variables to working ONS CSV endpoints. When present, the service will fetch, join and persist a merged CSV at startup.


## Sprint 2.6 additions
- **Income (5 km) now weighted by households** when available; falls back to simple average otherwise.
- **Built-in mini ONS sample dataset** (`data/ons_mini_income.csv`) ships with the app so the metric works even without downloads.
- **Freshness badge**: HTML/PDF show date and source used (local/downloaded/builtin/fallback).
- To go fully live, set `INCOME_SOURCE_URL` and `MSOA_CENTROIDS_URL` with official ONS CSVs; the app will build `data/msoa_income.csv` automatically.


## Sprint 2.8 fixes
- EPC: **Basic auth** (ODC) + **Accept: text/csv**; CSV parsing; improved matching when exact house number not found.
- Crime: if zero last month, try previous months (up to 3) to avoid empty tables.
- Air quality: widen search radius to **25 km** fallback.
- Rivers: choose the **stage/level** measure when stations expose multiple measures.
- Map: smaller static map (**600x320**, zoom 13); PDF constrains map width.
