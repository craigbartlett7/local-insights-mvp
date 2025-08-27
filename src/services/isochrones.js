import axios from 'axios';

export async function getIsochronesSummary(lat, lng) {
  const key = process.env.ORS_API_KEY;
  if (!key) return { available: false, note: 'No ORS_API_KEY provided' };
  const base = 'https://api.openrouteservice.org/v2/isochrones';
  const headers = { Authorization: key, 'Content-Type': 'application/json' };

  const specs = [
    { profile: 'foot-walking', ranges: [900], label: 'walk_15' },
    { profile: 'driving-car', ranges: [1800], label: 'drive_30' }
  ];

  const out = { available: true, items: [] };
  for (const s of specs) {
    try {
      const { data } = await axios.post(`${base}/${s.profile}`, {
        locations: [[lng, lat]],
        range: s.ranges
      }, { headers });
      const ok = !!(data && data.features && data.features.length);
      out.items.push({ label: s.label, ok });
    } catch (e) {
      out.items.push({ label: s.label, ok: false, error: String(e) });
    }
  }
  return out;
}
