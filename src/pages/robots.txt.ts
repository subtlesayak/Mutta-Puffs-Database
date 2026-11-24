import type {APIRoute} from 'astro';
import {path, siteUrl} from '../lib/format';
export const GET: APIRoute = () => new Response('User-agent: *\nAllow: /\nSitemap: ' + new URL(path('sitemap.xml'),siteUrl.origin).href + '\n', {
  headers:{'content-type':'text/plain; charset=utf-8'},
});
