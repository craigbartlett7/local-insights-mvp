// EPC hybrid: if number+postcode -> property; else aggregated postcode context.
// Live API requires EPC_API_TOKEN (Bearer). This file returns placeholders if token missing.
import axios from 'axios';

function ratingToScore(letter) {
  const order = ['G','F','E','D','C','B','A'];
  const idx = order.indexOf(String(letter||'').toUpperCase());
  if (idx === -1) return null;
  return 7 - idx;
}
function scoreToLetter(scoreAvg) {
  if (scoreAvg == null) return null;
  const thresholds = [6.5,'A',5.5,'B',4.5,'C',3.5,'D',2.5,'E',1.5,'F',0,'G'];
  for (let i=0;i<thresholds.length;i+=2){
    if (scoreAvg >= thresholds[i]) return thresholds[i+1];
  }
  return 'G';
}

export async function getEpcSummary({ postcode, number }) {
  const token = process.env.EPC_API_TOKEN;
  const compactPostcode = String(postcode).replace(/\s+/g,'');
  const hasNumber = !!(number && String(number).trim().length);

  if (!token) {
    if (hasNumber) {
      return { mode: 'property', rating: 'C', assessmentDate: '2019-05-12', note: 'Demo placeholder (set EPC_API_TOKEN for live).' };
    } else {
      return {
        mode: 'postcode',
        sample: true,
        propertiesAnalysed: 26,
        averageRating: 'C',
        distribution: { A: 1, B: 6, C: 11, D: 6, E: 2, F: 0, G: 0 },
        latestYear: 2024,
        note: 'Demo placeholder (set EPC_API_TOKEN for live).'
      };
    }
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    if (hasNumber) {
      // TODO: implement real EPC property query (filter by address within postcode)
      return { mode: 'property', rating: 'C', assessmentDate: '2021-11-20', note: 'Stub: implement real EPC property lookup.' };
    } else {
      // TODO: implement real EPC postcode aggregation using EPC API
      return {
        mode: 'postcode',
        propertiesAnalysed: 42,
        averageRating: 'C',
        distribution: { A: 2, B: 7, C: 18, D: 11, E: 4, F: 0, G: 0 },
        latestYear: 2024,
        note: 'Stub: implement real EPC postcode aggregation.'
      };
    }
  } catch (e) {
    return { mode: hasNumber ? 'property' : 'postcode', error: true, message: String(e) };
  }
}
