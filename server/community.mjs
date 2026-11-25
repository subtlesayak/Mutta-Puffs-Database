import {createHash, createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {pathToFileURL} from 'node:url';
import {parseSubmission, publicationReference} from './submissions.mjs';

const statuses = new Set(['pending', 'approved', 'rejected', 'published']);
const transitions = {
  pending: new Set(['approved', 'rejected']),
  approved: new Set(['pending', 'rejected', 'published']),
  rejected: new Set(['pending']),
  published: new Set(),
};
const hash = value => createHash('sha256').update(value).digest();
const sameSecret = (left, right) => timingSafeEqual(hash(left), hash(right));
const bodyLimit = 12_000;
const syncBodyLimit = 3_000_000;
const syncSlot = /^\/v1\/passport-sync\/([A-Za-z0-9_-]{43})$/;
const requestId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const receiptToken = /^[a-zA-Z0-9_-]{43}$/;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function jsonBody(request, maximum = bodyLimit) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new RequestError(415, 'Use a JSON request.');
  }
  if (Number(request.headers['content-length']) > maximum) throw new RequestError(413, 'The contribution is too large.');
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maximum) {
      request.resume();
      throw new RequestError(413, 'The contribution is too large.');
    }
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch {throw new RequestError(400, 'The request contains invalid JSON.');}
}

