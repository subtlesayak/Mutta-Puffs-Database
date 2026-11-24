export interface SharedPayload {title?: unknown; text?: unknown; url?: unknown}

const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
const knownMaps = new Set(['maps.app.goo.gl','maps.google.com','maps.apple.com','www.openstreetmap.org','openstreetmap.org','osm.org']);

function publicLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.') ? url : null;
  } catch {return null;}
}

export function pinLink(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return '';
  return 'https://www.google.com/maps/search/?' + new URLSearchParams({api:'1',query:lat.toFixed(6) + ',' + lon.toFixed(6)});
}

export function contributionDraft(payload: SharedPayload) {
  const text = clean(payload.text,2000);
  const sharedUrl = clean(payload.url,650);
  const title = clean(payload.title,200);
  const all = [sharedUrl,text,title].join('\n');
  const geo = all.match(/\bgeo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  const links = [...all.matchAll(/https:\/\/[^\s<>"]+/g)].map(match => match[0].replace(/[),.;\]]+$/,''));
  const accepted = links.map(publicLink).filter((url): url is URL => Boolean(url));
  const map = accepted.find(url => knownMaps.has(url.hostname) ||
    (url.hostname === 'www.google.com' && url.pathname.startsWith('/maps')) ||
    (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps')));
  const link = map?.href || (geo ? pinLink(Number(geo[1]),Number(geo[2])) : '') || accepted[0]?.href || '';
  const details = text.replace(/https:\/\/[^\s<>"]+/g,'').replace(/\bgeo:[^\s]+/ig,'').trim().slice(0,1000);
  return {name: publicLink(title) || title.startsWith('geo:') ? '' : title, link, details};
}
