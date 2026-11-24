import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, posix} from 'node:path';

const dist = resolve('dist');
const base = '/Mutta-Puffs-Database/';
const pageFiles = new Map([['./','index.html'],['contribute/','contribute/index.html'],['share/','share/index.html'],['offline/','offline/index.html']]);
const paths = new Set([...pageFiles.keys(),'manifest.webmanifest','icons/puff-192.png','icons/puff-512.png','icons/puff-maskable.png','puff.svg','api/v1/places.json','images/egg-puff.webp']);
for (const file of pageFiles.values()) {
  const html = await readFile(resolve(dist,file),'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith(base + '_astro/')) paths.add(match[1].slice(base.length));
  }
}
for (const asset of paths) {
  if (!asset.startsWith('_astro/') || !/\.(?:js|css)$/.test(asset)) continue;
  const source = await readFile(resolve(dist,asset),'utf8');
  for (const match of source.matchAll(/["'](\.\/[^"']+\.(?:js|woff2?|css))["']/g)) {
    paths.add(posix.join(posix.dirname(asset),match[1]));
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
