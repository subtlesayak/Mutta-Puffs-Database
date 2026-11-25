import type {Collection, Passport, Visit} from './passport.ts';
import {resolvePlaceId} from './place-identity.ts';
import type {PlaceAliases} from './place-identity.ts';

export const passportBackupLimit = 2 * 1024 * 1024;
const placeId = /^mpdb-[a-z0-9]{8,24}$/;
const backupFormat = 'mutta-puffs-passport';

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0,10) === value;
}

function parseVisit(value: unknown, aliases: PlaceAliases): Visit {
  const item = record(value);
  if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 80 ||
      typeof item.placeId !== 'string' || !placeId.test(item.placeId) ||
      !validDate(item.date) || typeof item.note !== 'string' || item.note.length > 500) {
    throw new Error('The backup contains an invalid visit.');
  }
  const visit: Visit = {id:item.id, placeId:resolvePlaceId(item.placeId,aliases), date:item.date, note:item.note};
  if (item.spent !== undefined) {
    const spent = record(item.spent);
    if (!spent || typeof spent.amount !== 'number' || !Number.isFinite(spent.amount) ||
        spent.amount < 0 || spent.amount > 1_000_000 || typeof spent.currency !== 'string' || !/^[A-Z]{3}$/.test(spent.currency)) {
      throw new Error('The backup contains an invalid amount or currency.');
    }
    visit.spent = {amount:spent.amount, currency:spent.currency};
  }
  return visit;
}

export function formatPassportBackup(passport: Passport): string {
  return JSON.stringify({format:backupFormat, version:1, passport}, null, 2) + '\n';
}

export function readPassportBackup(text: string, aliases: PlaceAliases = {}): Passport {
  if (new TextEncoder().encode(text).length > passportBackupLimit) throw new Error('Choose a passport backup smaller than 2 MB.');
  let source: Record<string, unknown> | null;
  try {source = record(JSON.parse(text));}
  catch {throw new Error('Choose a valid Puff Passport JSON backup.');}
  if (source?.format !== backupFormat || source.version !== 1) throw new Error('Choose a supported Puff Passport backup.');
  const book = record(source.passport);
  if (!book || !Array.isArray(book.saved) || !Array.isArray(book.visits)) throw new Error('The backup is missing saved places or visits.');
  const saved = book.saved.map(id => {
    if (typeof id !== 'string' || !placeId.test(id)) throw new Error('The backup contains an invalid place ID.');
    return resolvePlaceId(id, aliases);
  });
  const result: Passport = {saved,visits:book.visits.map(item => parseVisit(item, aliases))};
  if (book.collections !== undefined) {
    if (!Array.isArray(book.collections)) throw new Error('The backup contains invalid collections.');
    result.collections = book.collections.map(value => {
      const item = record(value);
      if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 80 ||
          typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || !Array.isArray(item.placeIds)) {
        throw new Error('The backup contains an invalid collection.');
      }
      const placeIds = item.placeIds.map(id => {
        if (typeof id !== 'string' || !placeId.test(id)) throw new Error('A collection contains an invalid place ID.');
        return resolvePlaceId(id,aliases);
      });
      return {id:item.id,name:item.name,placeIds:[...new Set(placeIds)]};
    });
  }
  return mergePassportBackups({saved:[],visits:[]},result);
}

export function mergePassportBackups(current: Passport, incoming: Passport): Passport {
  const visits = new Map(current.visits.map(visit => [visit.id,visit]));
  for (const visit of incoming.visits) {
    const previous = visits.get(visit.id);
    if (previous && (previous.placeId !== visit.placeId || previous.date !== visit.date || previous.note !== visit.note ||
      previous.spent?.amount !== visit.spent?.amount || previous.spent?.currency !== visit.spent?.currency)) {
      throw new Error('A visit in this backup conflicts with a visit already in this passport.');
    }
    visits.set(visit.id, previous ?? visit);
  }
  const merged: Passport = {saved:[...new Set([...current.saved,...incoming.saved])], visits:[...visits.values()]};
  if (current.collections || incoming.collections) {
    const collections = new Map<string,Collection>();
    for (const item of [...(current.collections ?? []),...(incoming.collections ?? [])]) {
      const previous = collections.get(item.id);
      if (previous && previous.name !== item.name) throw new Error('A saved collection has a conflicting name.');
      collections.set(item.id,{...item,placeIds:[...new Set([...(previous?.placeIds ?? []),...item.placeIds])]});
    }
    merged.collections = [...collections.values()];
  }
  return merged;
}
