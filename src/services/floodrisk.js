import axios from 'axios';

/**
 * Attempts to fetch baseline flood risk polygons near a point using an EA WFS/ArcGIS service.
 * If unavailable, returns a simple circle overlay and 'Unknown' level.
 * Output:
 *  { level: 'Low'|'Medium'|'High'|'Unknown', overlays: [Feature], note? }
 */
export async function getBaselineFloodRisk(lat, lng) {
  const wfs = process.env.EA_FLOOD_WFS_URL || ''; // optional override
  try {
    if (wfs && !wfs.includes('example.com')) {
      // Generic ArcGIS Query (FeatureServer/Layer/0/query)
      // Expecting an ArcGIS REST endpoint with geometry & outFields
      const url = `${wfs}?f=geojson&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true`;
      const { data } = await axios.get(url);
      const fc = data; // GeoJSON FeatureCollection
      const overlays = Array.isArray(fc?.features) ? fc.features : [];
      let level = 'Unknown';
      for (const f of overlays) {
        const props = f.properties || {};
        const risk = (props.risk || props.RISK || props.prob_4band || '').toString().toLowerCase();
        if (risk.includes('high') || risk.includes('zone 3')) { level = 'High'; break; }
        if (risk.includes('medium') || risk.includes('zone 2')) { level = (level==='Unknown') ? 'Medium' : level; }
        if (risk.includes('low')) { if (level==='Unknown') level='Low'; }
      }
      return { level, overlays };
    }
  } catch (e) {
    // fall through to circle overlay
  }
  // Fallback: simple 400m radius circle polygon around point (visual cue only)
  const circle = circlePolygon([lng, lat], 0.4, 48);
  return { level: 'Unknown', overlays: [circle], note: 'EA flood risk layer not configured; showing vicinity circle.' };
}

function circlePolygon([lng, lat], radiusKm=0.4, steps=48){
  const coords = [];
  for (let i=0; i<=steps; i++){
    const brng = (i/steps) * 2*Math.PI;
    const p = destPoint(lat, lng, radiusKm, brng);
    coords.push([p.lng, p.lat]);
  }
  return { type:'Feature', properties:{ kind:'vicinity' }, geometry:{ type:'Polygon', coordinates:[coords] } };
}

function destPoint(lat, lng, distKm, bearingRad){
  const R=6371;
  const δ=distKm/R;
  const φ1=toRad(lat), λ1=toRad(lng);
  const φ2 = Math.asin(Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(bearingRad));
  const λ2 = λ1 + Math.atan2(Math.sin(bearingRad)*Math.sin(δ)*Math.cos(φ1), Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));
  return { lat: toDeg(φ2), lng: toDeg(λ2) };
}
function toRad(d){ return d*Math.PI/180; }
function toDeg(r){ return r*180/Math.PI; }
