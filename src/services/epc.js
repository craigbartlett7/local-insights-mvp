// EPC Open Data Communities API (token required).
import axios from 'axios';

export async function getEpcSummary(postcode) {
  const token = process.env.EPC_API_TOKEN;
  if (!token) return { rating: "C", lastAssessment: "2019", note: "Demo placeholder (set EPC_API_TOKEN for live)." };
  // Example pseudo-request; replace with the official EPC endpoint you register for.
  // const url = `https://epc.opendatacommunities.org/api/proxy/…?postcode=${encodeURIComponent(postcode)}`;
  // const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  // return normaliseEpc(data);
  return { rating: null, lastAssessment: null };
}
