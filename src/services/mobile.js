import axios from 'axios';

export async function getMobileSnapshot(postcode) {
  const key = process.env.OFCOM_API_KEY;
  if (!key) return { mnos: [], note: "Demo placeholder (set OFCOM_API_KEY for live)." };
  // TODO: Implement Ofcom Mobile Coverage API call
  return {
    mnos: [
      { name: "EE", indoor4G: "High", outdoor5G: "Medium" },
      { name: "O2", indoor4G: "Medium", outdoor5G: "Low" }
    ]
  };
}
