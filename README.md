

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
