import {randomBytes} from 'node:crypto';
import {expect, test, type Route} from '@playwright/test';
import {createCommunityServer,openCommunityDatabase} from '../../server/community.mjs';

test('account-free submissions, moderation, and encrypted Passport sync', async ({page,context,baseURL,browser}) => {
  const moderator = randomBytes(32).toString('base64url');
  const db = openCommunityDatabase(':memory:');
  const api = createCommunityServer({db,origins:[new URL(baseURL!).origin],moderatorToken:moderator});
  await new Promise<void>((resolve,reject) => api.listen(0,'127.0.0.1',resolve).once('error',reject));
  try {
    const address = api.address();
    if (!address || typeof address === 'string') throw new Error('The local API is unavailable.');
    const apiUrl = 'http://127.0.0.1:' + address.port;
    let unavailable = true;
    const forward = async (route: Route) => {
      if (unavailable) {
        await route.abort();
        return;
      }
      const url = new URL(route.request().url());
      await route.fulfill({response:await route.fetch({url:apiUrl + url.pathname + url.search})});
    };
    await context.route('http://127.0.0.1:4324/**',forward);
    await context.route('https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new**', async route => {
      await route.fulfill({status:200,contentType:'text/html',body:'<title>Unsubmitted GitHub draft</title>'});
    });

    await page.goto('contribute/');
    await page.getByLabel('Shop or stall name').fill('Example puff shop');
    await page.getByLabel('City or neighbourhood').fill('Kochi');
    await page.getByLabel('Shop or map link').fill('https://maps.example/test-pin');
    await page.getByLabel('Notes from your visit').fill('Private recipe fixture for review.');
    const send = page.getByRole('button',{name:'Send for review'});
    const consent = page.locator('[name=publication_consent]');
    await send.click();
    await expect(page.getByRole('alert')).toContainText('Confirm permission');
    await consent.check();
    await send.click();
    await expect(page.getByRole('alert')).toContainText('Your draft is still here');

    await consent.uncheck();
    const popupReady = page.waitForEvent('popup');
    await page.getByRole('button',{name:'Continue on GitHub'}).click();
    const popup = await popupReady;
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).searchParams.get('body')).toContain('Private recipe fixture for review.');
    await popup.close();

    unavailable = false;
    await consent.check();
    await send.click();
    await expect(page.getByLabel('Receipt code')).toHaveValue(/^[a-f\d-]{36}\.[a-zA-Z\d_-]{43}$/);
    await page.getByRole('button',{name:'Check status'}).click();
    await expect(page.locator('[data-receipt-status]')).toContainText('waiting for review');

    const review = await context.newPage();
    await review.goto('moderation/');
    await review.getByLabel('Moderation key').fill(moderator);
    await review.getByRole('button',{name:'Load submissions'}).click();
    await expect(review.getByText('Example puff shop',{exact:true})).toBeVisible();
    await review.getByRole('button',{name:'Approve for publication'}).click();
    await expect(review.locator('[data-moderation-status]')).toContainText('There are no submissions');
    await review.getByLabel('Queue').selectOption('approved');
    const draft = await review.getByRole('link',{name:'Open GitHub record'}).getAttribute('href');
    expect(new URL(draft!).searchParams.get('body')).toContain('https://maps.example/test-pin');
    await page.getByRole('button',{name:'Check status'}).click();
    await expect(page.locator('[data-receipt-status]')).toContainText('approved and waiting to be published');

    const note = 'Private visit for the encrypted sync test.';
    const backup = {format:'mutta-puffs-passport',version:1,passport:{
      saved:[],visits:[{id:'sync-test-visit',placeId:'mpdb-7b2be6dd7ad3',date:'2026-01-02',note}],collections:[],
    }};
    await page.goto('passport/');
    await page.locator('input[type=file]').setInputFiles({
      name:'passport.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup)),
    });
    await page.getByRole('button',{name:'Import backup'}).click();
    await expect(page.getByText(note,{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Create a key'}).click();
    const key = await page.getByLabel('Private sync key').inputValue();
    await page.getByRole('button',{name:'Sync now'}).click();
    await expect(page.locator('[data-sync-status]')).toContainText('Encrypted backup synced');
    const stored = db.prepare('SELECT ciphertext FROM passport_sync').get();
    expect(typeof stored?.ciphertext).toBe('string');
    expect(stored?.ciphertext).not.toContain(note);

    const second = await browser.newContext({baseURL,serviceWorkers:'block'});
    try {
      await second.route('http://127.0.0.1:4324/**',forward);
      const other = await second.newPage();
      await other.goto('passport/');
      await expect(other.getByText(note,{exact:true})).toHaveCount(0);
      await other.getByLabel('Private sync key').fill(key);
      await other.getByRole('button',{name:'Sync now'}).click();
      await expect(other.getByText(note,{exact:true})).toBeVisible();
    } finally {
      await second.close();
    }
  } finally {
    await new Promise<void>(resolve => api.close(() => resolve()));
    db.close();
  }
});
