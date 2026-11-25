import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

const scope = 'https://example.com/Mutta-Puffs-Database/';
const source = readFileSync(new URL('../src/service-worker.js', import.meta.url), 'utf8');

/**
 * @param {Pick<Request, 'url'|'method'|'mode'>} request
 * @param {object} [globals]
 * @returns {Promise<Response> | undefined}
 */
function fetchWithWorker(request, globals = {}) {
  const handlers = new Map();
  const self = {registration:{scope}, addEventListener:(name, handler) => handlers.set(name, handler)};
  runInNewContext(source, {self, URL, URLSearchParams, Response, CACHE_NAME:'mpdb-atlas-test', ...globals});
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

test('a failed cache write still returns the fresh online page', async () => {
  const network = new Response('Current atlas');
  const request = {url:scope + 'cities/',method:'GET',mode:'navigate'};
  const cache = {
    match: async () => new Response('Old atlas'),
    put: async () => {throw new DOMException('Storage is full','QuotaExceededError');},
  };
  const response = await fetchWithWorker(request,{caches:{open:async () => cache},fetch:async () => network});
  assert.equal(response,network);
});

test('a failed cache lookup or open still allows online requests', async () => {
  const unavailable = async () => {throw new DOMException('Storage is unavailable','SecurityError');};
  const network = new Response('Current script');
  const request = new Request(scope + '_astro/atlas.js');
  const fetch = async () => network;
  for (const open of [unavailable,async () => ({match:unavailable,put:unavailable})]) {
    assert.equal(await fetchWithWorker(request,{caches:{open},fetch}),network);
  }
});

test('a failed page lookup still allows the cached offline fallback', async () => {
  const offline = new Response('Offline atlas');
  const request = {url:scope + 'cities/?query=Hyderabad',method:'GET',mode:'navigate'};
  const cache = {
    match: async input => {
      if (String(input) === scope + 'offline/') return offline;
      throw new Error('Cache lookup failed');
    },
  };
  const fetch = async () => {throw new TypeError('Network is unavailable');};
  assert.equal(await fetchWithWorker(request,{caches:{open:async () => cache},fetch}),offline);
});

test('navigation query strings are excluded from cache writes', async () => {
  const network = new Response('Place search');
  const request = {url:scope + '?query=Hyderabad',method:'GET',mode:'navigate'};
  let writes = 0;
  const cache = {put:async () => {writes++;}};
  assert.equal(await fetchWithWorker(request,{caches:{open:async () => cache},fetch:async () => network}),network);
  assert.equal(writes,0);
});
