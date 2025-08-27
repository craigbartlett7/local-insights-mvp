import axios from 'axios';

export async function getBroadbandSnapshot(postcode) {
  const key = process.env.OFCOM_API_KEY;
  if (!key) {
    return { available: ["FTTC","FTTP"], maxDownMbps: 900, maxUpMbps: 110, note: "Demo placeholder (set OFCOM_API_KEY for live)." };
  }
  // TODO: Implement Ofcom API call
  return { available: ["Unknown"], maxDownMbps: null, maxUpMbps: null, note: "Ofcom integration pending" };
}
