import type {GeoJSONSource, MapGeoJSONFeature} from 'maplibre-gl';
import type {Feature, FeatureCollection, Point} from 'geojson';
import {formatMessage, path, placePath} from '../lib/format';
import {metricControls, metricMatcher} from '../lib/metric-filters';
import {pagePlaceAliases, resolvePlaceId} from '../lib/place-identity';
import {isLocale} from '../lib/locales';
import {translatedDistrict, translatedPlaceName} from '../lib/place-search';
import type {MapRuntimeCopy} from '../lib/map-copy';
import type {Accuracy, City, PlaceMetrics, Trail} from '../lib/types';
import type {openGoogleMap} from './google-map';

interface Pin {id: string; name: string; accuracy: Accuracy; status: string; city: string | null; state: string | null; country: string | null; district: string | null}
type Pins = FeatureCollection<Point,Pin>;

async function loadBasemap(): Promise<FeatureCollection | string> {
  try {
    const [response,{decode},{PbfReader}] = await Promise.all([
      fetch(path('basemap.pbf')),import('geobuf'),import('pbf'),
    ]);
    if (response.ok) {
      const outline = decode(new PbfReader(await response.arrayBuffer()));
      if (outline.type === 'FeatureCollection' && outline.features.length) return outline;
    }
  } catch {
    // A previous release or interrupted cache may only have the GeoJSON outline.
  }
  return path('basemap.geojson');
}

