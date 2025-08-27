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
    .map { margin-top: 8px; border:1px solid #ddd; border-radius: 8px; overflow: hidden; }
  </style>
`;

function row(k,v){ return `<tr><td>${k}</td><td>${v ?? '—'}</td></tr>`; }

function epcSection(epc){
  if (!epc) return '<p>EPC: No data</p>';
  if (epc.mode === 'property') {
    return `
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        ${row('Mode', 'Specific property')}
        ${row('Latest rating', epc.rating || 'N/A')}
        ${row('Last assessment', epc.assessmentDate || 'N/A')}
        ${row('Note', epc.note || '—')}
      </table>
    `;
  } else if (epc.mode === 'postcode') {
    const dist = epc.distribution || {};
    const distRows = ['A','B','C','D','E','F','G'].map(k=>`<tr><td>${k}</td><td>${dist[k] ?? 0}</td></tr>`).join('');
    return `
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        ${row('Mode', 'Postcode context')}
        ${row('Average rating', epc.averageRating || 'N/A')}
        ${row('Properties analysed', epc.propertiesAnalysed || 'N/A')}
        ${row('Latest certificate year', epc.latestYear || 'N/A')}
        ${row('Note', epc.note || '—')}
      </table>
      <div style="height:8px"></div>
      <table>
        <tr><th>EPC Band</th><th>Count</th></tr>
        ${distRows}
      </table>
    `;
  }
  return `<p>EPC: Unknown mode</p>`;
}

function accessibilitySection(iso) {
  if (!iso || !iso.available) return '<p class="small">Accessibility: No ORS key / not available.</p>';
  const walk = iso.items.find(i=>i.label==='walk_15');
  const drive = iso.items.find(i=>i.label==='drive_30');
  const a = (ok)=> ok ? '✓' : '—';
  return `
    <table>
      <tr><th>Mode</th><th>Coverage</th></tr>
      <tr><td>Walk (15 min)</td><td>${a(walk?.ok)}</td></tr>
      <tr><td>Drive (30 min)</td><td>${a(drive?.ok)}</td></tr>
    </table>
  `;
}

function htmlMap(panels){
  if (!panels.mapImageUrl) return '<p class="small">Map: Provide MAPBOX_TOKEN to enable static map.</p>';
  return `<div class="map"><img src="${panels.mapImageUrl}" style="width:100%; height:auto;" alt="Map snapshot"/></div>`;
}

function htmlTemplate({ postcode, number, geo, panels }) {
  const crimeRows = (panels.crime?.topCategories || []).map(c=>`<tr><td>${c.category}</td><td>${c.count}</td></tr>`).join('');
  const schoolsRows = (panels.schools?.nearest || []).map(s=>`<tr><td>${s.name}</td><td>${s.ofsted}</td><td>${s.distanceKm} km</td></tr>`).join('');
  const mobileRows = (panels.mobile?.mnos || []).map(m=>`<tr><td>${m.name}</td><td>${m.indoor4G||'—'}</td><td>${m.outdoor5G||'—'}</td></tr>`).join('');
  const broadband = panels.broadband || {};
  const flood = panels.flood || {};
  const epc = panels.epc || {};
  const iso = panels.isochrones || {};

  return `
    <!doctype html>
    <html><head><meta charset="utf-8">${style}</head>
    <body>
      <h1>Local Insights Report</h1>
      <div class="small">Postcode: ${postcode} ${number?(' | Number/Name: '+number):''}</div>

      <h2>Location Map</h2>
      ${htmlMap(panels)}

      <h2>Executive Snapshot</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        ${row('Crime last month', (panels.crime?.total ?? 'N/A') + ' incidents')}
        ${row('Flood status (live alerts)', flood.activeWarnings!=null ? `${flood.activeWarnings} active in England` : 'N/A')}
        ${row('Broadband (max down/up)', (broadband.maxDownMbps? broadband.maxDownMbps+' / '+(broadband.maxUpMbps||'—')+' Mbps' : 'N/A'))}
        ${row('Mobile coverage (summary)', mobileRows ? 'See table below' : 'N/A')}
        ${row('EPC mode', epc.mode || 'N/A')}
        ${row('LSOA', geo.lsoa || '—')}
      </table>

      <h2>Accessibility (Isochrones)</h2>
      ${accessibilitySection(iso)}

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

      <h2>EPC</h2>
      ${epcSection(epc)}

      <h2>Schools (nearest)</h2>
      <table>
        <tr><th>Name</th><th>Ofsted</th><th>Distance</th></tr>
        ${schoolsRows || '<tr><td colspan="3">N/A</td></tr>'}
      </table>

      <p class="small">Sources: postcodes.io, data.police.uk, Environment Agency, Ofcom (pending), EPC ODC, ORS, Mapbox.</p>
    </body></html>
  `;
}

export async function generatePdfReport(data) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ]
    });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate(data), { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return pdf;
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
  }
}

export { htmlTemplate };
