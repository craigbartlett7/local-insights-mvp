import axios from 'axios';

/**
 * OpenAQ nearest measurements for PM2.5, NO2 (10km radius).
 * No API key required.
 */
export async function getAirQuality(lat, lng) {
  try {
    const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=25000&limit=5`;
    const { data } = await axios.get(url);
    const results = data?.results || [];
    const pick = (param) => {
      for (const r of results) {
        const m = (r.measurements||[]).find(x=>x.parameter===param);
        if (m) return { value: m.value, unit: m.unit, lastUpdated: m.lastUpdated };
      }
      return null;
    };
    const pm25 = pick('pm25');
    const no2 = pick('no2');
    return { pm25, no2, source: 'OpenAQ (nearest sites within 10km)' };
  } catch(e) {
    return { error: true, message: String(e) };
  }
}
