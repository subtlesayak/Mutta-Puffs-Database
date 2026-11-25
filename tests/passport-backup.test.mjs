import assert from 'node:assert/strict';
import test from 'node:test';
import {formatPassportBackup, mergePassportBackups, mergeSyncedPassports, readPassportBackup} from '../src/lib/passport-backup.ts';
import {changePassport, readPassport, writePassport} from '../src/lib/passport.ts';

const archived = 'mpdb-retired01';
const canonical = 'mpdb-survivor01';
const visit = {id:'visit-one',placeId:archived,date:'2026-05-01',note:'Private note',spent:{amount:25,currency:'INR'}};
const original = {saved:[archived],visits:[visit],collections:[{id:'c1',name:'A collection',placeIds:[archived]}]};

function storageWith(passport) {
  const values = new Map();
  const storage = {getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value)};
  writePassport(storage,passport);
  return storage;
}

test('passport backups preserve private data and resolve retired place IDs', () => {
  const backup = formatPassportBackup({saved:[archived],visits:[visit]});
  const restored = readPassportBackup(backup,{[archived]:canonical});
  assert.deepEqual(restored,{saved:[canonical],visits:[{...visit,placeId:canonical}]});
  assert.deepEqual(mergePassportBackups(restored,restored),restored);
});

test('invalid dates and conflicting visits are rejected', () => {
  assert.throws(() => readPassportBackup(formatPassportBackup({
    saved:[archived],visits:[{...visit,date:'2026-02-30'}],
  })),/invalid visit/);
  assert.throws(() => mergePassportBackups(
    {saved:[],visits:[visit]},{saved:[],visits:[{...visit,note:'Different note'}]},
  ),/conflicts/);
});

test('encrypted sync snapshots round-trip without exposing Passport content', async () => {
  const {newSyncCode,syncAccess,sealPassport,openPassportSnapshot} = await import('../src/lib/passport-sync.ts');
  const first = await syncAccess(newSyncCode());
  const other = await syncAccess(newSyncCode());
  const sealed = await sealPassport(original,first.key,1);
  assert.equal(sealed.ciphertext.includes(visit.note),false);
  await assert.rejects(openPassportSnapshot(sealed,other.key,{}),/encrypted backup/);
  assert.deepEqual(await openPassportSnapshot(sealed,first.key,{}),original);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = new TextEncoder().encode('Mutta Puffs Passport encrypted backup v1');
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData},first.key,
    new TextEncoder().encode(formatPassportBackup(original)));
  const legacy = {revision:1,nonce:Buffer.from(nonce).toString('base64url'),ciphertext:Buffer.from(ciphertext).toString('base64url')};
  assert.deepEqual(await openPassportSnapshot(legacy,first.key,{}),original);
});

test('sync preserves removals against stale devices and propagates an explicit undo', () => {
  const device = storageWith(original);
  const removed = changePassport(device,book => {book.saved = []; book.visits = []; book.collections = [];});
  const stale = {...original,visits:[...original.visits,{...visit,id:'another-visit'}]};
  const merged = mergeSyncedPassports(removed,stale);
  assert.deepEqual(merged.saved,[]);
  assert.deepEqual(merged.collections,[]);
  assert.deepEqual(merged.visits.map(item => item.id),['another-visit']);
  assert.deepEqual(mergeSyncedPassports(stale,removed),merged);
  assert.equal(JSON.parse(formatPassportBackup(removed)).passport.changes,undefined);
  const snapshot = readPassportBackup(formatPassportBackup(removed,2));
  assert.deepEqual(snapshot,removed);
  const restored = changePassport(device,book => Object.assign(book,original));
  assert.deepEqual(mergeSyncedPassports(snapshot,restored),restored);
});

test('deletions follow retired pins and win when two devices change the same record', () => {
  const device = storageWith(original);
  const removed = changePassport(device,book => {book.saved = [];});
  const added = changePassport(storageWith({saved:[],visits:[]}),book => {book.saved.push(archived);});
  assert.deepEqual(mergeSyncedPassports(added,removed).saved,[]);
  const aliases = {[archived]:canonical};
  const normalized = readPassport(device,aliases);
  assert.equal(normalized.changes.saved[canonical].removed,true);
  assert.deepEqual(mergeSyncedPassports(normalized,{saved:[canonical],visits:[]}).saved,[]);
});

test('independent additions to an existing collection survive a sync', () => {
  const first = {...original,collections:[{...original.collections[0],placeIds:[archived,canonical]}]};
  const second = {...original,collections:[{...original.collections[0],placeIds:[archived,'mpdb-thirdplace']}]};
  assert.deepEqual(mergeSyncedPassports(first,second).collections[0].placeIds,[archived,canonical,'mpdb-thirdplace']);
});
