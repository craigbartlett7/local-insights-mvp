export function buildStaticMapUrl({ lat, lng, isochrones }) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;
  const zoom = 14;
  const width = 800, height = 500;
  const marker = `pin-s+285A98(${lng},${lat})`;
  const style = 'light-v11';
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${marker}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${token}`;
}
