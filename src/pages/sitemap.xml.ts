import type {APIRoute} from 'astro';
import {atlas} from '../lib/catalogue';
import {path, cityPath, placePath, siteUrl} from '../lib/format';

export const GET: APIRoute = () => {
  const pages = ['', 'map/', 'cities/', 'guide/', 'insights/', 'about/', 'contribute/', 'leaderboard/', 'price-index/', 'trails/', 'passport/', 'wrapped/', 'roulette/', 'heritage/'].map(path);
  pages.push(...atlas.cities.map(city => cityPath(city.id)), ...atlas.places.map(place => placePath(place.id)), ...atlas.trails.map(trail => path('trails/' + trail.id + '/')));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + pages.map(page => '<url><loc>' + new URL(page,siteUrl.origin).href + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  return new Response(xml, {headers:{'content-type':'application/xml; charset=utf-8'}});
};
