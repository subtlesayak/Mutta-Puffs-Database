import {randomBytes} from 'node:crypto';
import {expect, test, type Page, type Route} from '@playwright/test';
import {createCommunityServer,openCommunityDatabase} from '../../server/community.mjs';

test('account-free submissions, moderation, and encrypted Passport sync', async ({page,context,baseURL,browser}) => {
  test.setTimeout(60_000);
  const moderator = randomBytes(32).toString('base64url');
  const db = openCommunityDatabase(':memory:');
  const source = 'https://github.com/subtlesayak/Mutta-Puffs-Database/issues/101';
  const pinSource = 'https://github.com/subtlesayak/Mutta-Puffs-Database/issues/102';
  const pinPlace = 'mpdb-7b2be6dd7ad3';
  const pinDate = '2026-01-02';
  const publicPin = 'https://maps.google.com/?q=17.4,78.4';
  let listed = false;
  let pinVerified = false;
  const api = createCommunityServer({db,origins:[new URL(baseURL!).origin],moderatorToken:moderator,fetchAtlas:async input => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname.endsWith('/place-aliases.json')) return Response.json({schema_version:1,aliases:{}});
    return Response.json({schema_version:1,places:[
      ...(listed ? [{name:'Example puff shop',source:{kind:'community',reference:source}}] : []),
      {
        id:pinPlace,
        location:{accuracy:pinVerified ? 'verified' : 'estimated'},
        verification:{reference:pinSource,status:pinVerified ? 'verified' : 'unverified',last_verified:pinDate},
      },
    ]});
  }});
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
    await review.getByLabel('GitHub source in the live atlas').fill(source);
    const verify = review.getByRole('button',{name:'Verify publication'});
    await verify.click();
    await expect(review.locator('[data-moderation-status]')).toContainText('does not show this contribution');
    listed = true;
    await verify.click();
    await expect(review.locator('[data-moderation-status]')).toContainText('There are no submissions');
    await page.getByRole('button',{name:'Check status'}).click();
    await expect(page.locator('[data-receipt-status]')).toContainText('Your submission was published');
    await expect(page.getByRole('link',{name:'Open the published record'})).toHaveAttribute('href',source);

    await page.goto('contribute/?kind=correction&place=' + pinPlace + '&mission=pin');
    await page.getByLabel('Corrected pin or evidence link').fill(publicPin);
    await page.getByLabel('What needs to change?').fill('Checked the public storefront pin during a visit.');
    await page.getByLabel('Date you checked the place').fill(pinDate);
    await consent.check();
    await send.click();
    await expect(page.getByLabel('Receipt code')).toHaveValue(/^[a-f\d-]{36}\.[a-zA-Z\d_-]{43}$/);
    await review.getByLabel('Queue').selectOption('pending');
    await expect(review.getByText('Check a map pin',{exact:true})).toBeVisible();
    await expect(review.getByText(publicPin,{exact:true})).toBeVisible();
    await review.getByRole('button',{name:'Approve for publication'}).click();
    await expect(review.locator('[data-moderation-status]')).toContainText('There are no submissions');
    await review.getByLabel('Queue').selectOption('approved');
    const pinDraft = await review.getByRole('link',{name:'Open GitHub record'}).getAttribute('href');
    const pinBody = new URL(pinDraft!).searchParams.get('body');
    expect(pinBody).toContain('> Check a map pin');
    expect(pinBody).toContain('> ' + pinDate);
    expect(pinBody).toContain('> ' + publicPin);
    await review.getByLabel('GitHub source in the live atlas').fill(pinSource);
    await verify.click();
    await expect(review.locator('[data-moderation-status]')).toContainText('does not show this contribution');
    pinVerified = true;
    await verify.click();
    await expect(review.locator('[data-moderation-status]')).toContainText('There are no submissions');
    await page.getByRole('button',{name:'Check status'}).click();
    await expect(page.getByRole('link',{name:'Open the published record'})).toHaveAttribute('href',pinSource);

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

      const syncAgain = async (view: Page) => {
        const request = view.waitForResponse(response =>
          response.url().includes('/v1/passport-sync/') && response.request().method() === 'PUT');
        await view.getByRole('button',{name:'Sync now'}).click();
        expect((await request).ok()).toBe(true);
        await expect(view.locator('[data-sync-status]')).toContainText('Encrypted backup synced');
      };
      await page.getByRole('button',{name:/^Remove visit to /}).click();
      await syncAgain(page);
      await expect(other.getByText(note,{exact:true})).toBeVisible();
      await syncAgain(other);
      await expect(other.getByText(note,{exact:true})).toHaveCount(0);

      await page.getByRole('button',{name:'Undo removal',exact:true}).click();
      await syncAgain(page);
      await syncAgain(other);
      await expect(other.getByText(note,{exact:true})).toBeVisible();
    } finally {
      await second.close();
    }
  } finally {
    await new Promise<void>(resolve => api.close(() => resolve()));
    db.close();
  }
});
