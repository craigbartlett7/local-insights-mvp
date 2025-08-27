import puppeteer from 'puppeteer';

const style = `
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 32px; color:#1b1f23; }
    h1 { color:#0B1F4D; margin-bottom: 4px; }
    h2 { color:#B1975B; margin-top: 24px; }
    table { border-collapse: collapse; width:100%; margin-top:8px; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background:#0B1F4D; color:#fff; text-align:left;}
    .small { color:#666; font-size:12px; }
  </style>
`;

function row(k,v){ return `<tr><td>${k}</td><td>${v ?? '—'}</td></tr>`; }

function htmlTemplate({ postcode, geo, panels }) {
  const crimeRows = (panels.crime?.topCategories || []).map(c=>`<tr><td>${c.category}</td><td>${c.count}</td></tr>`).join('');
  const schoolsRows = (panels.schools?.nearest || []).map(s=>`<tr><td>${s.name}</td><td>${s.ofsted}</td><td>${s.distanceKm} km</td></tr>`).join('');
  const mobileRows = (panels.mobile?.mnos || []).map(m=>`<tr><td>${m.name}</td><td>${m.indoor4G||'—'}</td><td>${m.outdoor5G||'—'}</td></tr>`).join('');
  const broadband = panels.broadband || {};
  const flood = panels.flood || {};

  return `
    <!doctype html>
    <html><head><meta charset="utf-8">${style}</head>
    <body>
      <h1>Local Insights Report</h1>
      <div class="small">Postcode: ${postcode}</div>

      <h2>Executive Snapshot</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        ${row('Crime last month', (panels.crime?.total ?? 'N/A') + ' incidents')}
        ${row('Flood status (live alerts)', flood.activeWarnings!=null ? `${flood.activeWarnings} active in England` : 'N/A')}
        ${row('Broadband (max down/up)', (broadband.maxDownMbps? broadband.maxDownMbps+' / '+(broadband.maxUpMbps||'—')+' Mbps' : 'N/A'))}
        ${row('Mobile coverage (summary)', mobileRows ? 'See table below' : 'N/A')}
        ${row('Nearest schools (top 3)', (panels.schools?.nearest?.length || 0) + ' listed below')}
        ${row('EPC (latest known)', panels.epc?.rating ? `Rating ${panels.epc.rating}` : 'N/A')}
        ${row('LSOA', geo.lsoa || '—')}
      </table>

      <h2>Crime & Safety</h2>
      <div class="small">Month: ${panels.crime?.month || '—'}</div>
      <table>
        <tr><th>Category</th><th>Count</th></tr>
        ${crimeRows || '<tr><td colspan="2">No data</td></tr>'}
      </table>

      <h2>Flood & Environmental</h2>
      <table>
        <tr><th>Indicator</th><th>Value</th></tr>
        ${row('Active EA alerts/warnings (England)', flood.activeWarnings ?? 'N/A')}
        ${row('Note', flood.note || 'Baseline risk map to be added in Sprint 2')}
      </table>

      <h2>Connectivity</h2>
      <table>
        <tr><th>Available tech</th><th>Max down</th><th>Max up</th></tr>
        <tr><td>${(broadband.available || []).join(', ')||'—'}</td><td>${broadband.maxDownMbps ?? '—'}</td><td>${broadband.maxUpMbps ?? '—'}</td></tr>
      </table>
      <div style="height:8px"></div>
      <table>
        <tr><th>MNO</th><th>Indoor 4G</th><th>Outdoor 5G</th></tr>
        ${mobileRows || '<tr><td colspan="3">N/A</td></tr>'}
      </table>

      <h2>Schools (nearest)</h2>
      <table>
        <tr><th>Name</th><th>Ofsted</th><th>Distance</th></tr>
        ${schoolsRows || '<tr><td colspan="3">N/A</td></tr>'}
      </table>

      <h2>EPC Summary</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        ${row('Latest rating', panels.epc?.rating || 'N/A')}
        ${row('Last assessment', panels.epc?.lastAssessment || 'N/A')}
      </table>

      <p class="small">Sources (to be piped live): postcodes.io, data.police.uk, environment.data.gov.uk, Ofcom APIs, epc.opendatacommunities.org, GIAS/Ofsted. This is Sprint 1 scaffold; some data are placeholders until keys are added.</p>
    </body></html>
  `;
}

export async function generatePdfReport(data) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlTemplate(data), { waitUntil: 'load' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
}
