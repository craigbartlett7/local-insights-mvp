import axios from 'axios';

/**
 * Finds nearest river level station (Environment Agency) and summarises recent readings.
 */
export async function getRiverLevelTrend(lat, lng) {
  try {
    // Find nearest station with river level measures
    const stationsUrl = `https://environment.data.gov.uk/flood-monitoring/id/stations?lat=${lat}&long=${lng}&dist=20`;
    const { data: stdata } = await axios.get(stationsUrl);
    const stations = stdata?.items || [];
    const withMeasure = stations.filter(s => (s.measures||[]).length);
    if (!withMeasure.length) return { available:false, note:'No stations nearby' };
    const station = withMeasure[0];
    const measure = (station.measures||[]).find(m => (m.parameter || m.label || '').toLowerCase().includes('level') || (m.parameter || '').toLowerCase().includes('stage')) || station.measures[0];
    const readingsUrl = `${measure['@id']}/readings?since=PT168H`; // last 7 days
    const { data: rdata } = await axios.get(readingsUrl);
    const readings = rdata?.items || [];
    if (!readings.length) return { available:false, note:'No recent readings' };
    const first = readings[0].value, last = readings[readings.length-1].value;
    const change = last - first;
    return { available:true, station: station.label, unit: measure.unitName || 'm', first, last, change, count: readings.length };
  } catch (e) {
    return { available:false, error:true, message:String(e) };
  }
}
