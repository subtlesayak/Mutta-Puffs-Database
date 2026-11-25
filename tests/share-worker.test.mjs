import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

const scope = 'https://example.com/Mutta-Puffs-Database/';
const source = readFileSync(new URL('../src/service-worker.js', import.meta.url), 'utf8');

/** @param {Request} request @returns {Promise<Response> | undefined} */
function fetchWithWorker(request) {
  const handlers = new Map();
  const self = {registration:{scope}, addEventListener:(name, handler) => handlers.set(name, handler)};
  runInNewContext(source, {self, URL, URLSearchParams, Response});
  let response;
  handlers.get('fetch')({request, respondWith: value => { response = value; }});
  return response;
}

test('the share target redirects a URL-encoded Maps share to a private draft fragment', async () => {
  const fields = {title:'Test bakery', text:'Share this place', url:'https://maps.app.goo.gl/TestBakery'};
  const request = new Request(scope + 'share/', {method:'POST', body:new URLSearchParams(fields)});
  const pending = fetchWithWorker(request);
  assert.ok(pending);
  const response = await pending;
  assert.equal(response.status,303);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.href.split('#')[0],scope + 'contribute/');
  assert.deepEqual(JSON.parse(new URLSearchParams(destination.hash.slice(1)).get('shared')),fields);
});

test('the share target sends invalid submissions to the manual fallback', async () => {
  const request = new Request(scope + 'share/', {method:'POST',body:'invalid share'});
  const pending = fetchWithWorker(request);
  assert.ok(pending);
  const response = await pending;
  assert.equal(response.headers.get('location'),scope + 'contribute/#share-error');
});

test('ordinary external or unrelated POST requests are left alone', () => {
  assert.equal(fetchWithWorker(new Request('https://another.example/share/', {method:'POST'})),undefined);
  assert.equal(fetchWithWorker(new Request(scope + 'about/', {method:'POST'})),undefined);
});
