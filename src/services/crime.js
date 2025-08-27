import axios from 'axios';
import dayjs from 'dayjs';

function lastMonthYYYYMM() {
  const d = dayjs().subtract(1, 'month');
  return { year: d.format('YYYY'), month: d.format('MM') };
}

export async function getRecentCrimeSummary(lat, lng) {
  const { year, month } = lastMonthYYYYMM();
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${year}-${month}`;
  const { data } = await axios.get(url);
  const total = Array.isArray(data) ? data.length : 0;
  const byCategory = {};
  if (Array.isArray(data)) {
    for (const c of data) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }
  const top = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return { month: `${year}-${month}`, total, topCategories: top.map(([k,v])=>({category:k, count:v})) };
}
