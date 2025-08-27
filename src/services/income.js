import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'msoa_income.csv');
const CSV_BUILTIN = path.join(DATA_DIR, 'ons_mini_income.csv');

const INCOME_SOURCE_URL = process.env.INCOME_SOURCE_URL || 'https://example.com/ons/msoa_income.csv';
const MSOA_CENTROIDS_URL = process.env.MSOA_CENTROIDS_URL || 'https://example.com/ons/msoa_centroids.csv';

function nowIso(){ return new Date().toISOString(); }

async function ensureDataset() {
  if (fs.existsSync(CSV_PATH)) return { ok:true, source:'local', path: CSV_PATH };
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    // Try remote build if URLs provided
    if (!INCOME_SOURCE_URL.includes('example.com') && !MSOA_CENTROIDS_URL.includes('example.com')) {
      const [inc, cen] = await Promise.all([ axios.get(INCOME_SOURCE_URL), axios.get(MSOA_CENTROIDS_URL) ]);
      const out = joinIncomeCentroids(inc.data, cen.data);
      fs.writeFileSync(CSV_PATH, out, 'utf-8');
      return { ok:true, source:'downloaded', path: CSV_PATH };
    }
  } catch (e) {
    console.warn('Income dataset auto-build failed:', e.message);
  }
  // Fall back to built-in mini CSV if present
  if (fs.existsSync(CSV_BUILTIN)) {
    return { ok:true, source:'builtin', path: CSV_BUILTIN };
  }
  return { ok:false };
}

function joinIncomeCentroids(incomeCsv, centCsv){
  const incRows = incomeCsv.trim().split(/\r?\n/);
  const cenRows = centCsv.trim().split(/\r?\n/);
  const incIdx = headerIndex(incRows[0]);
  const cenIdx = headerIndex(cenRows[0]);
  const incMap = new Map();
  for (let i=1;i<incRows.length;i++){
    const cols = splitCsv(incRows[i]);
    const code = cols[incIdx['MSOA21CD']] || cols[incIdx['MSOA11CD']] || cols[incIdx['msoa']] || cols[incIdx['MSOA']];
    const income = parseFloat(cols[incIdx['median_household_income']] || cols[incIdx['MedianHouseholdIncome']] || cols[incIdx['median']]);
    const households = parseFloat(cols[incIdx['households']] || cols[incIdx['Households']] || cols[incIdx['household_count']]);
    if (code && Number.isFinite(income)) incMap.set(code, { income, households: Number.isFinite(households) ? households : null });
  }
  const out = ['msoa,lat,lng,median_household_income,households'];
  for (let i=1;i<cenRows.length;i++){
    const cols = splitCsv(cenRows[i]);
    const code = cols[cenIdx['MSOA21CD']] || cols[cenIdx['MSOA11CD']] || cols[cenIdx['msoa']];
    const lat = parseFloat(cols[cenIdx['lat']] || cols[cenIdx['LAT']] || cols[cenIdx['Y']]);
    const lng = parseFloat(cols[cenIdx['lng']] || cols[cenIdx['LNG']] || cols[cenIdx['X']]);
    const rec = incMap.get(code);
    if (code && Number.isFinite(lat) && Number.isFinite(lng) && rec) {
      out.push(`${code},${lat},${lng},${rec.income},${rec.households ?? ''}`);
    }
  }
  return out.join('\n');
}

function headerIndex(headerLine){
  const headers = splitCsv(headerLine).map(h=>h.trim());
  const idx = {};
  headers.forEach((h,i)=> idx[h]=i);
  return idx;
}
function splitCsv(line){
  return line.split(',');
}

function parseIncomeCsv(fp){
  const rows = fs.readFileSync(fp, 'utf-8').split(/\r?\n/).filter(Boolean);
  const header = rows[0];
  const idx = headerIndex(header);
  const items = [];
  for (let i=1;i<rows.length;i++){
    const cols = splitCsv(rows[i]);
    const lat = parseFloat(cols[idx['lat']]);
    const lng = parseFloat(cols[idx['lng']]);
    const income = parseFloat(cols[idx['median_household_income']]);
    const hh = idx['households']!=null ? parseFloat(cols[idx['households']]) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(income)) {
      items.push({ lat, lng, income, households: Number.isFinite(hh) ? hh : null });
    }
  }
  return items;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
function toRad(d){ return d*Math.PI/180; }

export async function getIncomeWithin5km(lat, lng, radiusKm = 5) {
  try {
    let source = 'fallback', pathUsed = null, freshness = null;
    let datasetInfo = await ensureDataset();
    let fp = null;
    if (datasetInfo.ok) {
      fp = datasetInfo.path;
      source = datasetInfo.source;
      pathUsed = fp;
      try {
        const stat = fs.statSync(fp);
        freshness = stat.mtime.toISOString();
      } catch {}
    }

    if (fp && fs.existsSync(fp)) {
      const items = parseIncomeCsv(fp);
      // find items within radius, or 7.5km fallback if none
      const collect = (rad)=>{
        const picked = [];
        for (const it of items) {
          const d = haversine(lat, lng, it.lat, it.lng);
          if (d <= rad) picked.push(it);
        }
        return picked;
      };
      let within = collect(radiusKm);
      let usedRadius = radiusKm;
      if (!within.length) { within = collect(7.5); usedRadius = 7.5; }
      if (within.length) {
        // Weighted average if households present
        const weighted = within.filter(i => i.households && i.households > 0);
        let avg;
        if (weighted.length) {
          const sw = weighted.reduce((acc, i)=>acc + i.income * i.households, 0);
          const sh = weighted.reduce((acc, i)=>acc + i.households, 0);
          avg = Math.round(sw / (sh || 1));
        } else {
          const s = within.reduce((acc, i)=>acc + i.income, 0);
          avg = Math.round(s / within.length);
        }
        return {
          available:true, radiusKm: usedRadius, averageIncome: avg, pointsUsed: within.length,
          weighted: weighted.length>0, source, freshness
        };
      }
      // Dataset exists but nothing nearby
      return { available:false, note:'No centroids nearby', source, freshness };
    }

    // fallback national median
    return { available:true, radiusKm, averageIncome: 32000, pointsUsed: 1, note:'National median estimate (fallback)', source, freshness: nowIso() };
  } catch (e) {
    return { available:true, radiusKm, averageIncome: 32000, pointsUsed: 1, note:'Fallback due to error: '+String(e), source:'fallback', freshness: nowIso() };
  }
}
