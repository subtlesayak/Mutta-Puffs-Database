import {communityRequest} from '../lib/community';
import {mergePassportBackups} from '../lib/passport-backup';
import {newSyncCode,openPassportSnapshot,sealPassport,syncAccess,type SyncSnapshot} from '../lib/passport-sync';
import {changePassport,readPassport,type Passport} from '../lib/passport';
import type {PlaceAliases} from '../lib/place-identity';

export function startPassportSync(root: HTMLElement, aliases: PlaceAliases, render: (passport: Passport) => void) {
  const form = root.querySelector<HTMLFormElement>('[data-passport-sync]');
  if (!form) return;
  const key = form.querySelector<HTMLInputElement>('[name=key]')!;
  const status = form.querySelector<HTMLElement>('[data-sync-status]')!;
  const newKey = form.querySelector<HTMLButtonElement>('[data-new-key]')!;
  const sync = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const copyKey = form.querySelector<HTMLButtonElement>('[data-copy-key]')!;
  const remove = root.querySelector<HTMLButtonElement>('[data-remove-sync-backup]')!;
  newKey.addEventListener('click', () => {
    key.value = newSyncCode();
    key.focus();
    key.select();
    copyKey.hidden = false;
    status.textContent = 'Copy this key somewhere private. You will need it on another device.';
  });

  key.addEventListener('input',() => {copyKey.hidden = !key.value;});
  copyKey.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(key.value);
      status.textContent = 'Copied. Keep the key somewhere private.';
    } catch {
      key.type = 'text';
      key.focus();
      key.select();
      status.textContent = 'Copy the selected key, then leave this page to hide it.';
    }
  });
  remove.addEventListener('click', async () => {
    remove.disabled = true;
    try {
      const {id,token} = await syncAccess(key.value.trim());
      await communityRequest('v1/passport-sync/' + id,{method:'DELETE',token});
      status.textContent = 'The server backup was removed. This device still has your passport.';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not remove the backup.';
    } finally {
      remove.disabled = false;
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    sync.disabled = newKey.disabled = true;
    status.textContent = 'Syncing your encrypted backup…';
    try {
      const {id,token,key:secret} = await syncAccess(key.value.trim());
      const route = 'v1/passport-sync/' + id;
      const snapshot = await communityRequest<SyncSnapshot>(route,{token});
      const remote = await openPassportSnapshot(snapshot,secret,aliases);
      const contents = mergePassportBackups(readPassport(localStorage,aliases),remote);
      const sealed = await sealPassport(contents,secret,snapshot.revision);
      await communityRequest(route,{method:'PUT',token,body:sealed});
      const updated = changePassport(localStorage,passport => {
        Object.assign(passport,mergePassportBackups(passport,contents));
      },aliases);
      render(updated);
      status.textContent = 'Encrypted backup synced and new records added to this device.';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not sync your passport.';
    } finally {
      sync.disabled = newKey.disabled = false;
    }
  });
}
