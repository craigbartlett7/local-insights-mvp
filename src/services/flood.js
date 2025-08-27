// Environment Agency + devolved. For Sprint 1, we call EA 'floods' endpoint (alerts/warnings).
// Long-term flood risk layers will be added via WMS snapshot in Sprint 2.
import axios from 'axios';

export async function getFloodSnapshot(lat, lng) {
  // EA API supports /flood-monitoring/id/stations and /flood-monitoring/id/floods
  // Here we pull current alerts and warnings, then compute nearest distance.
  const url = `https://environment.data.gov.uk/flood-monitoring/id/floods`;
  const { data } = await axios.get(url);
  const items = (data && data.items) || [];
  // Simple nearest status
  let nearest = null;
  let minDist = Infinity;
  for (const f of items) {
    if (!f.floodArea || !f.floodArea.notation || !f.eaAreaName) continue;
    // Use centroid if available (often not). For MVP, just count active items.
  }
  return {
    activeWarnings: items.length,
    note: "Active EA alerts/warnings nationally; detailed local polygons to be mapped in Sprint 2."
  };
}
