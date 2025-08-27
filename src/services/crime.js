import axios from 'axios';
import dayjs from 'dayjs';

function monthKeys(n=12){
  const out = [];
  for (let i=n; i>=1; i--) {
    const d = dayjs().subtract(i, 'month');
    out.push(d.format('YYYY-MM'));
  }
  return out;
}

export async function getRecentCrimeSummary(lat, lng) {
  const last = dayjs().subtract(1,'month').format('YYYY-MM');
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${last}`;
  const { data } = await axios.get(url);
  const total = Array.isArray(data) ? data.length : 0;
  const byCategory = {};
  if (Array.isArray(data)) {
    for (const c of data) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }
  const top = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return { month: last, total, topCategories: top.map(([k,v])=>({category:k, count:v})) };
}

export async function getCrimeYearSummary(lat, lng) {
  const months = monthKeys(12);
  const series = [];
  let totalYear = 0;
  for (const m of months) {
    try {
      const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${m}`;
      const { data } = await axios.get(url);
      const count = Array.isArray(data) ? data.length : 0;
      series.push({ month: m, count });
      totalYear += count;
    } catch {
      series.push({ month: m, count: null });
    }
  }
  return { months: series, totalYear };
}
