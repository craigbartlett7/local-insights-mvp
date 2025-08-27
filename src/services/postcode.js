import axios from 'axios';

export async function getGeoForPostcode(postcode) {
  const pc = String(postcode).replace(/\s+/g, '');
  const url = `https://api.postcodes.io/postcodes/${pc}`;
  const { data } = await axios.get(url);
  if (!data || data.status !== 200) throw new Error('Postcode not found');
  const d = data.result;
  return {
    postcode: d.postcode,
    latitude: d.latitude,
    longitude: d.longitude,
    lsoa: d.lsoa,
    msoa: d.msoa,
    admin_ward: d.admin_ward,
    country: d.country
  };
}
