import {expect,test} from '@playwright/test';

const examplePlace = 'mpdb-7b2be6dd7ad3';

test('all four localized finders accept native-script place queries', async ({page}) => {
  const copy: Record<string,string[]> = {
    ml:['ബേക്കറി അല്ലെങ്കിൽ മിഠായിക്കട','വിലയും പഫ് സ്കോറും','ഏകദേശ പിൻ','Google Maps ൽ തുറക്കുക'],
    hi:['बेकरी या मिठाई की दुकान','कीमत और पफ स्कोर','अनुमानित पिन','Google Maps में खोलें'],
    ta:['பேக்கரி அல்லது இனிப்புக் கடை','விலையும் பஃப் மதிப்பெண்ணும்','தோராயமான இடக்குறி','Google Maps இல் திறக்கவும்'],
    kn:['ಬೇಕರಿ ಅಥವಾ ಸಿಹಿತಿಂಡಿ ಅಂಗಡಿ','ಬೆಲೆ ಮತ್ತು ಪಫ್ ಅಂಕ','ಅಂದಾಜು ಪಿನ್','Google Maps ನಲ್ಲಿ ತೆರೆಯಿರಿ'],
  };
  for (const [locale, city] of [['ml','ഹൈദരാബാദ്'],['hi','हैदराबाद'],['ta','ஹைதராபாத்'],['kn','ಹೈದರಾಬಾದ್']]) {
    await page.goto(locale + '/?q=' + encodeURIComponent(city));
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    const [bakery,metrics,pin,directions] = copy[locale];
    await expect(page.locator('[name=category] option[value="Bakery or confectionery"]')).toHaveText(bakery);
    await expect(page.locator('.metric-filters summary')).toHaveText(metrics);
    const card = page.locator('[data-results] li').filter({has:page.getByRole('link',{name:"Sam's Bakers",exact:true})});
    await expect(card).toBeVisible();
    await expect(card.getByRole('link',{name:"Sam's Bakers",exact:true}))
      .toHaveAttribute('href',new URL('places/' + examplePlace + '/',page.url()).pathname);
    await expect(card).toContainText(city);
    await expect(card.locator('.tags')).toContainText(pin);
    await expect(card.locator('[data-directions]')).toHaveText(directions);
    await expect(page.locator('.masthead .wordmark')).toHaveAttribute('href',new URL(page.url()).pathname);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test('localized city directories lead to localized listings and keep the same listing when switching language', async ({page,isMobile,baseURL}) => {
  const copy = [
    {locale:'ml',nav:'നഗരങ്ങൾ',city:'ഹൈദരാബാദ്',directions:'എങ്ങനെ എത്താം',saved:'പാസ്‌പോർട്ടിൽ സൂക്ഷിച്ചു.'},
    {locale:'hi',nav:'शहर',city:'हैदराबाद',directions:'कैसे पहुँचें',saved:'आपके पासपोर्ट में सहेजा गया।'},
    {locale:'ta',nav:'நகரங்கள்',city:'ஹைதராபாத்',directions:'எப்படிச் செல்வது',saved:'உங்கள் பாஸ்போர்ட்டில் சேமிக்கப்பட்டது.'},
    {locale:'kn',nav:'ನಗರಗಳು',city:'ಹೈದರಾಬಾದ್',directions:'ತಲುಪುವ ದಾರಿ',saved:'ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.'},
  ];
  for (const {locale,nav,city,directions,saved} of copy) {
    await page.goto(locale + '/');
    if (isMobile) await page.locator('.mobile-menu summary').click();
    const navigation = page.locator(isMobile ? '.navigation-mobile' : '.navigation-desktop');
    await navigation.getByRole('link',{name:nav,exact:true}).click();
    await expect(page).toHaveURL(new URL(locale + '/cities/',baseURL!).href);
    await page.getByRole('link',{name:city,exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.getByRole('heading',{level:1})).toContainText(city);
    await expect(page.locator('.city-actions a').last()).toHaveAttribute('href',new URL(locale + '/?city=hyderabad#nearby',baseURL!).pathname + '?city=hyderabad#nearby');
    await page.getByRole('link',{name:"Sam's Bakers",exact:true}).click();
    await expect(page).toHaveURL(new URL(locale + '/places/' + examplePlace + '/',baseURL!).href);
    await expect(page.getByRole('heading',{name:directions,exact:true})).toBeVisible();
    await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href',
      'https://subtlesayak.github.io' + new URL('places/' + examplePlace + '/',baseURL!).pathname);
    const bookmark = page.locator('[data-bookmark]');
    await bookmark.click();
    await expect(page.locator('[data-bookmark-status]')).toHaveText(saved);
    await page.locator('#page-languages').getByRole('link',{name:'English',exact:true}).click();
    await expect(page).toHaveURL(new URL('places/' + examplePlace + '/',baseURL!).href);
    await expect(bookmark).toHaveAttribute('aria-pressed','true');
    await bookmark.click();
    await expect(bookmark).toHaveAttribute('aria-pressed','false');
  }
});

test('localized maps keep city and district filters across languages and link back to localized listings', async ({page,baseURL}) => {
  for (const [locale,title,city,district] of [
    ['ml','പഫ് ഭൂപടം','ഹൈദരാബാദ്','ഹൈദരാബാദ് · തെലങ്കാന'],
    ['hi','पफ का नक्शा','हैदराबाद','हैदराबाद · तेलंगाना'],
    ['ta','பஃப் வரைபடம்','ஹைதராபாத்','ஹைதராபாத் · தெலங்கானா'],
    ['kn','ಪಫ್ ನಕ್ಷೆ','ಹೈದರಾಬಾದ್','ಹೈದರಾಬಾದ್ · ತೆಲಂಗಾಣ'],
  ]) {
    await page.goto(locale + '/?city=hyderabad');
    await expect(page.locator('[name=city]')).toHaveValue('hyderabad');
    const finderView = page.locator('[data-map-view]');
    await expect(finderView).toHaveAttribute('href',new URL(locale + '/map/?city=hyderabad',baseURL!).pathname + '?city=hyderabad');
    const url = new URL((await finderView.getAttribute('href'))!,baseURL!);
    url.searchParams.set('district','Hyderabad · Telangana');
    url.searchParams.set('verification','unverified');
    url.searchParams.set('view','list');
    url.searchParams.set('unrelated','test');
    await page.goto(url.href);
    await expect(page.getByRole('heading',{level:1})).toHaveText(title);
    await expect(page.locator('[name=city] option:checked')).toHaveText(city);
    await expect(page.locator('[name=district] option:checked')).toHaveText(district);
    const listing = page.locator('[data-map-list]').getByRole('link',{name:"Sam's Bakers",exact:true});
    await expect(listing).toHaveAttribute('href',new URL(locale + '/places/' + examplePlace + '/',baseURL!).pathname);
    await page.locator('#page-languages').getByRole('link',{name:'English',exact:true}).click();
    await expect(page.locator('[data-map-list]')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(new URL('map/',baseURL!).pathname);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
      city:'hyderabad',district:'Hyderabad · Telangana',verification:'unverified',view:'list',
    });
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

test('the offline atlas can load the GeoJSON outline if the compact asset is missing', async ({page,context}) => {
  await context.route('**/basemap.pbf',route => route.fulfill({status:404}));
  await page.goto('map/?view=list&city=hyderabad');
  await expect(page.locator('[data-map-list]')).toBeVisible();
  const supportsWebGL = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
  test.skip(!supportsWebGL, 'WebGL 2 is unavailable on this browser.');
  const fallback = context.waitForEvent('response',{predicate:response => new URL(response.url()).pathname.endsWith('/basemap.geojson')});
  await page.getByRole('combobox',{name:'View',exact:true}).selectOption('map');
  expect((await fallback).ok()).toBe(true);
  await expect(page.locator('[data-map-status]')).toContainText('on the map.');
});

test.describe('PWA',()=>{
  test.use({serviceWorkers:'allow'});
  test('the online atlas opens when the browser refuses cache writes', async ({page,context}) => {
    await page.goto('./');
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const worker = context.serviceWorkers()[0];
    await worker.evaluate(() => {
      const key = 'atlasTestCacheWriteAttempts';
      Reflect.set(globalThis,key,0);
      Cache.prototype.put = async () => {
        Reflect.set(globalThis,key,Number(Reflect.get(globalThis,key)) + 1);
        throw new DOMException('Storage is full','QuotaExceededError');
      };
    });
    const response = await page.goto('cities/hyderabad/');
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(page.getByRole('heading',{name:'Egg puffs near Hyderabad',exact:true})).toBeVisible();
    expect(await worker.evaluate(() => Reflect.get(globalThis,'atlasTestCacheWriteAttempts'))).toBeGreaterThan(0);
  });
  test('the homepage opens Puff Heritage while offline', async ({page,context}) => {
    await page.goto('./');
    const feature = page.getByRole('region',{name:'Puff Heritage'});
    await expect(feature.getByRole('heading',{name:'Puff Heritage',exact:true})).toBeVisible();
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    try {
      await context.setOffline(true);
      const link = feature.getByRole('link',{name:'Explore Puff Heritage'});
      await link.press('Enter');
      await expect(page.getByRole('heading',{name:'The story of the egg puff',exact:true})).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
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
  test('a localized finder is available from the offline cache', async ({page,context}) => {
    await page.goto('./');
    await page.evaluate(async () => {await navigator.serviceWorker.ready;});
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    try {
      await context.setOffline(true);
      await page.goto('ml/?q=' + encodeURIComponent('ഹൈദരാബാദ്'));
      await expect(page.getByRole('heading',{name:'അടുത്തുള്ള മുട്ട പഫ്സ് കണ്ടെത്താം',exact:true})).toBeVisible();
      await expect(page.locator('[data-results]')).toContainText("Sam's Bakers");
      await page.goto('ml/cities/');
      await expect(page.getByRole('heading',{name:'ഒരു നഗരം തിരഞ്ഞെടുക്കുക',exact:true})).toBeVisible();
      await page.goto('ml/map/?view=list&city=hyderabad');
      await expect(page.getByRole('heading',{name:'പഫ് ഭൂപടം',exact:true})).toBeVisible();
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
    const cachedOutlines = await page.evaluate(async () => {
      const [compact,geojson] = await Promise.all(['basemap.pbf','basemap.geojson'].map(name => caches.match(new URL('../' + name,location.href))));
      return {compact:Boolean(compact),geojson:Boolean(geojson)};
    });
    expect(cachedOutlines).toEqual({compact:true,geojson:false});
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
