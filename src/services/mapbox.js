export function buildStaticMapUrl({ lat, lng, isochrones, overlays }) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;
  const zoom = 14;
  const width = 800, height = 500;
  const marker = `pin-s+285A98(${lng},${lat})`;
  const style = 'light-v11';

  let overlayParts = [marker];
  if (Array.isArray(overlays) && overlays.length && token) {
    try {
      const take = overlays.slice(0, 3);
      for (const feat of take) {
        const fc = { type:'FeatureCollection', features:[feat] };
        const enc = encodeURIComponent(JSON.stringify(fc));
        overlayParts.push(`geojson(${enc})`);
      }
    } catch {}
  }
  const overlayStr = overlayParts.join(',');

  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlayStr}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${token}`;
}
