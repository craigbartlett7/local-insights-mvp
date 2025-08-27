import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGeoForPostcode } from './services/postcode.js';
import { getRecentCrimeSummary } from './services/crime.js';
import { getFloodSnapshot } from './services/flood.js';
import { getBroadbandSnapshot } from './services/broadband.js';
import { getMobileSnapshot } from './services/mobile.js';
import { getEpcSummary } from './services/epc.js';
import { getSchoolsSummary } from './services/schools.js';
import { generatePdfReport } from './pdf/generate.js';

dotenv.config();
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function buildPanels(geo, postcode, number) {
  const [crime, flood, broadband, mobile, epc, schools] = await Promise.all([
    getRecentCrimeSummary(geo.latitude, geo.longitude).catch(()=>null),
    getFloodSnapshot(geo.latitude, geo.longitude).catch(()=>null),
    getBroadbandSnapshot(postcode).catch(()=>null),
    getMobileSnapshot(postcode).catch(()=>null),
    getEpcSummary({ postcode, number }).catch(()=>null),
    getSchoolsSummary(geo).catch(()=>null)
  ]);
  return { crime, flood, broadband, mobile, epc, schools };
}

// Example: /api/preview?postcode=SW1A1AA&number=10
app.get('/api/preview', async (req, res) => {
  try {
    const { postcode, number } = req.query;
    if (!postcode) return res.status(400).json({ error: 'postcode required' });
    const geo = await getGeoForPostcode(String(postcode));
    const panels = await buildPanels(geo, String(postcode), number ? String(number) : undefined);
    res.json({ input: { postcode, number: number || null }, geo, panels });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'preview_failed', details: String(e) });
  }
});

// Example: /api/report.pdf?postcode=SW1A1AA&number=10
app.get('/api/report.pdf', async (req, res) => {
  try {
    const { postcode, number } = req.query;
    if (!postcode) return res.status(400).json({ error: 'postcode required' });
    const geo = await getGeoForPostcode(String(postcode));
    const panels = await buildPanels(geo, String(postcode), number ? String(number) : undefined);
    const pdfBuffer = await generatePdfReport({ postcode, number: number || null, geo, panels });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="local-insights-${postcode}${number?('-'+number):''}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'report_failed', details: String(e) });
  }
});

// Serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Local Insights MVP running on http://localhost:${port}`));
