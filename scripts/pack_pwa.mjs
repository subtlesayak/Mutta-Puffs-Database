import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, posix} from 'node:path';
import {locales} from '../src/lib/locales.ts';

const dist = resolve('dist');
const base = '/Mutta-Puffs-Database/';
const languagePages = locales.filter(locale => locale.id !== 'en').map(locale => locale.id + '/');
const offlinePages = ['./','contribute/','share/','offline/','guide/','heritage/','map/','pit-stops/','passport/','wrapped/','roulette/','languages/',
  'cities/',...languagePages.flatMap(route => [route, route + 'cities/', route + 'map/', route + 'contribute/'])];
const pageFiles = new Map(offlinePages.map(route => [route, route === './' ? 'index.html' : route + 'index.html']));
const paths = new Set([...pageFiles.keys(),'manifest.webmanifest','icons/puff-192.png','icons/puff-512.png','icons/puff-maskable.png','puff.svg','api/v1/places.json','api/v1/place-metrics.json','api/v1/places.geojson','api/v1/cities.json','api/v1/trails.json','basemap.pbf','images/egg-puff.webp']);
for (const file of pageFiles.values()) {
  const html = await readFile(resolve(dist,file),'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith(base + '_astro/')) paths.add(match[1].slice(base.length));
  }
}
for (const asset of paths) {
  if (!asset.startsWith('_astro/') || !/\.(?:js|css)$/.test(asset)) continue;
  const source = await readFile(resolve(dist,asset),'utf8');
  for (const match of source.matchAll(/["'`]([./][\w./-]+\.(?:m?js|woff2?|css))["'`]/g)) {
    const target = match[1];
    if (target.startsWith('./')) paths.add(posix.join(posix.dirname(asset),target));
    else if (target.startsWith(base + '_astro/')) paths.add(target.slice(base.length));
  }
  for (const match of source.matchAll(/url\(["']?(\/[^\s"')]+)["']?\)/g)) {
    if (match[1].startsWith(base + '_astro/')) paths.add(match[1].slice(base.length));
  }
}
const worker = await readFile('src/service-worker.js','utf8');
const hash = createHash('sha256').update(worker);
for (const entry of paths) hash.update(await readFile(resolve(dist,pageFiles.get(entry) ?? entry)));
await writeFile(resolve(dist,'sw.js'), 'const CACHE_NAME = ' + JSON.stringify('mpdb-atlas-' + hash.digest('hex').slice(0,12))
  + ';\nconst PRECACHE = ' + JSON.stringify([...paths]) + ';\n' + worker);
