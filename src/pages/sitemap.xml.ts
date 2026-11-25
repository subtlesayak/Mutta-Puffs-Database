import type {APIRoute} from 'astro';
import {atlas} from '../lib/catalogue';
import {path, localizedPath, cityPath, placePath, siteUrl} from '../lib/format';
import {locales} from '../lib/locales';

export const GET: APIRoute = () => {
  const pages = ['insights/', 'about/', 'leaderboard/', 'price-index/', 'trails/', 'passport/', 'wrapped/', 'roulette/', 'heritage/', 'languages/'].map(path);
  for (const {id:locale} of locales) {
    for (const route of ['', 'cities/', 'map/', 'contribute/', 'missions/', 'guide/']) {
      pages.push(localizedPath(route,locale));
    }
    pages.push(...atlas.cities.map(city => cityPath(city.id,locale)), ...atlas.places.map(place => placePath(place.id,locale)));
  }
  pages.push(...atlas.trails.map(trail => path('trails/' + trail.id + '/')));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + pages.map(page => '<url><loc>' + new URL(page,siteUrl.origin).href + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  return new Response(xml, {headers:{'content-type':'application/xml; charset=utf-8'}});
};
