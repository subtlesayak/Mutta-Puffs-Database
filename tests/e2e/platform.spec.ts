import {expect,test} from '@playwright/test';

const examplePlace = 'mpdb-7b2be6dd7ad3';

test('all four localized finders accept native-script place queries', async ({page}) => {
  for (const [locale, city] of [['ml','ഹൈദരാബാദ്'],['hi','हैदराबाद'],['ta','ஹைதராபாத்'],['kn','ಹೈದರಾಬಾದ್']]) {
    await page.goto(locale + '/?q=' + encodeURIComponent(city));
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('[data-results]')).toContainText("Sam's Bakers");
  }
});

test('GPX pit stops find a nearby published listing', async ({page,request}) => {
  const response = await request.get('api/v1/places.json');
  const {places} = await response.json();
  const {latitude,longitude} = places.find((place:{id:string})=>place.id === examplePlace).location;
  const gpx = '<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>' +
    '<trkpt lat="' + latitude + '" lon="' + (longitude - .01) + '"/>' +
    '<trkpt lat="' + latitude + '" lon="' + (longitude + .01) + '"/>' +
    '</trkseg></trk></gpx>';
  await page.goto('pit-stops/');
  await page.getByLabel('GPX route or track').setInputFiles({
    name:'route.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from(gpx),
  });
  await page.getByRole('button',{name:'Find pit stops'}).click();
  await expect(page.getByRole('link',{name:"Sam's Bakers"})).toBeVisible();
});

test('passport imports private visits, shares collections and exports a recap PNG', async ({page}) => {
  const passport = {
    format:'mutta-puffs-passport',version:1,passport:{
      saved:[examplePlace],
      visits:[{id:'test-visit-1',placeId:examplePlace,date:'2026-01-02',note:'Private test note'}],
      collections:[{id:'test-collection-1',name:'Hyderabad puff stops',placeIds:[examplePlace]}],
    },
  };
  await page.goto('passport/');
  await page.locator('input[type=file]').setInputFiles({
    name:'passport.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(passport)),
  });
  await page.getByRole('button',{name:'Import backup'}).click();
  await expect(page.getByText('Private test note')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Hyderabad puff stops'})).toBeVisible();
  await expect(page.getByText('First stamp',{exact:true})).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download backup'}).click();
  expect((await downloaded).suggestedFilename()).toMatch(/^puff-passport-.*\.json$/);
  await page.goto('wrapped/');
  await page.getByLabel('Visit year').selectOption('2026');
  await expect(page.getByText(/Most visited: Sam.s Bakers/)).toBeVisible();
  const image = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download recap image'}).click();
  expect((await image).suggestedFilename()).toBe('puff-wrapped-2026.png');
});

test.describe('PWA',()=>{
  test.use({serviceWorkers:'allow'});
  test('a cached city list is usable offline', async ({page,context}) => {
    await page.goto('map/?view=list&city=hyderabad');
    await expect(page.locator('[data-map-list]')).toBeVisible();
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    try {
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('[data-map-list]')).toContainText("Sam's Bakers");
    } finally {
      await context.setOffline(false);
    }
  });
  test('the offline atlas worker renders a map and opens a pin', async ({page,context}) => {
    await page.goto('map/?view=list&city=hyderabad');
    await expect(page.locator('[data-map-list]')).toBeVisible();
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const supportsWebGL = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
    test.skip(!supportsWebGL, 'WebGL 2 is unavailable on this browser.');
    try {
      await context.setOffline(true);
      await page.getByRole('combobox',{name:'View',exact:true}).selectOption('map');
      await expect(page.locator('[data-map-status]')).toContainText('on the map.');
      await page.getByText('Filters',{exact:true}).click();
      await page.getByLabel('Select a pin').selectOption('mpdb-7b2be6dd7ad3');
      await expect(page.locator('[data-selection]')).toContainText("Sam's Bakers");
    } finally {
      await context.setOffline(false);
    }
  });
});
