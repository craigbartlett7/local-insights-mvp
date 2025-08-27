import axios from 'axios';

/**
 * EPC ODC auth helper:
 * Accepts EPC_API_TOKEN in any of these forms:
 *  A) Base64 token (email:key)  -> EPC_API_TOKEN=base64string
 *  B) Plain combo   (email:key) -> EPC_API_TOKEN="email:key"
 *  C) Raw key only               -> EPC_API_TOKEN=key  AND EPC_EMAIL=email
 * We always send: Authorization: Basic <base64(email:key)>
 */
function buildBasicAuthToken() {
  const raw = (process.env.EPC_API_TOKEN || '').trim();
  const emailEnv = (process.env.EPC_EMAIL || '').trim();

  if (!raw) return null;

  const looksBase64 = /^[A-Za-z0-9+/=]{40,}$/.test(raw) && raw.includes('=');
  if (looksBase64) return raw; // assume already base64

  if (raw.includes(':')) {
    // email:key format
    return Buffer.from(raw, 'utf8').toString('base64');
  }

  if (emailEnv) {
    // raw key + EPC_EMAIL provided
    return Buffer.from(`${emailEnv}:${raw}`, 'utf8').toString('base64');
  }

  // last resort: treat as base64 anyway (won't crash, may 401)
  return raw;
}

/**
 * Parse extremely regular CSV (no embedded commas).
 */
function parseCsv(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h=>h.trim());
  const out = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    const rec = {};
    for (let j=0;j<headers.length;j++){
      rec[headers[j]] = cols[j];
    }
    out.push(rec);
  }
  return out;
}

export async function getEpcSummary({ postcode, number }) {
  const basic = buildBasicAuthToken();
  const base = process.env.EPC_BASE_URL || 'https://epc.opendatacommunities.org/api/v1/domestic/search';
  const hasNumber = !!(number && String(number).trim().length);
  const pc = String(postcode).toUpperCase().replace(/\s+/g,'');

  if (!basic) {
    return { mode: hasNumber ? 'property' : 'postcode', note:'EPC credentials not configured. Set EPC_API_TOKEN (Base64, or email:key), or EPC_API_TOKEN=key + EPC_EMAIL.' };
  }
  try {
    const params = new URLSearchParams();
    params.set('postcode', pc);
    const url = `${base}?${params.toString()}`;
    const headers = {
      'Authorization': `Basic ${basic}`,
      'Accept': 'text/csv'
    };
    const { data: csv } = await axios.get(url, { headers });
    const items = parseCsv(csv);
    // normalise keys
    const recs = items.map(r => ({
      address: r.address || r.ADDRESS || r['ADDRESS1'] || '',
      postcode: r.postcode || r.POSTCODE || '',
      rating: (r.currentEnergyRating || r.CURRENT_ENERGY_RATING || r['CURRENT ENERGY RATING'] || '').toString().trim(),
      assessmentDate: (r.inspectionDate || r.INSPECTION_DATE || r['INSPECTION_DATE'] || r.dateOfAssessment || '').toString().slice(0,10),
      uprn: r.uprn || r.UPRN || r.LMK_KEY || null
    })).filter(r => r.postcode);

    if (hasNumber) {
      const n = String(number).trim().toUpperCase();
      const candidates = recs.filter(r => (r.address || '').toUpperCase().includes(n));
      const sorted = candidates.sort((a,b)=> (b.assessmentDate||'').localeCompare(a.assessmentDate||''));
      const chosen = sorted[0];
      if (chosen) {
        return { mode:'property', rating: chosen.rating || '—', assessmentDate: chosen.assessmentDate || '—', note: candidates.length? '' : 'Matched by postcode only' };
      }
      // Fallback: show best in postcode
      const best = recs.sort((a,b)=> (b.assessmentDate||'').localeCompare(a.assessmentDate||''))[0];
      return { mode:'property', rating: best?.rating || '—', assessmentDate: best?.assessmentDate || '—', note:'Exact house not found; showing most recent in postcode' };
    } else {
      const latestBy = new Map();
      for (const r of recs) {
        const key = r.uprn || `${r.address}|${r.postcode}`;
        const prev = latestBy.get(key);
        if (!prev || (r.assessmentDate||'') > (prev.assessmentDate||'')) latestBy.set(key, r);
      }
      const latest = Array.from(latestBy.values());
      const bands = {A:0,B:0,C:0,D:0,E:0,F:0,G:0};
      const scores = {A:7,B:6,C:5,D:4,E:3,F:2,G:1};
      let sum=0,cnt=0,latestYear=null;
      for (const r of latest) {
        const band = (r.rating||'').charAt(0).toUpperCase();
        if (bands[band]!=null) { bands[band]++; sum += scores[band]; cnt++; }
        const y = (r.assessmentDate||'').slice(0,4);
        if (y && (!latestYear || y > latestYear)) latestYear = y;
      }
      const avg = cnt? sum/cnt : null;
      const bandOf = s=> s>=6.5?'A':s>=5.5?'B':s>=4.5?'C':s>=3.5?'D':s>=2.5?'E':s>=1.5?'F':'G';
      return { mode:'postcode', propertiesAnalysed: latest.length, distribution: bands, averageRating: avg? bandOf(avg): '—', latestYear };
    }
  } catch (e) {
    return { mode: hasNumber ? 'property' : 'postcode', error: true, message: String(e.response?.status || '') + ' ' + String(e.message || e) };
  }
}
