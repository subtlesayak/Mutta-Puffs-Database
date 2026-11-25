import Fuse from 'fuse.js';
import {formatMessage, formatNumber, formatPrice, locality, path, placeCount, placePath, providerLabels} from '../lib/format';
import type {FinderCopy} from '../lib/finder-copy';
import {browserPosition, distanceKm} from '../lib/distance';
import {metricMatcher} from '../lib/metric-filters';
import {track} from './analytics';
import {mapPreference,rememberMapProvider} from '../lib/map-preference';
import {isLocale, labelSets, type Locale} from '../lib/locales';
import {placeNameAliases, searchText, translatedPlaceName} from '../lib/place-search';
import type {Place, PlaceMetrics, Provider} from '../lib/types';

const PAGE_SIZE = 24;
const districtKey = (p: Place) => p.location.district ? [p.location.district, p.location.state].filter(Boolean).join(' · ') : '';

function make<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const item = document.createElement(tag);
  item.textContent = text;
  if (className) item.className = className;
  return item;
}

function card(place: Place, provider: Provider, distance: number | null,
  {locale,copy,numbers}: {locale:Locale; copy:FinderCopy; numbers:Intl.NumberFormat}, metric?: PlaceMetrics) {
  const li = make('li', '', 'place-card');
  const name = make('h3');
  const detail = make('a', place.name);
  detail.href = placePath(place.id);
  name.append(detail);
  li.append(name, make('p', locality(place.location,name => translatedPlaceName(name,locale)) || copy.locationPending, 'muted'));
  if (distance !== null) {
    li.append(make('p', distance < .1 ? copy.near : formatMessage(copy.away,{distance:numbers.format(Math.round(distance * 10) / 10)})));
  }
  const tags = make('div', '', 'tags');
  tags.append(make('span', copy.accuracy[place.location.accuracy], place.location.accuracy === 'estimated' ? 'tag estimate' : 'tag'));
  if (metric?.score) {
    const {score,count} = metric.score;
    tags.append(make('span',formatMessage(count === 1 ? copy.scoreTagSingle : copy.scoreTag,{
      score:numbers.format(score),count:numbers.format(count),
    }),'tag'));
  }
  if (metric?.price) {
    const price = formatPrice(metric.price.amount,metric.price.currency,numbers.resolvedOptions().locale);
    tags.append(make('span',formatMessage(copy.priceTag,{price}),'tag'));
  }
  li.append(tags);
  const destination = place.map_links[provider];
  if (destination) {
    const message = {provider:providerLabels[provider],place:place.name};
    const link = make('a', formatMessage(copy.openMap,message), 'text-link');
    link.href = destination;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.directions = provider;
    link.setAttribute('aria-label', formatMessage(copy.openMapAccessible,message));
    li.append(link);
  } else {
    li.append(make('p', copy.mapUnavailable, 'muted'));
  }
  return li;
}

export async function startExplorer() {
  const activeLanguage = document.documentElement.lang;
  const locale = isLocale(activeLanguage) ? activeLanguage : 'en';
  const labels = labelSets[locale];
  const numbers = new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale);
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root?.dataset.finderCopy) return;
  const display = {locale,copy:JSON.parse(root.dataset.finderCopy) as FinderCopy,numbers};
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
  const mapView = find<HTMLAnchorElement>('[data-map-view]');
  const preferred = mapPreference();
  if (preferred) provider.value = preferred;

  let places: Place[];
  let metrics: Record<string,PlaceMetrics> = {};
  try {
    const [response,prices] = await Promise.all([fetch(path('api/v1/places.json')),fetch(path('api/v1/place-metrics.json')).catch(() => null)]);
    if (!response.ok) throw new Error('Places could not be loaded');
    ({places} = await response.json());
    if (prices?.ok) ({place_metrics:metrics} = await prices.json());
  } catch {
    status.textContent = labels.loadError;
    return;
  }
  const index = new Fuse(places.map(place => ({
    place, name: searchText(place.name), area: searchText(locality(place.location)),
    sourceNote: place.note ? searchText(place.note) : undefined,
    variant: placeNameAliases([place.location.city,place.location.district,place.location.state,place.location.country]),
  })), {keys: [{name: 'name',weight: 3}, {name: 'area',weight: 2}, 'sourceNote', 'variant'], threshold: .35, ignoreLocation: true});

  function updateDistricts() {
    const selected = district.value;
    const entries = places.filter(p => p.location.country === 'India' &&
      (!region.value || region.value === 'India' || p.location.state === region.value));
    const values = [...new Set(entries.map(districtKey).filter(Boolean))].sort();
    district.replaceChildren(new Option(labels.allDistricts,''), ...values.map(name => {
      const display = name.split(' · ').map(part => translatedPlaceName(part,locale)).join(' · ');
      return new Option(display,name);
    }));
    if (entries.some(p => !p.location.district)) district.add(new Option(labels.unassignedDistrict,'unassigned'));
    district.disabled = !entries.length;
    if ([...district.options].some(option => option.value === selected)) district.value = selected;
  }

  let page = 0;
  let request = 0;
  let origin: {coords: [number, number]; label: string} | null = null;
  let noResultsTimer: ReturnType<typeof setTimeout> | undefined;
  function render() {
    const query = searchText(search.value);
    const mapParams = new URLSearchParams();
    if (city.value) mapParams.set('city', city.value);
    if (region.value && region.value !== 'unassigned') mapParams.set('region', region.value);
    if (district.value && district.value !== 'unassigned') mapParams.set('district', district.value);
    mapView.href = path('map/' + (mapParams.size ? '?' + mapParams : ''));
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
    const recovery = origin && Number.isFinite(limit)
      ? 'Try a wider distance, change your search, or clear the filters.'
      : 'Try a different search or clear the filters.';
    status.textContent = !distances.length
      ? 'No places match. ' + recovery
      : placeCount(distances.length) + (origin ? (Number.isFinite(limit) ? ' within ' + formatNumber(limit) + ' km of ' : ' sorted by distance from ') + origin.label : '');
    if (locale !== 'en') {
      status.textContent = distances.length
        ? numbers.format(distances.length) + ' ' + labels.places
        : labels.empty;
    }
    clearTimeout(noResultsTimer);
    if (!distances.length && query) noResultsTimer = setTimeout(() => track({name:'no_results'}),900);
    results.replaceChildren(...distances.slice(page * PAGE_SIZE,(page + 1)*PAGE_SIZE)
      .map(({place,distance}) => card(place,provider.value as Provider,distance,display,metrics[place.id])));
    pagination.hidden = pages <= 1;
    previous.disabled = page === 0;
    next.disabled = page + 1 === pages;
    find<HTMLElement>('[data-pages]').textContent = labels.page + ' ' + numbers.format(page + 1) + ' ' + labels.of + ' ' + numbers.format(pages);
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
      locationStatus.textContent = labels.denied;
      return;
    }
    const pending = ++request;
    locate.setAttribute('aria-disabled', 'true');
    clearLocation.hidden = false;
    locationStatus.textContent = labels.loadingLocation;
    void browserPosition(navigator.geolocation).then(coords => {
      if (pending !== request) return;
      city.value = '';
      setOrigin({coords,label: 'your location'});
    }, () => {
      if (pending === request) setOrigin(origin,labels.denied);
    });
  });
  document.querySelector('[data-find-nearby]')?.addEventListener('click', event => {
    if (!(event instanceof MouseEvent) || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    locate.focus({preventScroll: true});
    locate.click();
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
      rememberMapProvider(provider.value as Provider);
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
