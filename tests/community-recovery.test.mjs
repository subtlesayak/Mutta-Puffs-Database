import assert from 'node:assert/strict';
import {execFile, spawn} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {mkdtemp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {newSyncCode,openPassportSnapshot,sealPassport,syncAccess} from '../src/lib/passport-sync.ts';

const communityScript = fileURLToPath(new URL('../server/community.mjs',import.meta.url));
const backupScript = fileURLToPath(new URL('../server/backup.mjs',import.meta.url));
const run = promisify(execFile);
const origin = 'https://subtlesayak.github.io';

async function startService(database, credential) {
  const child = spawn(process.execPath,[communityScript],{
    env:{...process.env,PORT:'0',MPDB_HOST:'127.0.0.1',MPDB_DATABASE_PATH:database,
      MPDB_ALLOWED_ORIGINS:origin,MPDB_MODERATOR_TOKEN_FILE:credential},
    stdio:['ignore','pipe','pipe'],
  });
  const ended = once(child,'exit');
  const lines = createInterface({input:child.stdout});
  let diagnostic = '';
  child.stderr.on('data',chunk => diagnostic += chunk);

  let port;
  try {
    port = await Promise.race([
      once(lines,'line',{signal:AbortSignal.timeout(5000)}).then(([line]) => /^Community API listening on port (\d+)$/.exec(line)?.[1]),
      ended.then(() => undefined),
    ]);
    assert.ok(port,'Community service did not start: ' + diagnostic);
  } catch (error) {
    child.kill('SIGKILL');
    await ended.catch(() => {});
    throw error;
  } finally {
    lines.close();
  }

  return {
    request(route,{method='GET',token,body}={}) {
      return fetch('http://127.0.0.1:' + port + route,{
        method,
        headers:{Origin:origin,...(token && {Authorization:'Bearer ' + token}),
          ...(body && {'Content-Type':'application/json'})},
        body:body && JSON.stringify(body),
        signal:AbortSignal.timeout(5000),
      });
    },
    async stop() {
      child.kill('SIGTERM');
      const [code,signal] = await ended;
      assert.equal(signal,null);
      assert.equal(code,0,diagnostic);
    },
  };
}

test('moderation and encrypted Passport data survive a shutdown and a live database backup', {timeout:25_000}, async () => {
  const directory = await mkdtemp(join(tmpdir(),'mpdb-recovery-'));
  const database = join(directory,'atlas.sqlite');
  const snapshot = join(directory,'backup.sqlite');
  const credential = join(directory,'moderator-token');
  const moderator = randomBytes(32).toString('base64url');
  await writeFile(credential,moderator + '\n',{mode:0o600});
  let service;

  const receiptToken = randomBytes(32).toString('base64url');
  const id = randomUUID();
  const receiptRoute = '/v1/submissions/' + id;
  const queue = '/v1/moderation/submissions';
  const passport = {saved:['mpdb-7b2be6dd7ad3'],visits:[]};
  const access = await syncAccess(newSyncCode());
  const slot = '/v1/passport-sync/' + access.id;
  const backupOptions = {env:{...process.env,MPDB_DATABASE_PATH:database},timeout:8000};
  try {
    service = await startService(database,credential);
    assert.equal((await service.request('/health')).status,200);
    assert.equal((await service.request('/v1/submissions',{method:'POST',body:{
      id,token:receiptToken,kind:'heritage',consent:true,
      fields:{story_title:'Recovery fixture',story:'A synthetic submission for recovery testing.'},
    }})).status,201);
    const encrypted = await sealPassport(passport,access.key,0);
    assert.equal((await service.request(slot,{method:'PUT',token:access.token,body:encrypted})).status,200);

    await run(process.execPath,[backupScript,snapshot],backupOptions);
    assert.equal((await stat(database)).mode & 0o777,0o600);
    assert.equal((await stat(snapshot)).mode & 0o777,0o600);
    const originalSnapshot = await readFile(snapshot);
    await assert.rejects(run(process.execPath,[backupScript,snapshot],backupOptions),/already exists/);
    assert.deepEqual(await readFile(snapshot),originalSnapshot);
    assert.equal((await readdir(directory)).some(name => name.startsWith('.mpdb-backup-')),false);

    const approval = await service.request(queue + '/' + id,{method:'PATCH',token:moderator,body:{status:'approved'}});
    assert.equal(approval.status,200);
    await service.stop();
    service = await startService(database,credential);
    assert.equal((await (await service.request(receiptRoute,{token:receiptToken})).json()).status,'approved');
    let recovered = await (await service.request(slot,{token:access.token})).json();
    assert.deepEqual(await openPassportSnapshot(recovered,access.key,{}),passport);

    await service.stop();
    service = await startService(snapshot,credential);
    const restoredQueue = await (await service.request(queue,{token:moderator})).json();
    assert.deepEqual(restoredQueue.submissions.map(item => item.id),[id]);
    assert.equal((await (await service.request(receiptRoute,{token:receiptToken})).json()).status,'pending');
    recovered = await (await service.request(slot,{token:access.token})).json();
    assert.deepEqual(await openPassportSnapshot(recovered,access.key,{}),passport);
  } finally {
    try {await service?.stop();}
    finally {await rm(directory,{recursive:true,force:true});}
  }
});
