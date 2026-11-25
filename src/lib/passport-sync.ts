import {formatPassportBackup, passportBackupLimit, readPassportBackup} from './passport-backup.ts';
import type {Passport} from './passport.ts';
import type {PlaceAliases} from './place-identity.ts';

const encode = new TextEncoder();
const additionalData = encode.encode('Mutta Puffs Passport encrypted backup v1');
const codePattern = /^[A-Za-z0-9_-]{43}$/;

function base64url(bytes: Uint8Array) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i,i + 8192));
  return btoa(text).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function bytes(value: string) {
  return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),char => char.charCodeAt(0));
}

async function derive(secret: Uint8Array, context: string) {
  const label = encode.encode('mpdb/passport/' + context);
  const input = new Uint8Array(label.length + secret.length);
  input.set(label);
  input.set(secret,label.length);
  return new Uint8Array(await crypto.subtle.digest('SHA-256',input));
}

export const newSyncCode = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

export async function syncAccess(code: string) {
  if (!codePattern.test(code)) throw new Error('Enter the full passport sync key.');
  const secret = bytes(code);
  const [id,token,key] = await Promise.all([derive(secret,'id'),derive(secret,'auth'),derive(secret,'encryption')]);
  return {
    id:base64url(id),token:base64url(token),
    key:await crypto.subtle.importKey('raw',key,{name:'AES-GCM'},false,['encrypt','decrypt']),
  };
}

export interface SyncSnapshot {revision:number;nonce?:string;ciphertext?:string}

export async function sealPassport(passport: Passport, key: CryptoKey, revision: number): Promise<SyncSnapshot> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const plain = encode.encode(formatPassportBackup(passport,2));
  if (plain.length > passportBackupLimit) throw new Error('This passport is too large to sync. Download a local backup instead.');
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData},key,plain);
  return {revision,nonce:base64url(nonce),ciphertext:base64url(new Uint8Array(encrypted))};
}

export async function openPassportSnapshot(snapshot: SyncSnapshot, key: CryptoKey, aliases: PlaceAliases): Promise<Passport> {
  if (!snapshot.revision) return {saved:[],visits:[]};
  if (!snapshot.nonce || !snapshot.ciphertext) throw new Error('The server backup is incomplete.');
  let decoded: ArrayBuffer;
  try {
    decoded = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(snapshot.nonce),additionalData},key,bytes(snapshot.ciphertext));
  } catch {throw new Error('Could not open this encrypted backup with that key.');}
  return readPassportBackup(new TextDecoder().decode(decoded),aliases);
}
