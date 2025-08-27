import axios from 'axios';

/**
 * Live EPC lookup using EPC Open Data Communities.
 * - Property mode: requires {postcode, number} -> fetch most recent cert for that address.
 * - Postcode mode: aggregates most recent cert per address in the postcode.
 * Requires EPC_API_TOKEN (Bearer).
 */
export async function getEpcSummary({ postcode, number }) {
  const token = process.env.EPC_API_TOKEN;
  const base = process.env.EPC_BASE_URL || 'https://epc.opendatacommunities.org/api/v1/domestic/search';
  const headers = token ? { Authorization: `Bearer ${token}` } : null;
  const hasNumber = !!(number && String(number).trim().length);
  const pc = String(postcode).toUpperCase().replace(/\s+/g,''); // compact

  if (!headers) {
    // No token -> clear message, but still useful aggregates as demo
    return {
      mode: hasNumber ? 'property' : 'postcode',
      note: 'No EPC_API_TOKEN provided; configure token for live data.',
      ...(hasNumber ? { rating:'—', assessmentDate:'—' } : {
        propertiesAnalysed: null, averageRating: '—', distribution: {A:0,B:0,C:0,D:0,E:0,F:0,G:0}, latestYear: null
      })
    };
  }

  try {
    // Build query
    const params = new URLSearchParams();
    params.set('postcode', pc);
    // API supports fuzzy address matching; we pre-filter in code if needed
    const url = `${base}?${params.toString()}`;
    const { data } = await axios.get(url, { headers });
    const items = Array.isArray(data?.rows || data?.items || data) ? (data.rows || data.items || data) : [];

    // Helper to normalise a record
    const norm = (r) => ({
      address: r.address || r.ADDRESS || r.address1 || '',
      postcode: r.postcode || r.POSTCODE || r.post_code || '',
      rating: (r.currentEnergyRating || r.CURRENT_ENERGY_RATING || r.energyRating || '').toString().trim(),
      assessmentDate: (r.inspectionDate || r.INSPECTION_DATE || r.dateOfAssessment || '').toString().slice(0,10),
      uprn: r.uprn || r.UPRN || r.lmkKey || r.LMK_KEY || null
    });

    const recs = items.map(norm).filter(r => r.postcode && r.rating);

    if (hasNumber) {
      // Property mode -> pick most recent by simple address contains number
      const n = String(number).trim().toUpperCase();
      const candidates = recs.filter(r => (r.address || '').toUpperCase().includes(n));
      const sorted = candidates.sort((a,b)=> (b.assessmentDate||'').localeCompare(a.assessmentDate||''));
      const chosen = sorted[0] || recs.sort((a,b)=> (b.assessmentDate||'').localeCompare(a.assessmentDate||''))[0];
      return {
        mode: 'property',
        rating: chosen?.rating || '—',
        assessmentDate: chosen?.assessmentDate || '—',
        note: candidates.length ? '' : 'Matched by postcode; exact house match not found.'
      };
    } else {
      // Postcode mode -> for each uprn/address, take most recent, then aggregate
      const latestByKey = new Map();
      for (const r of recs) {
        const key = r.uprn || `${r.address}|${r.postcode}`;
        const prev = latestByKey.get(key);
        if (!prev || (r.assessmentDate||'') > (prev.assessmentDate||'')) latestByKey.set(key, r);
      }
      const latest = Array.from(latestByKey.values());
      const propertiesAnalysed = latest.length;

      const bands = {A:0,B:0,C:0,D:0,E:0,F:0,G:0};
      const scores = {A:7,B:6,C:5,D:4,E:3,F:2,G:1};
      let sum = 0, cnt = 0, latestYear = null;
      for (const r of latest) {
        const band = (r.rating || '').trim().charAt(0).toUpperCase();
        if (bands[band] !== undefined) {
          bands[band]++;
          sum += scores[band]; cnt++;
        }
        const y = (r.assessmentDate||'').slice(0,4);
        if (y && (!latestYear || y > latestYear)) latestYear = y;
      }
      const avgScore = cnt ? sum/cnt : null;
      const scoreToBand = (s) => s>=6.5?'A':s>=5.5?'B':s>=4.5?'C':s>=3.5?'D':s>=2.5?'E':s>=1.5?'F':'G';
      const averageRating = avgScore ? scoreToBand(avgScore) : '—';

      return { mode:'postcode', propertiesAnalysed, averageRating, distribution: bands, latestYear };
    }
  } catch (e) {
    return { mode: hasNumber ? 'property' : 'postcode', error: true, message: String(e) };
  }
}
