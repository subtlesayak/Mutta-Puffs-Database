export function distanceKm(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad / 2;
  const dLon = (b[1] - a[1]) * rad / 2;
  const arc = Math.sin(dLat) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon) ** 2;
  return 12_742 * Math.asin(Math.min(1, Math.sqrt(arc)));
}

export function browserPosition(gps: Pick<Geolocation, 'getCurrentPosition'>) {
  return new Promise<[number, number]>((resolve, reject) => {
    gps.getCurrentPosition(({coords}) => resolve([coords.latitude, coords.longitude]), reject, {
      timeout: 10_000,
      maximumAge: 60_000,
    });
  });
}
