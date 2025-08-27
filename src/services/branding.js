import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cached;

export function getBranding() {
  if (cached) return cached;
  const name = process.env.BRAND_NAME || 'Proactive Business Group';
  const website = process.env.BRAND_WEBSITE || 'https://proactivebusinessgroup.com';
  const email = process.env.BRAND_EMAIL || 'hello@proactivebusinessgroup.com';
  const phone = process.env.BRAND_PHONE || '';
  const primary = process.env.BRAND_PRIMARY || '#0B1F4D';
  const secondary = process.env.BRAND_SECONDARY || '#B1975B';

  // Try to load /public/brand-logo.png and base64 it for PDF embeds
  let logoDataUri = '';
  try {
    const p = path.join(__dirname, '../../public/brand-logo.png');
    const buf = fs.readFileSync(p);
    const b64 = buf.toString('base64');
    logoDataUri = `data:image/png;base64,${b64}`;
  } catch {}

  cached = { name, website, email, phone, primary, secondary, logoDataUri };
  return cached;
}