export async function startMap() {
  const root = document.querySelector<HTMLElement>('[data-atlas-map]');
  if (!root?.dataset.mapCopy) return;
  const language = document.documentElement.lang;
  const locale = isLocale(language) ? language : 'en';
  const copy = JSON.parse(root.dataset.mapCopy) as MapRuntimeCopy;
  const localName = (name: string) => translatedPlaceName(name,locale);
  const numbers = new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale);
  const plurals = new Intl.PluralRules(locale);
  const languageLinks = document.querySelectorAll<HTMLAnchorElement>('#page-languages a');
  const canvas = root.querySelector<HTMLElement>('[data-map-canvas]')!;
  const frame = root.querySelector<HTMLElement>('[data-map-frame]')!;
  const list = root.querySelector<HTMLUListElement>('[data-map-list]')!;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const filterCount = root.querySelector<HTMLElement>('[data-map-filter-count]')!;
  const status = root.querySelector<HTMLElement>('[data-map-status]')!;
  const selection = root.querySelector<HTMLElement>('[data-selection]')!;
  const city = root.querySelector<HTMLSelectElement>('[name=city]')!;
  const region = root.querySelector<HTMLSelectElement>('[name=region]')!;
  const district = root.querySelector<HTMLSelectElement>('[name=district]')!;
  const trail = root.querySelector<HTMLSelectElement>('[name=trail]')!;
  const verification = root.querySelector<HTMLSelectElement>('[name=verification]')!;
  const view = root.querySelector<HTMLSelectElement>('[name=view]')!;
  const accuracy = root.querySelector<HTMLSelectElement>('[name=accuracy]')!;
  const place = root.querySelector<HTMLSelectElement>('[name=place]')!;
  const density = root.querySelector<HTMLInputElement>('[name=density]')!;
  const pinsKey = root.querySelector<HTMLElement>('[data-pins-key]')!;
  const densityKey = root.querySelector<HTMLElement>('[data-density-key]')!;
  const streetAttribution = root.querySelector<HTMLElement>('[data-street-attribution]')!;
  const googleCanvas = root.querySelector<HTMLElement>('[data-google-canvas]');
  const renderer = root.querySelector<HTMLSelectElement>('[name=renderer]');
  let googleView: Awaited<ReturnType<typeof openGoogleMap<Pin>>> | null = null;
  let googlePending: Promise<Awaited<ReturnType<typeof openGoogleMap<Pin>>>> | null = null;
  let activeRenderer: 'atlas' | 'street' | 'google' = 'atlas';
  let rendererRequest = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
  const params = new URLSearchParams(location.search);
  const urlPlace = resolvePlaceId(params.get('place') ?? '', pagePlaceAliases());
  const linkedFilters = [city, region, district, trail, verification, accuracy, view];
  const metricFields = metricControls(form);
  let maplibregl: typeof import('maplibre-gl') | undefined;
  let map: import('maplibre-gl').Map | undefined;
  let initializing = false;
  let interactive = false;
  let mapUnavailable = false;
  let pins: Pins;
  let cities: City[];
  let trails: Trail[];
  let metrics: Record<string,PlaceMetrics>;
  try {
    const responses = await Promise.all(['places.geojson','cities.json','trails.json'].map(file => fetch(path('api/v1/' + file))));
    if (responses.some(response => !response.ok)) throw new Error('Map data unavailable');
    [pins, {cities}, {trails}] = await Promise.all(responses.map(response => response.json()));
  } catch {
    status.textContent = copy.loadError;
    frame.hidden = true;
    form.hidden = true;
    const index = document.querySelector<HTMLDetailsElement>('.map-index');
    if (index) index.open = true;
    return;
  }
  metrics = {};
  void fetch(path('api/v1/place-metrics.json')).then(async response => {
    if (!response.ok) return;
    ({place_metrics:metrics} = await response.json());
    if (metricFields.some(field => field.value)) update();
  }).catch(() => {});

  const marks = new Map(pins.features.map(feature => [feature.properties.id,feature]));
  const lookAt = (feature: Feature<Point,Pin>, fly = true) => {
    const center = feature.geometry.coordinates as [number,number];
    if (fly && activeRenderer !== 'google' && map) map.easeTo({center,zoom:Math.max(11,map.getZoom()),duration:motion});
    const a = document.createElement('a');
    a.textContent = feature.properties.name;
    a.href = placePath(feature.properties.id,locale);
    const detail = document.createElement('p');
    detail.append(a, document.createTextNode(' · ' + copy.accuracy[feature.properties.accuracy]));
    selection.replaceChildren(detail);
    const popup = document.createElement('div');
    popup.append(a.cloneNode(true),document.createElement('br'),document.createTextNode(copy.accuracy[feature.properties.accuracy]));
    if (activeRenderer === 'google') {
      googleView?.focus(feature,popup,fly);
    } else if (map && maplibregl) {
      currentPopup?.remove();
      currentPopup = new maplibregl.Popup({offset:12}).setLngLat(center).setDOMContent(popup).addTo(map);
    }
    place.value = feature.properties.id;
    saveView();
  };
  let currentPopup: import('maplibre-gl').Popup | null = null;
  const saveView = () => {
    const url = new URL(location.href);
    const translatedParams = new URLSearchParams();
    for (const field of [...linkedFilters,place,...metricFields]) {
      const {name,value} = field;
      if (value && field.validity.valid && !(field.disabled && metricFields.includes(field)) && !(name === 'view' && value === 'map')) {
        url.searchParams.set(name,value);
        translatedParams.set(name,value);
      } else url.searchParams.delete(name);
    }
    history.replaceState(null,'',url);
    for (const link of languageLinks) {
      const destination = new URL(link.href);
      destination.search = translatedParams.toString();
      link.href = destination.href;
    }
  };
  const update = () => {
    const selected = cities.find(item => item.id === city.value);
    const allowed = selected ? new Set(selected.place_ids) : null;
    const route = trails.find(item => item.id === trail.value);
    const stops = route ? new Set(route.place_ids) : null;
    const matchesMetric = metricMatcher(form);
    const active = [region,district,trail,accuracy,verification,...metricFields].filter(control => !control.disabled && control.value).length;
    filterCount.textContent = active ? formatMessage(copy.active,{count:numbers.format(active)}) : '';
    const points = pins.features.filter(({properties: pin}) =>
      (!allowed || allowed.has(pin.id)) && (!stops || stops.has(pin.id)) &&
      (!region.value || [pin.state,pin.country].includes(region.value)) &&
      (!district.value || [pin.district,pin.state].filter(Boolean).join(' · ') === district.value) &&
      (!verification.value || pin.status === verification.value) &&
      (!accuracy.value || pin.accuracy === accuracy.value) && matchesMetric(metrics[pin.id]));
    if (route) points.sort((a,b) => route.place_ids.indexOf(a.properties.id) - route.place_ids.indexOf(b.properties.id));
    if (interactive && map) {
      map.setLayoutProperty('street-tiles','visibility',view.value !== 'list' && activeRenderer === 'street' ? 'visible' : 'none');
      const data: Pins = {type:'FeatureCollection',features:points};
      (map.getSource('places') as GeoJSONSource).setData(data);
      (map.getSource('density') as GeoJSONSource).setData(data);
    }
    const current = place.value;
    place.replaceChildren(new Option(copy.choosePlace,''), ...points.slice().sort((a,b)=>a.properties.name.localeCompare(b.properties.name))
      .map(p => new Option(p.properties.name + (p.properties.city ? ' · ' + localName(p.properties.city) : ''),p.properties.id)));
    if (points.some(p=>p.properties.id === current)) place.value = current;
    const showList = view.value === 'list';
    streetAttribution.hidden = showList || activeRenderer !== 'street';
    list.hidden = !showList;
    frame.hidden = showList;
    density.disabled = !interactive || showList || activeRenderer === 'google';
    place.disabled = !interactive || showList;
    if (renderer) renderer.disabled = !interactive || showList;
    const noun = plurals.select(points.length) === 'one' ? copy.placeOne : copy.placeMany;
    const places = numbers.format(points.length) + ' ' + noun;
    const count = points.length ? formatMessage(showList ? copy.listCount : copy.mapCount,{places}) : copy.empty;
    status.textContent = mapUnavailable ? count + ' ' + copy.unavailable : !showList && !interactive ? copy.loading : count;
    if (showList) {
      list.replaceChildren(...points.map(({properties:pin}) => {
        const li = document.createElement('li');
        li.className = 'place-card';
        const link = document.createElement('a');
        link.href = placePath(pin.id,locale);
        link.textContent = pin.name;
        const note = document.createElement('p');
        note.className = 'muted';
        note.textContent = [pin.city && localName(pin.city), copy.accuracy[pin.accuracy]].filter(Boolean).join(' · ');
        li.append(link,note);
        return li;
      }));
    } else if (interactive && activeRenderer !== 'google') map?.resize();
    currentPopup?.remove();
    selection.replaceChildren();
    if (!showList && !initializing && !map && !mapUnavailable) void initializeMap();
    if (showList || !interactive || !map || !maplibregl) {saveView(); return;}
    if (activeRenderer === 'google') googleView?.update(points);
    else if (points.length === 1) map.easeTo({center: points[0].geometry.coordinates as [number,number],zoom:11,duration:motion});
    else if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const point of points) bounds.extend(point.geometry.coordinates as [number,number]);
      map.fitBounds(bounds,{padding:50,maxZoom:11,duration:motion});
    }
    saveView();
  };

  function showAtlas(message = '', style: 'atlas' | 'street' = 'atlas') {
    rendererRequest++;
    activeRenderer = style;
    if (renderer) renderer.value = style;
    if (googleCanvas) googleCanvas.hidden = true;
    canvas.hidden = false;
    density.disabled = false;
    pinsKey.hidden = density.checked;
    densityKey.hidden = !density.checked;
    map?.resize();
    update();
    const selected = marks.get(place.value);
    if (selected) lookAt(selected);
    if (message) status.textContent = message;
  }

  async function switchMap() {
    if (!renderer) return;
    if (renderer.value !== 'google') {showAtlas('',renderer.value === 'street' ? 'street' : 'atlas'); return;}
    if (!googleCanvas || !root?.dataset.googleKey || !root.dataset.googleId) {showAtlas(); return;}
    const request = ++rendererRequest;
    const failure = copy.googleFailure;
    status.textContent = copy.googleLoading;
    try {
      const config = {key:root.dataset.googleKey,mapId:root.dataset.googleId,language:locale};
      googlePending ??= import('./google-map').then(module =>
        module.openGoogleMap<Pin>(googleCanvas,config,point => lookAt(point,false),() => {
          if (renderer.value === 'google') showAtlas(failure);
        }));
      googleView = await googlePending;
      if (request !== rendererRequest) return;
      activeRenderer = 'google';
      currentPopup?.remove();
      googleCanvas.hidden = false;
      canvas.hidden = true;
      density.disabled = true;
      pinsKey.hidden = true;
      densityKey.hidden = true;
      update();
      const selected = marks.get(place.value);
      if (selected) lookAt(selected);
    } catch {
      googlePending = null;
      if (request === rendererRequest) showAtlas(failure);
    }
  }

  function updateDistrictOptions() {
    const current = district.value;
    const cityPlaces = cities.find(item => item.id === city.value)?.place_ids;
    const allowed = cityPlaces ? new Set(cityPlaces) : null;
    const options = new Set(pins.features.filter(({properties: pin}) =>
      (!allowed || allowed.has(pin.id)) && (!region.value || [pin.state,pin.country].includes(region.value)))
      .map(({properties: pin}) => pin.district ? [pin.district,pin.state].filter(Boolean).join(' · ') : '').filter(Boolean));
    district.replaceChildren(new Option(copy.allDistricts,''), ...[...options].sort().map(name => new Option(translatedDistrict(name,locale),name)));
    district.disabled = options.size === 0;
    if (options.has(current)) district.value = current;
  }

  function useListFallback() {
    interactive = false;
    mapUnavailable = true;
    view.value = 'list';
    view.disabled = true;
    update();
  }

  for (const filter of linkedFilters) {
    const value = params.get(filter.name);
    const requested = filter === district && value === 'Hydrabad · Telangana' ? 'Hyderabad · Telangana' : value;
    if (requested && [...filter.options].some(option => option.value === requested)) filter.value = requested;
    filter.addEventListener('change',() => {
      if (filter === city || filter === region) {
        const selected = cities.find(item => item.id === city.value);
        if (selected && region.value && ![selected.state,selected.country].includes(region.value)) {
          if (filter === city) region.value = '';
          else city.value = '';
        }
        updateDistrictOptions();
      }
      update();
    });
  }
  for (const field of metricFields) {
    const incoming = params.get(field.name);
    if (!incoming) continue;
    field.value = incoming;
    if (!field.validity.valid) field.value = '';
  }
  place.value = urlPlace;
  updateDistrictOptions();
  form.querySelector('.metric-filters')?.addEventListener('input',update);
  form.addEventListener('submit',event => event.preventDefault());
  form.addEventListener('reset',() => {
    const selectedView = view.value;
    queueMicrotask(() => {
      view.value = selectedView;
      if (renderer) renderer.value = activeRenderer;
      pinsKey.hidden = activeRenderer === 'google';
      densityKey.hidden = true;
      if (interactive && map) {
        map.setLayoutProperty('heat','visibility','none');
        for (const layer of ['clusters','counts','pins']) map.setLayoutProperty(layer,'visibility','visible');
      }
      googleView?.clear();
      updateDistrictOptions();
      update();
    });
  });
  renderer?.addEventListener('change',() => {void switchMap();});
  place.addEventListener('change',() => {
    const feature = marks.get(place.value);
    if (feature) lookAt(feature);
    else { currentPopup?.remove(); googleView?.clear(); selection.replaceChildren(); saveView(); }
  });
  async function initializeMap() {
    initializing = true;
    try {
      const [library, worker, outline] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
        loadBasemap(),
      ]);
      maplibregl = library;
      library.setWorkerUrl(worker.default);
      map = new library.Map({
        container: canvas, attributionControl: false, center: [75.8,11], zoom: 4.5, minZoom: 1, maxZoom: 19,
        locale: {
          'Map.Title':copy.atlasCanvas,
          'NavigationControl.ZoomIn':copy.controls.zoomIn,
          'NavigationControl.ZoomOut':copy.controls.zoomOut,
          'GeolocateControl.FindMyLocation':copy.controls.locate,
          'GeolocateControl.LocationNotAvailable':copy.controls.locationUnavailable,
          'Popup.Close':copy.controls.close,
        },
        style: {version: 8, sources: {
          land: {type: 'geojson', data: outline, attribution: 'Natural Earth'},
          streets: {
            type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
          places: {type: 'geojson', data: pins, cluster: true, clusterRadius: 42, clusterMaxZoom: 13},
          density: {type: 'geojson', data: pins},
        }, layers: [
          {id: 'water', type: 'background', paint: {'background-color': '#e4ebdf'}},
          {id: 'land', type: 'fill', source: 'land', paint: {'fill-color':'#fff4dc'}},
          {id: 'boundaries', type: 'line', source: 'land', paint: {'line-color':'#aa9877','line-width':.75}},
          {id: 'street-tiles', type: 'raster', source: 'streets', layout: {visibility: 'none'}},
          {id: 'heat', type: 'heatmap', source: 'density', layout: {visibility: 'none'}, paint: {
            'heatmap-radius': ['interpolate',['linear'],['zoom'],3,15,11,30],
            'heatmap-opacity': .8,
            'heatmap-color': ['interpolate',['linear'],['heatmap-density'],0,'rgba(246,218,157,0)',.25,'#f3c766',.55,'#c65d31',.8,'#963e24',1,'#592217'],
          }},
          {id: 'clusters', type: 'circle', source: 'places', filter: ['has','point_count'], paint: {
            'circle-color': '#253f31', 'circle-stroke-color':'#fff4dc','circle-stroke-width':2,
            'circle-radius': ['step',['get','point_count'],15,12,20,30,25],
          }},
          {id: 'counts', type: 'symbol', source: 'places', filter: ['has','point_count'], layout: {
            'text-field': ['get','point_count_abbreviated'], 'text-size': 13, 'text-font': ['Arial'],
            'text-allow-overlap': true,
          }, paint: {'text-color': '#fff4dc'}},
          {id: 'pins', type: 'circle', source: 'places', filter: ['!', ['has','point_count']], paint: {
            'circle-color': ['match',['get','accuracy'],'verified','#2b5c3b','source_pin','#ae661f','#963e24'],
            'circle-radius': 7, 'circle-stroke-color':'#fff4dc', 'circle-stroke-width': 2,
          }},
        ]},
      });
      const atlasMap = map;
      atlasMap.addControl(new library.NavigationControl({showCompass:false}),'top-right');
      if (navigator.geolocation) atlasMap.addControl(new library.GeolocateControl({
        positionOptions:{enableHighAccuracy:false}, fitBoundsOptions:{maxZoom:12}, trackUserLocation:false,
      }),'top-right');
      atlasMap.on('error', event => {
        // A tile provider can fail independently of the atlas data and offline basemap.
        if (activeRenderer === 'street' && 'sourceId' in event && event.sourceId === 'streets') {
          showAtlas(copy.streetFailure);
        } else if (!interactive && !atlasMap.isStyleLoaded()) useListFallback();
        console.warn('Atlas map:', event.error.message);
      });
      atlasMap.on('load', () => {
        interactive = true;
        mapUnavailable = false;
        view.disabled = false;
        update();
        const initial = marks.get(place.value);
        if (initial && view.value !== 'list') lookAt(initial);
      });
      density.addEventListener('change',() => {
        pinsKey.hidden = density.checked;
        densityKey.hidden = !density.checked;
        atlasMap.setLayoutProperty('heat','visibility',density.checked ? 'visible' : 'none');
        for (const layer of ['clusters','counts','pins']) atlasMap.setLayoutProperty(layer,'visibility',density.checked ? 'none' : 'visible');
      });
      atlasMap.on('click','clusters', async event => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const cluster = Number(feature.properties.cluster_id);
        const zoom = await (atlasMap.getSource('places') as GeoJSONSource).getClusterExpansionZoom(cluster).catch(() => null);
        if (zoom !== null) atlasMap.easeTo({center:feature.geometry.coordinates as [number,number],zoom,duration:motion});
      });
      atlasMap.on('click','pins',event => {
        const id = (event.features?.[0] as MapGeoJSONFeature | undefined)?.properties?.id;
        const feature = marks.get(id);
        if (feature) lookAt(feature,false);
      });
      for (const layer of ['clusters','pins']) {
        atlasMap.on('mouseenter',layer,()=>{atlasMap.getCanvas().style.cursor = 'pointer';});
        atlasMap.on('mouseleave',layer,()=>{atlasMap.getCanvas().style.cursor = '';});
      }
    } catch {
      useListFallback();
    } finally {
      initializing = false;
    }
  }
  update();
}
