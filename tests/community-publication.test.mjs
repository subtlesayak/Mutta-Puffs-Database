import assert from 'node:assert/strict';
import test from 'node:test';
import {isPublishedSubmission} from '../server/publication.mjs';

const origin = 'https://subtlesayak.github.io';
const reference = 'https://github.com/subtlesayak/Mutta-Puffs-Database/issues/17';
const canonical = 'mpdb-public12345';
const retired = 'mpdb-retired1234';
const day = '2026-01-02';
const shop = {
  id:canonical,name:'Fixture Puff Shop',source:{kind:'community',reference},
  verification:{reference},photos:[{source:reference}],map_links:{google_maps:'https://maps.example/public'},
};

function fetchFixture({places=[shop],reviews=[],observations=[],aliases={[retired]:canonical}}={}) {
  const fixtures = {'places':{places},'reviews':{reviews},'observations':{observations},'place-aliases':{aliases}};
  return async (url,options) => {
    assert.equal(url.origin,origin);
    assert.equal(options.redirect,'error');
    assert.ok(!options.headers && !options.body);
    const key = /\/api\/v1\/([\w-]+)\.json$/.exec(url.pathname)?.[1];
    assert.ok(fixtures[key]);
    return Response.json({schema_version:1,...fixtures[key]});
  };
}

test('a new place must match its public source, name or map target', async () => {
  const fields = {place_name:'fixture   puff shop',map_link:'https://maps.example/other'};
  assert.equal(await isPublishedSubmission({kind:'place',fields},reference,fetchFixture()),true);
  assert.equal(await isPublishedSubmission({kind:'place',fields:{...fields,place_name:'Unrelated'}},reference,fetchFixture()),false);
  const sameMap = {place_name:'Renamed',map_link:'https://maps.example/public'};
  assert.equal(await isPublishedSubmission({kind:'place',fields:sameMap},reference,fetchFixture()),true);
  assert.equal(await isPublishedSubmission({kind:'place',fields},reference,fetchFixture({
    places:[{...shop,source:{kind:'original_maps_export',reference}}],
  })),false);
});

test('corrections and photos verify against the right section of the published place', async () => {
  const fields = {place_id:retired};
  assert.equal(await isPublishedSubmission({kind:'correction',fields},reference,fetchFixture()),true);
  assert.equal(await isPublishedSubmission({kind:'photo',fields},reference,fetchFixture()),true);
  assert.equal(await isPublishedSubmission({kind:'photo',fields},reference,fetchFixture({places:[{...shop,photos:[]}]})),false);
  assert.equal(await isPublishedSubmission({kind:'correction',fields:{place_id:'mpdb-unrelated'}},reference,fetchFixture()),false);
});

test('reviews and observations require the published place, date and source link', async () => {
  const reviews = [{place_id:canonical,visited_on:day,source:reference}];
  const observations = [{place_id:canonical,observed_on:day,source:reference}];
  const request = fetchFixture({reviews,observations});
  const fields = {place_id:retired,visited_on:day,observed_on:day};
  assert.equal(await isPublishedSubmission({kind:'review',fields},reference,request),true);
  assert.equal(await isPublishedSubmission({kind:'observation',fields},reference,request),true);
  assert.equal(await isPublishedSubmission({kind:'observation',fields:{...fields,observed_on:'2026-01-03'}},reference,request),false);
  assert.equal(await isPublishedSubmission({kind:'review',fields},reference + '0',request),false);
});

test('an invalid public export is an unavailable check rather than publication evidence', async () => {
  const fields = {place_name:'Fixture Puff Shop',map_link:'https://maps.example/public'};
  await assert.rejects(isPublishedSubmission({kind:'place',fields},reference,async () => Response.json({places:[shop]})),/public export/);
});
