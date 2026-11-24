import Fuse from 'fuse.js';
import {accuracyLabels, formatNumber, formatPrice, locality, path, placeCount, placePath, providerLabels} from '../lib/format';
import {browserPosition, distanceKm} from '../lib/distance';
import {metricMatcher} from '../lib/metric-filters';
import {track} from './analytics';
import type {Place, PlaceMetrics, Provider} from '../lib/types';

const PAGE_SIZE = 24;
const PROVIDER_KEY = 'mutta-puffs-map-provider';
const km = new Intl.NumberFormat('en-IN', {maximumFractionDigits: 1});
const variants: Record<string, string> = {Kozhikode: 'Calicut', Bengaluru: 'Bangalore', Kochi: 'Cochin', Mysuru: 'Mysore', Thiruvananthapuram: 'Trivandrum'};
const districtKey = (p: Place) => p.location.district ? [p.location.district, p.location.state].filter(Boolean).join(' · ') : '';

function make<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const item = document.createElement(tag);
  item.textContent = text;
  if (className) item.className = className;
  return item;
}

function card(place: Place, provider: Provider, distance: number | null, metric?: PlaceMetrics) {
  const li = make('li', '', 'place-card');
  const name = make('h3');
  const detail = make('a', place.name);
  detail.href = placePath(place.id);
  name.append(detail);
  li.append(name, make('p', locality(place.location) || 'Location to be confirmed', 'muted'));
  if (distance !== null) li.append(make('p', distance < .1 ? 'Under 0.1 km away' : km.format(distance) + ' km away'));
  const tags = make('div', '', 'tags');
  tags.append(make('span', accuracyLabels[place.location.accuracy], place.location.accuracy === 'estimated' ? 'tag estimate' : 'tag'));
  if (metric?.score) tags.append(make('span', formatNumber(metric.score.score) + '/100 Puff Score · ' + metric.score.count + (metric.score.count === 1 ? ' review' : ' reviews'), 'tag'));
  if (metric?.price) tags.append(make('span', formatPrice(metric.price.amount,metric.price.currency) + ' last reported', 'tag'));
  li.append(tags);
  const destination = place.map_links[provider];
  if (destination) {
    const link = make('a', 'Open in ' + providerLabels[provider], 'text-link');
    link.href = destination;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.directions = provider;
    link.setAttribute('aria-label', place.name + ' in ' + providerLabels[provider] + ' (opens in a new tab)');
    li.append(link);
  } else {
    li.append(make('p', 'Map link unavailable', 'muted'));
  }
  return li;
}

