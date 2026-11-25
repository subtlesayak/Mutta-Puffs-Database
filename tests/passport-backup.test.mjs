import assert from 'node:assert/strict';
import test from 'node:test';
import {formatPassportBackup, mergePassportBackups, readPassportBackup} from '../src/lib/passport-backup.ts';

const archived = 'mpdb-retired01';
const canonical = 'mpdb-survivor01';
const visit = {id:'visit-one',placeId:archived,date:'2026-05-01',note:'Private note',spent:{amount:25,currency:'INR'}};

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
  const original = {saved:[archived],visits:[visit],collections:[{id:'c1',name:'A collection',placeIds:[archived]}]};
  const sealed = await sealPassport(original,first.key,1);
  assert.equal(sealed.ciphertext.includes(visit.note),false);
  await assert.rejects(openPassportSnapshot(sealed,other.key,{}),/encrypted backup/);
  assert.deepEqual(await openPassportSnapshot(sealed,first.key,{}),original);
});
