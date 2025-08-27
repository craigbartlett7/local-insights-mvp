// Ofcom Connected Nations API (requires API key).
// For development without a key, return a placeholder structure.
import axios from 'axios';

export async function getBroadbandSnapshot(postcode) {
  const key = process.env.OFCOM_API_KEY;
  if (!key) {
    return { available: ["FTTC","FTTP"], maxDownMbps: 900, maxUpMbps: 110, note: "Demo placeholder (set OFCOM_API_KEY for live)." };
  }
  // Example (pseudo – replace with actual Ofcom endpoint when key is issued)
  // const url = `https://api.ofcom.org.uk/broadband?postcode=${encodeURIComponent(postcode)}&apikey=${key}`;
  // const { data } = await axios.get(url);
  // return normaliseOfcomBroadband(data);
  return { available: ["Unknown"], maxDownMbps: null, maxUpMbps: null };
}