export async function startExplorer() {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root) return;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const form = find<HTMLFormElement>('[data-filters]');
  const status = find<HTMLElement>('[data-result-status]');
  const results = find<HTMLUListElement>('[data-results]');
  const search = find<HTMLInputElement>('[name=search]');
  const region = find<HTMLSelectElement>('[name=region]');
  const district = find<HTMLSelectElement>('[name=district]');
  const category = find<HTMLSelectElement>('[name=category]');
  const verification = find<HTMLSelectElement>('[name=verification]');
  const city = find<HTMLSelectElement>('[name=city]');
  const radius = find<HTMLSelectElement>('[name=radius]');
  const provider = find<HTMLSelectElement>('[name=provider]');
  const notes = find<HTMLInputElement>('[name=notes]');
  const locate = find<HTMLButtonElement>('[data-locate]');
  const clearLocation = find<HTMLButtonElement>('[data-clear-location]');
  const locationStatus = find<HTMLElement>('[data-location-status]');
  const pagination = find<HTMLElement>('[data-pagination]');
  const previous = find<HTMLButtonElement>('[data-previous]');
  const next = find<HTMLButtonElement>('[data-next]');
  try {
    const stored = localStorage.getItem(PROVIDER_KEY);
    if (stored && Object.hasOwn(providerLabels, stored)) provider.value = stored;
  } catch {}

  let places: Place[];
  let metrics: Record<string,PlaceMetrics> = {};
  try {
    const [response,prices] = await Promise.all([fetch(path('api/v1/places.json')),fetch(path('api/v1/place-metrics.json')).catch(() => null)]);
    if (!response.ok) throw new Error('Places could not be loaded');
    ({places} = await response.json());
    if (prices?.ok) ({place_metrics:metrics} = await prices.json());
  } catch {
    status.textContent = 'Could not load the full list. Reload the page or open the city directory.';
    return;
  }
  const index = new Fuse(places.map(place => ({
    place, name: place.name, area: locality(place.location), sourceNote: place.note,
    variant: variants[place.location.city ?? ''],
  })), {keys: [{name: 'name',weight: 3}, {name: 'area',weight: 2}, 'sourceNote', 'variant'], threshold: .35, ignoreLocation: true});

  function updateDistricts() {
    const selected = district.value;
    const entries = places.filter(p => p.location.country === 'India' &&
      (!region.value || region.value === 'India' || p.location.state === region.value));
    const values = [...new Set(entries.map(districtKey).filter(Boolean))].sort();
    district.replaceChildren(new Option('All districts',''), ...values.map(name => new Option(name)));
    if (entries.some(p => !p.location.district)) district.add(new Option('District unassigned','unassigned'));
    district.disabled = !entries.length;
    if ([...district.options].some(option => option.value === selected)) district.value = selected;
  }

  let page = 0;
  let request = 0;
  let origin: {coords: [number, number]; label: string} | null = null;
  let noResultsTimer: ReturnType<typeof setTimeout> | undefined;
  function render() {
    const query = search.value.trim();
    const matching = query ? index.search(query).map(hit => hit.item.place) : places;
    const matchesMetric = metricMatcher(form);
    const filtered = matching.filter(p =>
      (!region.value || p.location.state === region.value || p.location.country === region.value || (region.value === 'unassigned' && !p.location.country)) &&
      (!district.value || districtKey(p) === district.value || (district.value === 'unassigned' && p.location.country === 'India' && !p.location.district)) &&
      (!category.value || category.value === p.category) &&
      (!verification.value || verification.value === p.verification.status) && (!notes.checked || !!p.note) && matchesMetric(metrics[p.id]));
    const limit = Number(radius.value);
    const distances = filtered.flatMap<{place: Place; distance: number | null}>(place => {
      const {latitude,longitude} = place.location;
      if (!origin) return [{place,distance: null}];
      if (latitude === null || longitude === null) return [];
      const distance = distanceKm(origin.coords, [latitude,longitude]);
      return distance <= limit ? [{place,distance}] : [];
    });
    if (origin) distances.sort((a,b) => (a.distance ?? 0) - (b.distance ?? 0) || a.place.id.localeCompare(b.place.id));
    const pages = Math.max(1, Math.ceil(distances.length / PAGE_SIZE));
    page = Math.min(pages - 1,page);
    status.textContent = !distances.length
      ? 'No places match. Try a wider distance or clear the filters.'
      : placeCount(distances.length) + (origin ? (Number.isFinite(limit) ? ' within ' + formatNumber(limit) + ' km of ' : ' sorted by distance from ') + origin.label : '');
    clearTimeout(noResultsTimer);
    if (!distances.length && query) noResultsTimer = setTimeout(() => track({name:'no_results'}),900);
    results.replaceChildren(...distances.slice(page * PAGE_SIZE,(page + 1)*PAGE_SIZE).map(({place,distance}) => card(place, provider.value as Provider,distance,metrics[place.id])));
    pagination.hidden = pages <= 1;
    previous.disabled = page === 0;
    next.disabled = page + 1 === pages;
    find<HTMLElement>('[data-pages]').textContent = 'Page ' + (page + 1) + ' of ' + pages;
  }

  function setOrigin(value: typeof origin, message = '') {
    request += 1;
    origin = value;
    radius.disabled = !value;
    clearLocation.hidden = !value;
    locate.removeAttribute('aria-disabled');
    locationStatus.textContent = message;
    page = 0;
    render();
  }
  function chooseCity() {
    const option = city.selectedOptions[0];
    const coordinates = option?.dataset.centre;
    if (coordinates) track({name:'city_selected',data:{city:option.value}});
    setOrigin(coordinates ? {coords: coordinates.split(',').map(Number) as [number,number], label: option.text + ' city centre'} : null);
  }
  locate.addEventListener('click', () => {
    if (locate.getAttribute('aria-disabled') === 'true') return;
    if (!navigator.geolocation) {
      locationStatus.textContent = 'Your browser could not share a location. Choose a city to find nearby places.';
      return;
    }
    const pending = ++request;
    locate.setAttribute('aria-disabled', 'true');
    clearLocation.hidden = false;
    locationStatus.textContent = 'Finding your location…';
    void browserPosition(navigator.geolocation).then(coords => {
      if (pending !== request) return;
      city.value = '';
      setOrigin({coords,label: 'your location'});
    }, () => {
      if (pending === request) setOrigin(origin,'Could not get your location. Try again or choose a city.');
    });
  });
  clearLocation.addEventListener('click', () => {
    city.value = '';
    setOrigin(null);
    locate.focus();
  });
  form.addEventListener('input', event => {
    if (event.target === city) { chooseCity(); return; }
    if (event.target === region) updateDistricts();
    if (event.target === provider) {
      try { localStorage.setItem(PROVIDER_KEY,provider.value); } catch {}
    }
    page = 0;
    render();
  });
  form.addEventListener('submit', event => {event.preventDefault();});
  form.addEventListener('reset', () => {
    const chosen = provider.value;
    queueMicrotask(() => {
      provider.value = chosen;
      updateDistricts();
      setOrigin(null);
    });
  });
  for (const [button, step] of [[previous,-1],[next,1]] as const) {
    button.addEventListener('click', () => {
      page += step;
      render();
      results.querySelector('a')?.focus();
    });
  }
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') ?? '';
  updateDistricts();
  if ([...city.options].some(option => option.value && option.value === params.get('city'))) {
    city.value = params.get('city')!;
    chooseCity();
  } else render();
}
