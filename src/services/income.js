import fs from 'fs';
import path from 'path';

/**
 * Compute average annual household income within 5km using a local CSV:
 * /data/msoa_income.csv with columns: msoa,lat,lng,median_household_income
 * If the file isn't present, returns a helpful note.
 */
export async function getIncomeWithin5km(lat, lng, radiusKm = 5) {
  try {
    const fp = path.join(process.cwd(), 'data', 'msoa_income.csv');
    if (!fs.existsSync(fp)) return { available:false, note:'Provide data/msoa_income.csv (ONS small area income estimates).' };
    const rows = fs.readFileSync(fp, 'utf-8').split(/\r?\n/).filter(Boolean);
    let sum = 0, cnt = 0;
    for (let i=1;i<rows.length;i++){
      const parts = rows[i].split(',');
      if (parts.length < 4) continue;
      const plat = parseFloat(parts[1]), plng = parseFloat(parts[2]);
      const income = parseFloat(parts[3]);
      if (!Number.isFinite(plat) || !Number.isFinite(plng) || !Number.isFinite(income)) continue;
      const d = haversine(lat, lng, plat, plng);
      if (d <= radiusKm) { sum += income; cnt++; }
    }
    if (!cnt) return { available:false, note:'No MSOA centroids within 5km. Check dataset.' };
    return { available:true, radiusKm, averageIncome: Math.round(sum/cnt), pointsUsed: cnt };
  } catch (e) {
    return { available:false, error:true, message:String(e) };
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
function toRad(d){ return d*Math.PI/180; }
