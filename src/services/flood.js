import axios from 'axios';

export async function getFloodSnapshot(lat, lng) {
  const url = `https://environment.data.gov.uk/flood-monitoring/id/floods`;
  const { data } = await axios.get(url);
  const items = (data && data.items) || [];
  return {
    activeWarnings: items.length,
    note: "Active EA alerts/warnings nationally; detailed local polygons to be mapped in Sprint 2."
  };
}
