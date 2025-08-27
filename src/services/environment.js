import axios from 'axios';

/** Bathing water quality (nearest) using EA endpoints (graceful fallback) */
export async function getBathingWater(lat, lng) {
  try {
    // Example endpoint (may vary): find nearby bathing waters and latest classification
    const url = `https://environment.data.gov.uk/bathing-water/id/bathing-water?lat=${lat}&long=${lng}&dist=30`;
    const { data } = await axios.get(url);
    const items = data?.items || [];
    if (!items.length) return { available:false, note:'No bathing waters within 30km' };
    const site = items[0];
    // Fetch profile/classification if available
    let classif = null;
    try {
      const profUrl = site['@id'] + '/latest-classification';
      const { data: cdata } = await axios.get(profUrl);
      classif = cdata?.items?.[0]?.classification || null;
    } catch {}
    return {
      available:true,
      name: site.label || site.name,
      classification: classif || 'Unknown',
      distanceKm: approxDistKm(lat, lng, site.lat || site.latitude, site.long || site.longitude)
    };
  } catch (e) {
    return { available:false, note:'Bathing water API unavailable' };
  }
}

/** Catchment status (nearest water body) via CDE (graceful fallback) */
export async function getCatchmentStatus(lat, lng) {
  try {
    // Example endpoint (may vary): nearest water bodies with overall status
    const url = `https://environment.data.gov.uk/catchment-planning/WaterBody/nearest?lat=${lat}&lng=${lng}`;
    const { data } = await axios.get(url);
    const items = data?.items || data?.waterBodies || [];
    if (!items.length) return { available:false, note:'No water body nearby' };
    const wb = items[0];
    return {
      available:true,
      name: wb.name || wb.shortName || 'Water body',
      status: wb.overallStatus || wb.classification || 'Unknown',
      cycle: wb.classificationCycle || wb.cycle || ''
    };
  } catch (e) {
    return { available:false, note:'Catchment Data Explorer API unavailable' };
  }
}

function approxDistKm(lat1,lng1,lat2,lng2){
  if (lat2==null || lng2==null) return null;
  const R=6371;
  const toRad = d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))*10)/10;
}
