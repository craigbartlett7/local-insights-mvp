import axios from 'axios';

export async function getEpcSummary({ postcode, number }) {
  const token = process.env.EPC_API_TOKEN;
  const hasNumber = !!(number && String(number).trim().length);
  if (!token) {
    if (hasNumber) {
      return { mode: 'property', rating: 'C', assessmentDate: '2019-05-12', note: 'Demo placeholder (set EPC_API_TOKEN for live).' };
    } else {
      return {
        mode: 'postcode',
        propertiesAnalysed: 26,
        averageRating: 'C',
        distribution: { A: 1, B: 6, C: 11, D: 6, E: 2, F: 0, G: 0 },
        latestYear: 2024,
        note: 'Demo placeholder (set EPC_API_TOKEN for live).'
      };
    }
  }
  // TODO: Implement live EPC API calls
  if (hasNumber) return { mode: 'property', rating: 'C', assessmentDate: '2021-11-20', note: 'Stub: implement real EPC property lookup.' };
  return {
    mode: 'postcode',
    propertiesAnalysed: 42,
    averageRating: 'C',
    distribution: { A: 2, B: 7, C: 18, D: 11, E: 4, F: 0, G: 0 },
    latestYear: 2024,
    note: 'Stub: implement real EPC postcode aggregation.'
  };
}
