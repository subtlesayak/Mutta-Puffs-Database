/* Build inserts versioned static assets at the top of this file. */
const scope = new URL(self.registration.scope);
const route = name => new URL(name, scope);
const prefix = 'mpdb-atlas-';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE.map(name => route(name)))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function share(request) {
  const next = route('contribute/');
  try {
    const fields = await request.formData();
    const draft = {};
    for (const [name, limit] of [['title', 200], ['text', 2000], ['url', 650]]) {
      const value = fields.get(name);
      if (typeof value === 'string') draft[name] = value.slice(0, limit);
    }
    next.hash = new URLSearchParams({shared: JSON.stringify(draft)}).toString();
  } catch {
    next.hash = 'share-error';
  }
  return Response.redirect(next, 303);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.method === 'POST' && (url.pathname === route('share/').pathname || url.pathname === route('share').pathname)) {
    event.respondWith(share(request));
    return;
  }
  if (request.method !== 'GET' || url.pathname === route('sw.js').pathname) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME).catch(() => null);
    const readCache = (input, options) => cache?.match(input, options).catch(() => null);
    const navigation = request.mode === 'navigate';
    const dataset = url.pathname.startsWith(route('api/').pathname);
    // Fingerprinted bundles have identical bytes for precache, module, and font requests.
    const matchOptions = {ignoreSearch:navigation, ignoreVary:url.pathname.startsWith(route('_astro/').pathname)};
    if (!navigation && !dataset) {
      const cached = await readCache(request, matchOptions);
      if (cached) return cached;
    }
    const response = await fetch(request).catch(() => null);
    if (!response) {
      return (await readCache(request, matchOptions))
        || (navigation && await readCache(route('offline/')))
        || Response.error();
    }
    // Location shares are POSTed to the worker. Navigation queries are never stored.
    if (cache && response.ok && (!navigation || !url.search)) {
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
