import type {Passport} from './passport.ts';
import {resolvePlaceId, type PlaceAliases} from './place-identity.ts';

const groups = ['saved','visits','collections'] as const;
type Group = typeof groups[number];
interface Change {revision: number; removed: boolean}
export type PassportChanges = Partial<Record<Group,Record<string,Change>>>;

export function passportMembers(passport: Passport) {
  return {
    saved:new Set(passport.saved),
    visits:new Set(passport.visits.map(visit => visit.id)),
    collections:new Set(passport.collections?.map(collection => collection.id)),
  };
}

function addChange(entries: Map<string,Change>, id: string, incoming: Change) {
  const current = entries.get(id);
  if (!current || incoming.revision > current.revision ||
    (incoming.revision === current.revision && incoming.removed)) entries.set(id,incoming);
}

function changeAt(changes: PassportChanges | undefined, group: Group, id: string) {
  const entries = changes?.[group];
  return entries && Object.hasOwn(entries,id) ? entries[id] : undefined;
}

function isRecord(value: unknown): value is Record<string,unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readPassportChanges(value: unknown, aliases: PlaceAliases = {}): PassportChanges | undefined {
  if (value === undefined) return undefined;
  const invalid = () => new Error('The passport contains invalid sync history.');
  if (!isRecord(value)) throw invalid();
  const changes: PassportChanges = {};
  for (const group of groups) {
    const records = value[group];
    if (records === undefined) continue;
    if (!isRecord(records)) throw invalid();
    const entries = new Map<string,Change>();
    for (const [id,item] of Object.entries(records)) {
      if (!id || id.length > 80 || !isRecord(item) || typeof item.revision !== 'number' ||
          !Number.isSafeInteger(item.revision) || item.revision < 1 || typeof item.removed !== 'boolean') throw invalid();
      const key = group === 'saved' ? resolvePlaceId(id,aliases) : id;
      addChange(entries,key,{revision:item.revision,removed:item.removed});
    }
    if (entries.size) changes[group] = Object.fromEntries(entries);
  }
  return Object.keys(changes).length ? changes : undefined;
}

export function recordPassportChanges(before: ReturnType<typeof passportMembers>, passport: Passport): PassportChanges | undefined {
  const after = passportMembers(passport);
  const changes: PassportChanges = {};
  for (const group of groups) {
    const entries = new Map(Object.entries(passport.changes?.[group] ?? {}));
    for (const id of new Set([...before[group], ...after[group]])) {
      const present = after[group].has(id);
      if (before[group].has(id) === present) continue;
      const revision = (entries.get(id)?.revision ?? 0) + 1;
      if (!Number.isSafeInteger(revision)) throw new Error('The passport sync history is too large.');
      entries.set(id,{revision,removed:!present});
    }
    if (entries.size) changes[group] = Object.fromEntries(entries);
  }
  return Object.keys(changes).length ? changes : undefined;
}

export function mergePassportChanges(current: PassportChanges | undefined, incoming: PassportChanges | undefined): PassportChanges | undefined {
  const changes: PassportChanges = {};
  for (const group of groups) {
    const entries = new Map(Object.entries(current?.[group] ?? {}));
    for (const [id,change] of Object.entries(incoming?.[group] ?? {})) addChange(entries,id,change);
    if (entries.size) changes[group] = Object.fromEntries(entries);
  }
  return Object.keys(changes).length ? changes : undefined;
}

export function passportAtChanges(passport: Passport, changes = passport.changes): Passport {
  function keeps(group: Group, id: string) {
    const winner = changeAt(changes,group,id);
    const ownRevision = changeAt(passport.changes,group,id)?.revision ?? 0;
    return !winner?.removed && (winner?.revision ?? 0) === ownRevision;
  }
  return {
    saved:passport.saved.filter(id => keeps('saved',id)),
    visits:passport.visits.filter(visit => keeps('visits',visit.id)),
    ...(passport.collections && {collections:passport.collections.filter(item => keeps('collections',item.id))}),
    ...(changes && {changes}),
  };
}
