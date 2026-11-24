import maplibregl, {type GeoJSONSource, type MapGeoJSONFeature} from 'maplibre-gl';
import type {Feature, FeatureCollection, Point} from 'geojson';
import {accuracyLabels, path, placeCount, placePath} from '../lib/format';
import type {Accuracy, City} from '../lib/types';
import type {openGoogleMap} from './google-map';

interface Pin {id: string; name: string; accuracy: Accuracy; status: string; city: string | null; state: string | null}
type Pins = FeatureCollection<Point,Pin>;

export async function startMap() {
  const root = document.querySelector<HTMLElement>('[data-atlas-map]');
  if (!root) return;
  const canvas = root.querySelector<HTMLElement>('[data-map-canvas]')!;
  const status = root.querySelector<HTMLElement>('[data-map-status]')!;
  const selection = root.querySelector<HTMLElement>('[data-selection]')!;
  const city = root.querySelector<HTMLSelectElement>('[name=city]')!;
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
  const urlCity = params.get('city');
  const urlPlace = params.get('place');
  const unavailable = () => { status.textContent = 'The map is unavailable on this device. Use the place list below.'; };

  let map: maplibregl.Map;
  let pins: Pins;
  let cities: City[];
  try {
    const [pinResponse,cityResponse] = await Promise.all([fetch(path('api/v1/places.geojson')),fetch(path('api/v1/cities.json'))]);
    if (!pinResponse.ok || !cityResponse.ok) throw new Error('Map data unavailable');
    pins = await pinResponse.json();
    ({cities} = await cityResponse.json());
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
    for (const [key, value] of [['city',city.value],['place',place.value]]) {
      if (value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    history.replaceState(null,'',url);
  };
  const update = () => {
    const selected = cities.find(item => item.id === city.value);
    const allowed = selected ? new Set(selected.place_ids) : null;
    const points = pins.features.filter(feature =>
      (!allowed || allowed.has(feature.properties.id)) && (!accuracy.value || feature.properties.accuracy === accuracy.value));
    const data: Pins = {type:'FeatureCollection',features:points};
    (map.getSource('places') as GeoJSONSource).setData(data);
    (map.getSource('density') as GeoJSONSource).setData(data);
    const current = place.value;
    place.replaceChildren(new Option('Choose a place',''), ...points.slice().sort((a,b)=>a.properties.name.localeCompare(b.properties.name))
      .map(p => new Option(p.properties.name + (p.properties.city ? ' · ' + p.properties.city : ''),p.properties.id)));
    if (points.some(p=>p.properties.id === current)) place.value = current;
    status.textContent = points.length ? placeCount(points.length) + ' on the map' : 'No pins match these filters.';
    currentPopup?.remove();
    selection.replaceChildren();
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
    if (urlCity && cities.some(item=>item.id === urlCity)) city.value = urlCity;
    update();
    const initial = urlPlace && marks.get(urlPlace);
    if (initial && [...place.options].some(option => option.value === urlPlace)) lookAt(initial);
    city.addEventListener('change',update);
    accuracy.addEventListener('change',update);
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
