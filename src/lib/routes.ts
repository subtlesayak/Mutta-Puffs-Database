import {distanceKm} from './distance.ts';

export type Coordinate = [latitude: number, longitude: number];
export interface RoutePoint {location: Coordinate; distanceAlong: number; bearing: number; length: number; end: Coordinate}
export interface PitStopSearch {
  segments: Coordinate[][];
  pins: (Coordinate | null)[];
  radius: number;
}
interface PitStopMatch {index: number; offset: number; distanceAlong: number}
export type PitStopResult = {matches: PitStopMatch[]} | {error: string};
const earth = 6371;
const rad = Math.PI / 180;

export function readGpx(xml: string): Coordinate[][] {
  if (/<!DOCTYPE/i.test(xml)) throw new Error('Choose a GPX file without a custom document type.');
  const document = new DOMParser().parseFromString(xml,'application/xml');
  if (document.documentElement.localName !== 'gpx' || document.getElementsByTagName('parsererror').length) {
    throw new Error('Choose a valid GPX file.');
  }
  const tracks = [...document.getElementsByTagNameNS('*','trkseg')];
  const routes = [...document.getElementsByTagNameNS('*','rte')];
  let count = 0;
  const segments = [...tracks,...routes].map(segment => {
    const type = segment.localName === 'trkseg' ? 'trkpt' : 'rtept';
    return [...segment.getElementsByTagNameNS('*',type)].map(point => {
      if (++count > 20_000) throw new Error('Choose a GPX route with 20,000 points or fewer.');
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      const coordinate: Coordinate = [Number(lat),Number(lon)];
      if (!lat?.trim() || !lon?.trim() || !coordinate.every(Number.isFinite) ||
          Math.abs(coordinate[0]) > 90 || Math.abs(coordinate[1]) > 180) {
        throw new Error('The GPX file contains an invalid coordinate.');
      }
      return coordinate;
    });
  }).filter(points=>points.length > 1);
  if (!segments.length) throw new Error('Choose a GPX track or route containing at least two points.');
  return segments;
}

function bearing([lat1,lon1]: Coordinate, [lat2,lon2]: Coordinate) {
  const delta = (lon2 - lon1) * rad;
  return Math.atan2(Math.sin(delta) * Math.cos(lat2 * rad),
    Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos(delta));
}

export function routeSegments(segments: Coordinate[][]): RoutePoint[] {
  const route: RoutePoint[] = [];
  let distanceAlong = 0;
  for (const segment of segments) {
    for (let index = 1; index < segment.length; index++) {
      const location = segment[index - 1];
      const end = segment[index];
      const length = distanceKm(location,end);
      if (length > 0) route.push({location,end,distanceAlong,length,bearing:bearing(location,end)});
      distanceAlong += length;
    }
  }
  return route;
}

export function nearestRoutePoint(place: Coordinate, route: RoutePoint[]) {
  let nearest = {offset:Infinity, distanceAlong:0};
  for (const segment of route) {
    const startDistance = distanceKm(segment.location,place);
    const delta = startDistance / earth;
    const angle = bearing(segment.location,place) - segment.bearing;
    const along = earth * Math.atan2(Math.sin(delta) * Math.cos(angle),Math.cos(delta));
    let distanceAlong: number;
    let offset: number;
    if (along >= 0 && along <= segment.length && segment.length < Math.PI * earth - 1) {
      distanceAlong = segment.distanceAlong + along;
      offset = earth * Math.abs(Math.asin(Math.max(-1,Math.min(1,Math.sin(delta) * Math.sin(angle)))));
    } else {
      const endDistance = distanceKm(segment.end,place);
      offset = Math.min(startDistance,endDistance);
      distanceAlong = segment.distanceAlong + (endDistance < startDistance ? segment.length : 0);
    }
    if (offset < nearest.offset) nearest = {offset,distanceAlong};
  }
  return nearest;
}

export function searchPitStops({segments,pins,radius}: PitStopSearch): PitStopResult {
  const route = routeSegments(segments);
  if (!route.length) return {error:'The route needs at least two different coordinates.'};
  const matches = pins.flatMap((point,index) => {
    if (!point) return [];
    const closest = nearestRoutePoint(point,route);
    return closest.offset <= radius ? [{index,...closest}] : [];
  }).sort((a,b) => a.distanceAlong - b.distanceAlong || a.offset - b.offset);
  return {matches};
}
