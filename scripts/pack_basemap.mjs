import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {decode, encode} from 'geobuf';
import {PbfReader, PbfWriter} from 'pbf';

const source = new URL('../public/basemap.geojson',import.meta.url);
const output = new URL('basemap.pbf',source);
const geojson = JSON.parse(await readFile(source,'utf8'),(_key,value) => Object.is(value,-0) ? 0 : value);
const bytes = encode(geojson,new PbfWriter());
assert.deepEqual(decode(new PbfReader(bytes)),geojson,'The compact basemap must preserve the atlas outlines.');
await writeFile(output,bytes);
