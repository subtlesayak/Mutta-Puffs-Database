import {importLibrary, setOptions} from '@googlemaps/js-api-loader';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Feature, Point} from 'geojson';

export interface GooglePin {id: string; name: string}
export interface GoogleConfig {key: string; mapId: string}

export async function openGoogleMap<T extends GooglePin>(
  element: HTMLElement,
  config: GoogleConfig,
  selectPin: (pin: Feature<Point,T>) => void,
  onAuthFailure: () => void,
) {
  const windowWithAuth = window as Window & {gm_authFailure?: () => void};
  windowWithAuth.gm_authFailure = onAuthFailure;
  setOptions({key:config.key, v:'quarterly', mapIds:[config.mapId], authReferrerPolicy:'origin'});
  const [{Map, InfoWindow}, {AdvancedMarkerElement}] = await Promise.all([
    importLibrary('maps') as Promise<google.maps.MapsLibrary>,
    importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
  ]);
  const map = new Map(element, {
    center:{lat:11,lng:75.8}, zoom:5, mapId:config.mapId,
    mapTypeControl:false, streetViewControl:false, fullscreenControl:true,
  });
  const windowForPin = new InfoWindow();
  const cluster = new MarkerClusterer({map,markers:[]});
  const position = (pin: Feature<Point,T>) => ({lat:pin.geometry.coordinates[1],lng:pin.geometry.coordinates[0]});

  function update(pins: Feature<Point,T>[]) {
    windowForPin.close();
    cluster.clearMarkers(true);
    cluster.addMarkers(pins.map(pin => {
      const marker = new AdvancedMarkerElement({position:position(pin),title:pin.properties.name,gmpClickable:true});
      marker.addEventListener('gmp-click',() => selectPin(pin));
      return marker;
    }));
    if (pins.length === 1) {
      map.setCenter(position(pins[0]));
      map.setZoom(15);
    }
    if (pins.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      for (const pin of pins) bounds.extend(position(pin));
      map.fitBounds(bounds,50);
    }
  }

  function focus(pin: Feature<Point,T>, content: HTMLElement, move: boolean) {
    const target = position(pin);
    if (move) {
      map.setCenter(target);
      map.setZoom(Math.max(14,map.getZoom() ?? 0));
    }
    windowForPin.setContent(content);
    windowForPin.setPosition(target);
    windowForPin.open({map,shouldFocus:false});
  }

  return {update,focus,clear:() => windowForPin.close()};
}
