import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Safe imports of services with graceful fallbacks ---
async function tryImport(p) {
  try { return (await import(p)); } catch { return {}; }
}

const mapbox = await tryImport('./services/mapbox.js');
const geoSvc = await tryImport('./services/geo.js');
const crimeSvc = await tryImport('./services/crime.js');
const floodSvc = await tryImport('./services/flood.js');
const broadbandSvc = await tryImport('./services/broadband.js');
const mobileSvc = await tryImport('./services/mobile.js');
const epcSvc = await tryImport('./services/epc.js');
const schoolsSvc = await tryImport('./services/schools.js');
const isoSvc = await tryImport('./services/isochrones.js');
const airSvc = await tryImport('./services/air.js');
const riverSvc = await tryImport('./services/river.js');
const incomeSvc = await tryImport('./services/income.js');
const floodBaseSvc = await tryImport('./services/floodrisk.js');
const envSvc = await tryImport('./services/environment.js');
const pdfGen = await tryImport('./pdf/generate.js');

// Minimal geo lookup using postcodes.io if no geo service exists
async function lookupGeo(postcode) {
  if (geoSvc.lookupPostcode) return await geoSvc.lookupPostcode(postcode);
  // fallback via postcodes.io
  try {
    const pc = String(postcode).trim();
    const { data } = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const r = data?.result;
    return r ? {
      latitude: r.latitude, longitude: r.longitude,
      lsoa: r.lsoa, msoa: r.msoa, country: r.country, admin_district: r.admin_district
    } : null;
  } catch {
    return null;
  }
}

async function buildPanels(geo, postcode, number) {
  // parallel calls with fallbacks
  const tasks = [];
  tasks.push(crimeSvc.getRecentCrimeSummary ? crimeSvc.getRecentCrimeSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(floodSvc.getCurrentFloodSummary ? floodSvc.getCurrentFloodSummary().catch(()=>null) : Promise.resolve(null));
  tasks.push(broadbandSvc.getBroadbandSummary ? broadbandSvc.getBroadbandSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(mobileSvc.getMobileSummary ? mobileSvc.getMobileSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(epcSvc.getEpcSummary ? epcSvc.getEpcSummary({ postcode, number }).catch(()=>null) : Promise.resolve(null));
  tasks.push(schoolsSvc.getSchoolsSummary ? schoolsSvc.getSchoolsSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(isoSvc.getIsochronesSummary ? isoSvc.getIsochronesSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(crimeSvc.getCrimeYearSummary ? crimeSvc.getCrimeYearSummary(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(airSvc.getAirQuality ? airSvc.getAirQuality(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(riverSvc.getRiverLevelTrend ? riverSvc.getRiverLevelTrend(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(riverSvc.getRiverLevelYear ? riverSvc.getRiverLevelYear(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(incomeSvc.getIncomeWithin5km ? incomeSvc.getIncomeWithin5km(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(floodBaseSvc.getBaselineFloodRisk ? floodBaseSvc.getBaselineFloodRisk(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(envSvc.getBathingWater ? envSvc.getBathingWater(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));
  tasks.push(envSvc.getCatchmentStatus ? envSvc.getCatchmentStatus(geo.latitude, geo.longitude).catch(()=>null) : Promise.resolve(null));

  const [
    crime, flood, broadband, mobile, epc, schools, isochrones,
    crimeYear, air, river, riverYear, income, floodBase, bathing, catchment
  ] = await Promise.all(tasks);

  const mapImageUrl = mapbox.buildStaticMapUrl ? mapbox.buildStaticMapUrl({
    lat: geo.latitude, lng: geo.longitude, isochrones, overlays: floodBase?.overlays || []
  }) : null;

  return { crime, flood, broadband, mobile, epc, schools, mapImageUrl, isochrones,
           crimeYear, air, river, riverYear, income, floodBase, bathing, catchment };
}

// API: preview JSON
app.get('/api/preview', async (req, res) => {
  try {
    const { postcode, number } = req.query;
    if (!postcode) return res.status(400).json({ error: 'postcode is required' });
    const geo = await lookupGeo(postcode);
    if (!geo) return res.status(404).json({ error: 'postcode not found' });
    const panels = await buildPanels(geo, postcode, number);
    res.json({ postcode, number, geo, panels });
  } catch (e) {
    console.error('preview error', e);
    res.status(500).json({ error: 'internal_error', message: String(e) });
  }
});

// API: report.html
app.get('/api/report.html', async (req, res) => {
  try {
    const { postcode, number } = req.query;
    if (!postcode) return res.status(400).send('postcode is required');
    const geo = await lookupGeo(postcode);
    if (!geo) return res.status(404).send('postcode not found');
    const panels = await buildPanels(geo, postcode, number);
    const html = pdfGen.htmlTemplate ? pdfGen.htmlTemplate({ postcode, number, geo, panels })
               : `<html><body><h1>Local Insights</h1><pre>${JSON.stringify({ postcode, number, geo, panels }, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('report.html error', e);
    res.status(500).send('internal_error');
  }
});

// API: report.pdf
app.get('/api/report.pdf', async (req, res) => {
  try {
    const { postcode, number } = req.query;
    if (!postcode) return res.status(400).send('postcode is required');
    const geo = await lookupGeo(postcode);
    if (!geo) return res.status(404).send('postcode not found');
    const panels = await buildPanels(geo, postcode, number);
    if (!pdfGen.generatePdfReport) return res.status(501).send('PDF generator not available');
    const pdf = await pdfGen.generatePdfReport({ postcode, number, geo, panels });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="local-insights-${postcode}.pdf"`);
    res.send(pdf);
  } catch (e) {
    console.error('report.pdf error', e);
    res.status(500).send('internal_error');
  }
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Local Insights MVP running on http://0.0.0.0:${port}`);
});

process.on('unhandledRejection', (r) => console.error('UnhandledRejection:', r));
process.on('uncaughtException', (e) => console.error('UncaughtException:', e));
