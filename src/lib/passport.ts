import {resolvePlaceId} from './place-identity.ts';
import type {PlaceAliases} from './place-identity.ts';

export interface Visit {
  id: string;
  placeId: string;
  date: string;
  note: string;
  spent?: {amount: number; currency: string};
}

export interface Collection {id: string; name: string; placeIds: string[]}
export interface Passport {saved: string[]; visits: Visit[]; collections?: Collection[]}
interface Destination {name: string; city: string | null; country: string | null}
type StorageAccess = Pick<Storage,'getItem' | 'setItem'>;
const key = 'mpdb-passport-v1';

export function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2,'0');
  const day = String(date.getDate()).padStart(2,'0');
  return date.getFullYear() + '-' + month + '-' + day;
}

export function readPassport(storage: StorageAccess, aliases: PlaceAliases = {}): Passport {
  const saved = storage.getItem(key);
  if (!saved) return {saved:[],visits:[]};
  const data = JSON.parse(saved) as Passport;
  if (!Array.isArray(data.saved) || !Array.isArray(data.visits)) throw new Error('Passport could not be read');
  return {
    saved: [...new Set(data.saved.map(id => resolvePlaceId(id, aliases)))],
    visits: data.visits.map(visit => ({...visit,placeId:resolvePlaceId(visit.placeId, aliases)})),
    ...(Array.isArray(data.collections) ? {collections:data.collections.map(collection=>({
      ...collection,placeIds:[...new Set(collection.placeIds.map(id=>resolvePlaceId(id,aliases)))],
    }))} : {}),
  };
}

export function changePassport(storage: StorageAccess, update: (passport: Passport) => void, aliases: PlaceAliases = {}) {
  const passport = readPassport(storage, aliases);
  update(passport);
  storage.setItem(key,JSON.stringify(passport));
  return passport;
}

export function toggleSaved(storage: StorageAccess, id: string, aliases: PlaceAliases = {}) {
  id = resolvePlaceId(id, aliases);
  return changePassport(storage, passport => {
    const index = passport.saved.indexOf(id);
    if (index === -1) passport.saved.push(id);
    else passport.saved.splice(index,1);
  }, aliases);
}

export function recap(visits: Visit[], year: number, places: Map<string,Destination>) {
  const entries = visits.filter(visit => visit.date.startsWith(year + '-'));
  const counts = new Map<string,number>();
  const cities = new Set<string>();
  const countries = new Set<string>();
  const spent: Record<string,number> = {};
  let paidVisits = 0;
  for (const visit of entries) {
    counts.set(visit.placeId,(counts.get(visit.placeId) ?? 0) + 1);
    const place = places.get(visit.placeId);
    if (place?.city) cities.add(place.city);
    if (place?.country) countries.add(place.country);
    if (visit.spent) {
      const {currency, amount} = visit.spent;
      spent[currency] = (spent[currency] ?? 0) + amount;
      paidVisits++;
    }
  }
  const mostVisited = [...counts.entries()].filter(([id]) => places.has(id)).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {visits:entries.length,places:counts.size,cities:cities.size,countries:countries.size,spent,paidVisits,
    favourite:mostVisited ? {name:places.get(mostVisited[0])!.name,count:mostVisited[1]} : null};
}
