import maplibregl, {type GeoJSONSource, type MapGeoJSONFeature} from 'maplibre-gl';
import type {Feature, FeatureCollection, Point} from 'geojson';
import {accuracyLabels, path, placeCount, placePath} from '../lib/format';
import {metricMatcher} from '../lib/metric-filters';
import type {Accuracy, City, PlaceMetrics, Trail} from '../lib/types';
import type {openGoogleMap} from './google-map';

interface Pin {id: string; name: string; accuracy: Accuracy; status: string; city: string | null; state: string | null; country: string | null; district: string | null}
type Pins = FeatureCollection<Point,Pin>;

export async function startMap() {
  const root = document.querySelector<HTMLElement>('[data-atlas-map]');
  if (!root) return;
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
  const googleCanvas = root.querySelector<HTMLElement>('[data-google-canvas]');
  const renderer = root.querySelector<HTMLSelectElement>('[name=renderer]');
  let googleView: Awaited<ReturnType<typeof openGoogleMap<Pin>>> | null = null;
  let googlePending: Promise<Awaited<ReturnType<typeof openGoogleMap<Pin>>>> | null = null;
  let activeRenderer: 'atlas' | 'google' = 'atlas';
  let rendererRequest = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
  const params = new URLSearchParams(location.search);
  const urlPlace = params.get('place');
  const linkedFilters = [city, region, district, trail, verification, accuracy, view];
  const unavailable = () => {
    status.textContent = 'The map is unavailable on this device. Use the place list below.';
    frame.hidden = true;
    form.hidden = true;
  };

  let map: maplibregl.Map;
  let pins: Pins;
  let cities: City[];
  let trails: Trail[];
  let metrics: Record<string,PlaceMetrics>;
  try {
    const responses = await Promise.all(['places.geojson','cities.json','trails.json','place-metrics.json'].map(file => fetch(path('api/v1/' + file))));
    if (responses.some(response => !response.ok)) throw new Error('Map data unavailable');
    [pins, {cities}, {trails}, {place_metrics:metrics}] = await Promise.all(responses.map(response => response.json()));
    map = new maplibregl.Map({
      container: canvas, center: [75.8,11], zoom: 4.5, minZoom: 1, maxZoom: 16,
      style: {version: 8, sources: {
        land: {type: 'geojson', data: path('basemap.geojson'), attribution: 'Natural Earth'},
        places: {type: 'geojson', data: pins, cluster: true, clusterRadius: 42, clusterMaxZoom: 13},
        density: {type: 'geojson', data: pins},
      }, layers: [
        {id: 'water', type: 'background', paint: {'background-color': '#e4ebdf'}},
        {id: 'land', type: 'fill', source: 'land', paint: {'fill-color':'#fff4dc'}},
        {id: 'boundaries', type: 'line', source: 'land', paint: {'line-color':'#aa9877','line-width':.75}},
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
  } catch {
    unavailable();
    return;
  }
  const marks = new Map(pins.features.map(feature => [feature.properties.id,feature]));
  const lookAt = (feature: Feature<Point,Pin>, fly = true) => {
    const center = feature.geometry.coordinates as [number,number];
    if (fly && activeRenderer === 'atlas') map.easeTo({center,zoom:Math.max(11,map.getZoom()),duration:motion});
    const a = document.createElement('a');
    a.textContent = feature.properties.name;
    a.href = placePath(feature.properties.id);
    const detail = document.createElement('p');
    detail.append(a, document.createTextNode(' · ' + accuracyLabels[feature.properties.accuracy]));
    selection.replaceChildren(detail);
    const popup = document.createElement('div');
    popup.append(a.cloneNode(true),document.createElement('br'),document.createTextNode(accuracyLabels[feature.properties.accuracy]));
    if (activeRenderer === 'google') {
      googleView?.focus(feature,popup,fly);
    } else {
      currentPopup?.remove();
      currentPopup = new maplibregl.Popup({offset:12}).setLngLat(center).setDOMContent(popup).addTo(map);
    }
    place.value = feature.properties.id;
    saveView();
  };
  let currentPopup: maplibregl.Popup | null = null;
  const saveView = () => {
    const url = new URL(location.href);
    for (const {name,value} of [...linkedFilters, place]) {
      if (value && !(name === 'view' && value === 'map')) url.searchParams.set(name,value);
      else url.searchParams.delete(name);
    }
    history.replaceState(null,'',url);
  };
  const update = () => {
    const selected = cities.find(item => item.id === city.value);
    const allowed = selected ? new Set(selected.place_ids) : null;
    const route = trails.find(item => item.id === trail.value);
    const stops = route ? new Set(route.place_ids) : null;
    const matchesMetric = metricMatcher(form);
    const active = [...form.querySelectorAll<HTMLSelectElement | HTMLInputElement>(
      '[name=region],[name=district],[name=trail],[name=accuracy],[name=verification],[name=price_status],[name=currency],[name=max_price],[name=min_score]',
    )].filter(control => !control.disabled && control.value).length;
    filterCount.textContent = active ? ' · ' + active + ' active' : '';
    const points = pins.features.filter(({properties: pin}) =>
      (!allowed || allowed.has(pin.id)) && (!stops || stops.has(pin.id)) &&
      (!region.value || [pin.state,pin.country].includes(region.value)) &&
      (!district.value || [pin.district,pin.state].filter(Boolean).join(' · ') === district.value) &&
      (!verification.value || pin.status === verification.value) &&
      (!accuracy.value || pin.accuracy === accuracy.value) && matchesMetric(metrics[pin.id]));
    if (route) points.sort((a,b) => route.place_ids.indexOf(a.properties.id) - route.place_ids.indexOf(b.properties.id));
    const data: Pins = {type:'FeatureCollection',features:points};
    (map.getSource('places') as GeoJSONSource).setData(data);
    (map.getSource('density') as GeoJSONSource).setData(data);
    const current = place.value;
    place.replaceChildren(new Option('Choose a place',''), ...points.slice().sort((a,b)=>a.properties.name.localeCompare(b.properties.name))
      .map(p => new Option(p.properties.name + (p.properties.city ? ' · ' + p.properties.city : ''),p.properties.id)));
    if (points.some(p=>p.properties.id === current)) place.value = current;
    const showList = view.value === 'list';
    list.hidden = !showList;
    frame.hidden = showList;
    density.disabled = showList || activeRenderer === 'google';
    place.disabled = showList;
    if (renderer) renderer.disabled = showList;
    status.textContent = points.length ? placeCount(points.length) + (showList ? ' in the list' : ' on the map') : 'No pins match these filters. Try a different city or clear a filter.';
    if (showList) {
      list.replaceChildren(...points.map(({properties:pin}) => {
        const li = document.createElement('li');
        li.className = 'place-card';
        const link = document.createElement('a');
        link.href = placePath(pin.id);
        link.textContent = pin.name;
        const note = document.createElement('p');
        note.className = 'muted';
        note.textContent = [pin.city, accuracyLabels[pin.accuracy]].filter(Boolean).join(' · ');
        li.append(link,note);
        return li;
      }));
    } else if (activeRenderer === 'atlas') map.resize();
    currentPopup?.remove();
    selection.replaceChildren();
    if (showList) {saveView(); return;}
    if (activeRenderer === 'google') googleView?.update(points);
    else if (points.length === 1) map.easeTo({center: points[0].geometry.coordinates as [number,number],zoom:11,duration:motion});
    else if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const point of points) bounds.extend(point.geometry.coordinates as [number,number]);
      map.fitBounds(bounds,{padding:50,maxZoom:11,duration:motion});
    }
    saveView();
  };

  function showAtlas(message = '') {
    rendererRequest++;
    activeRenderer = 'atlas';
    if (renderer) renderer.value = 'atlas';
    if (googleCanvas) googleCanvas.hidden = true;
    canvas.hidden = false;
    density.disabled = false;
    pinsKey.hidden = density.checked;
    densityKey.hidden = !density.checked;
    map.resize();
    update();
    const selected = marks.get(place.value);
    if (selected) lookAt(selected);
    if (message) status.textContent = message;
  }

  async function switchMap() {
    if (!googleCanvas || !renderer || !root?.dataset.googleKey || !root.dataset.googleId) return;
    if (renderer.value !== 'google') {showAtlas(); return;}
    const request = ++rendererRequest;
    const failure = 'Google Maps could not load. The atlas map is available.';
    status.textContent = 'Loading Google Maps…';
    try {
      const config = {key:root.dataset.googleKey,mapId:root.dataset.googleId};
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

  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  if (navigator.geolocation) map.addControl(new maplibregl.GeolocateControl({
    positionOptions:{enableHighAccuracy:false}, fitBoundsOptions:{maxZoom:12}, trackUserLocation:false,
  }),'top-right');
  map.on('error', event => {
    if (!map.isStyleLoaded() && !status.textContent?.includes('places on')) unavailable();
    console.warn('Atlas map:', event.error.message);
  });
  map.on('load', () => {
    for (const filter of linkedFilters) {
      const requested = params.get(filter.name);
      if (requested && [...filter.options].some(option => option.value === requested)) filter.value = requested;
    }
    update();
    const initial = urlPlace && marks.get(urlPlace);
    if (initial && view.value !== 'list' && [...place.options].some(option => option.value === urlPlace)) lookAt(initial);
    for (const filter of linkedFilters) filter.addEventListener('change',update);
    form.querySelector('.metric-filters')?.addEventListener('input',update);
    form.addEventListener('submit',event => event.preventDefault());
    renderer?.addEventListener('change',() => {void switchMap();});
    place.addEventListener('change',() => {
      const feature = marks.get(place.value);
      if (feature) lookAt(feature); else { currentPopup?.remove(); googleView?.clear(); selection.replaceChildren(); saveView(); }
    });
    density.addEventListener('change',() => {
      pinsKey.hidden = density.checked;
      densityKey.hidden = !density.checked;
      map.setLayoutProperty('heat','visibility',density.checked ? 'visible' : 'none');
      for (const layer of ['clusters','counts','pins']) map.setLayoutProperty(layer,'visibility',density.checked ? 'none' : 'visible');
    });
    map.on('click','clusters', async event => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== 'Point') return;
      const cluster = Number(feature.properties.cluster_id);
      const zoom = await (map.getSource('places') as GeoJSONSource).getClusterExpansionZoom(cluster).catch(() => null);
      if (zoom !== null) map.easeTo({center:feature.geometry.coordinates as [number,number],zoom,duration:motion});
    });
    map.on('click','pins',event => {
      const id = (event.features?.[0] as MapGeoJSONFeature | undefined)?.properties?.id;
      const feature = marks.get(id);
      if (feature) lookAt(feature,false);
    });
    for (const layer of ['clusters','pins']) {
      map.on('mouseenter',layer,()=>{map.getCanvas().style.cursor = 'pointer';});
      map.on('mouseleave',layer,()=>{map.getCanvas().style.cursor = '';});
    }
  });
}