export function openCommunityDatabase(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY, receipt_hash TEXT NOT NULL, status TEXT NOT NULL, kind TEXT NOT NULL,
      payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      reference TEXT, reason TEXT
    );
    CREATE INDEX IF NOT EXISTS submissions_status ON submissions(status, created_at DESC);
    CREATE TABLE IF NOT EXISTS passport_sync (
      id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, revision INTEGER NOT NULL,
      nonce TEXT NOT NULL, ciphertext TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function createCommunityServer({db, origins, moderatorToken}) {
  if (Buffer.byteLength(moderatorToken ?? '') < 32) throw new Error('Set MPDB_MODERATOR_TOKEN to a secret of at least 32 bytes.');
  if (!origins.length || origins.some(origin => new URL(origin).origin !== origin)) throw new Error('Set MPDB_ALLOWED_ORIGINS to exact browser origins.');
  const allowedOrigins = new Set(origins);
  const limits = new Map();
  const salt = randomBytes(32);
  const read = db.prepare('SELECT * FROM submissions WHERE id = ?');
  const write = db.prepare('INSERT INTO submissions (id, receipt_hash, status, kind, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const update = db.prepare('UPDATE submissions SET status = ?, updated_at = ?, reference = ?, reason = ? WHERE id = ? AND status = ?');
  const list = db.prepare('SELECT * FROM submissions WHERE status = ? ORDER BY created_at DESC LIMIT 50');
  const readSync = db.prepare('SELECT * FROM passport_sync WHERE id = ?');
  const createSync = db.prepare('INSERT OR IGNORE INTO passport_sync VALUES (?, ?, 1, ?, ?, ?)');
  const updateSync = db.prepare('UPDATE passport_sync SET revision = revision + 1, nonce = ?, ciphertext = ?, updated_at = ? WHERE id = ? AND revision = ?');
  const removeSync = db.prepare('DELETE FROM passport_sync WHERE id = ?');
  const receipt = row => ({id:row.id, status:row.status, created_at:row.created_at, updated_at:row.updated_at, reference:row.reference, reason:row.reason});

  function limit(request) {
    const bucket = Math.floor(Date.now() / 600_000);
    const key = createHmac('sha256', salt).update(request.socket.remoteAddress ?? 'local').digest('hex');
    const entry = limits.get(key);
    const count = entry?.bucket === bucket ? entry.count + 1 : 1;
    if (count > 8) throw new RequestError(429, 'Too many submissions. Wait a few minutes and try again.');
    if (limits.size >= 2048 && !entry) limits.delete(limits.keys().next().value);
    limits.set(key, {bucket, count});
  }

  return createServer({requestTimeout:15_000,headersTimeout:10_000}, async (request, response) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (status, value) => {
      response.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});
      response.end(JSON.stringify(value));
    };
    const bearer = request.headers.authorization?.match(/^Bearer (\S+)$/)?.[1] ?? '';
    try {
      if (origin && !allowedOrigins.has(origin)) throw new RequestError(403, 'This origin is unavailable.');
      if (request.method === 'OPTIONS') {
        response.writeHead(204, {
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
          'Access-Control-Max-Age': '600',
        });
        response.end();
        return;
      }
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/health' && request.method === 'GET') return reply(200, {ok:true});
      if (url.pathname === '/v1/submissions' && request.method === 'POST') {
        const body = await jsonBody(request);
        if (typeof body?.id !== 'string' || !requestId.test(body.id) ||
            typeof body.token !== 'string' || !receiptToken.test(body.token)) {
          throw new RequestError(422, 'Refresh the form before sending your contribution.');
        }
        let entry;
        try {entry = parseSubmission(body);}
        catch (error) {throw new RequestError(422, error.message);}
        const {id, token} = body;
        const hashed = hash(token).toString('hex');
        const payload = JSON.stringify(entry);
        const previous = read.get(id);
        if (previous) {
          if (!sameSecret(hashed, previous.receipt_hash) || payload !== previous.payload) {
            throw new RequestError(409, 'Start a new contribution before submitting different details.');
          }
          return reply(200, {id, token, status:previous.status});
        }
        limit(request);
        const now = new Date().toISOString();
        write.run(id, hashed, 'pending', entry.kind, payload, now, now);
        return reply(201, {id, token, status:'pending'});
      }
      const slot = syncSlot.exec(url.pathname);
      if (slot && ['GET','PUT','DELETE'].includes(request.method)) {
        if (!receiptToken.test(bearer)) throw new RequestError(401, 'Enter a valid sync key.');
        const id = slot[1];
        const row = readSync.get(id);
        const auth = hash(bearer).toString('hex');
        if (row && !sameSecret(auth,row.auth_hash)) throw new RequestError(403, 'This sync key does not match.');
        if (request.method === 'GET') {
          return reply(200,row ? {revision:row.revision,nonce:row.nonce,ciphertext:row.ciphertext} : {revision:0});
        }
        if (request.method === 'DELETE') {
          if (row) removeSync.run(id);
          return reply(200,{deleted:true});
        }
        limit(request);
        const snapshot = await jsonBody(request,syncBodyLimit);
        if (!snapshot || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 ||
            typeof snapshot.nonce !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(snapshot.nonce) ||
            typeof snapshot.ciphertext !== 'string' || !/^[A-Za-z0-9_-]{22,2796230}$/.test(snapshot.ciphertext)) {
          throw new RequestError(422, 'The encrypted backup is invalid.');
        }
        const now = new Date().toISOString();
        if (snapshot.revision !== (row?.revision ?? 0)) throw new RequestError(409, 'Another device synced first. Sync again.');
        const result = row ? updateSync.run(snapshot.nonce,snapshot.ciphertext,now,id,snapshot.revision) :
          createSync.run(id,auth,snapshot.nonce,snapshot.ciphertext,now);
        if (result.changes !== 1) throw new RequestError(409, 'Another device synced first. Sync again.');
        return reply(200,{revision:snapshot.revision + 1});
      }
      const lookup = /^\/v1\/submissions\/([a-f0-9-]{36})$/.exec(url.pathname);
      if (lookup && request.method === 'GET') {
        const row = read.get(lookup[1]);
        if (!row || !bearer || !sameSecret(hash(bearer).toString('hex'), row.receipt_hash)) {
          throw new RequestError(404, 'This receipt is unavailable.');
        }
        return reply(200, receipt(row));
      }
      if (url.pathname.startsWith('/v1/moderation/')) {
        if (!bearer || !sameSecret(bearer, moderatorToken)) throw new RequestError(401, 'Enter a valid moderation key.');
        if (url.pathname === '/v1/moderation/submissions' && request.method === 'GET') {
          const status = url.searchParams.get('status') ?? 'pending';
          if (!statuses.has(status)) throw new RequestError(400, 'Choose a valid status.');
          return reply(200, {submissions:list.all(status).map(row => ({...receipt(row), submission:JSON.parse(row.payload)}))});
        }
        const item = /^\/v1\/moderation\/submissions\/([a-f0-9-]{36})$/.exec(url.pathname);
        if (item && request.method === 'PATCH') {
          const row = read.get(item[1]);
          if (!row) throw new RequestError(404, 'This submission is unavailable.');
          const decision = await jsonBody(request);
          if (!decision || !transitions[row.status]?.has(decision.status)) throw new RequestError(409, 'Reload this submission before changing its status.');
          const reason = typeof decision.reason === 'string' ? decision.reason.trim() : '';
          if (reason.length > 500) throw new RequestError(422, 'Shorten the moderation note to 500 characters.');
          const reference = decision.status === 'published' ? decision.reference : null;
          if (decision.status === 'published' && (typeof reference !== 'string' || !publicationReference.test(reference))) {
            throw new RequestError(422, 'Add the GitHub issue or pull request for the published record.');
          }
          if (update.run(decision.status, new Date().toISOString(), reference, reason || null, row.id, row.status).changes !== 1) {
            throw new RequestError(409, 'This submission changed. Refresh the queue.');
          }
          return reply(200, receipt(read.get(row.id)));
        }
      }
      throw new RequestError(404, 'This endpoint is unavailable.');
    } catch (error) {
      if (!response.headersSent) reply(error instanceof RequestError ? error.status : 500,
        {error:error instanceof RequestError ? error.message : 'Could not complete this request. Try again.'});
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const filename = resolve(process.env.MPDB_DATABASE_PATH ?? '.community/atlas.sqlite');
  mkdirSync(dirname(filename), {recursive:true, mode:0o700});
  const origins = (process.env.MPDB_ALLOWED_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
  const server = createCommunityServer({db:openCommunityDatabase(filename),origins,moderatorToken:process.env.MPDB_MODERATOR_TOKEN});
  const port = Number(process.env.PORT ?? '8787');
  const host = process.env.MPDB_HOST ?? '127.0.0.1';
  server.listen(port, host, () => console.log('Community API listening at http://' + host + ':' + port));
}
