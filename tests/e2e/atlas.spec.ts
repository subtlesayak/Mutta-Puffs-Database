import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('nearby discovery handles permission denial and preserves district context', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {getCurrentPosition: (_resolve: unknown, reject: (reason: {code: number}) => void) => reject({code: 1})},
    });
  });
  await page.goto('./');
  await expect(page.locator('[data-result-status]')).toContainText('places');
  await page.getByRole('link', {name: 'Find puffs near me'}).click();
  await expect(page.locator('[data-location-status]')).toContainText('choose a city');
  await page.getByLabel('State or country').selectOption('Kerala');
  const districts = page.getByLabel('Indian district');
  const kozhikode = districts.locator('option').filter({hasText: /Kozhikode/});
  const district = await kozhikode.textContent();
  await districts.selectOption(district!);
  await expect(page.locator('[data-result-status]')).toContainText('places');
  const mapUrl = await page.getByRole('link', {name: 'Map view', exact: true}).getAttribute('href');
  const params = new URL(mapUrl!, page.url()).searchParams;
  expect(params.get('region')).toBe('Kerala');
  expect(params.get('district')).toBe(district);
});

test('the filtered map list remains usable without WebGL', async ({page}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        return /^webgl/.test(kind) ? null : Reflect.apply(getContext, this, [kind, ...args]);
      },
    });
  });
  await page.goto('map/?city=hyderabad&view=list');
  await expect(page.locator('[data-map-status]')).toContainText('in the list');
  await expect(page.locator('[data-map-list]')).toBeVisible();
  await expect(page.getByRole('combobox', {name: 'City', exact: true})).toHaveValue('hyderabad');
  const view = page.getByRole('combobox', {name: 'View', exact: true});
  if (await view.isEnabled()) await view.selectOption('map');
  await expect(page.locator('[data-map-status]')).toContainText('interactive map is unavailable');
  await expect(page.locator('[data-map-list]')).toBeVisible();
  await page.locator('.map-disclosure summary').click();
  const region = page.getByLabel('State or country');
  const district = page.getByLabel('Indian district');
  await region.selectOption('Kerala');
  const kozhikode = district.locator('option').filter({hasText: /Kozhikode/});
  await district.selectOption((await kozhikode.textContent())!);
  await region.selectOption('United Arab Emirates');
  await expect(district).toHaveValue('');
  await expect(page.locator('[data-map-list] li')).not.toHaveCount(0);
  await page.getByRole('button', {name: 'Clear filters'}).click();
  await expect(region).toHaveValue('');
  await expect(page.locator('[data-map-list]')).toBeVisible();
});

test('a shared Maps draft can be saved and draft replacement can be undone', async ({page}) => {
  const link = 'https://maps.app.goo.gl/56iHw9EDj1zPX6cn8';
  const incoming = new URLSearchParams({shared: JSON.stringify({title: 'Example puff shop', text: link})});
  await page.goto('contribute/#' + incoming);
  await expect(page.getByLabel('Shop or stall name')).toHaveValue('Example puff shop');
  await expect(page.getByLabel('Shop or map link')).toHaveValue(link);
  const save = page.getByRole('button', {name: 'Save draft on this device'});
  await save.click();
  await page.getByLabel('Shop or stall name').fill('Another example shop');
  await save.click();
  await page.getByRole('button', {name: 'Undo draft replacement'}).click();
  await page.reload();
  await expect(page.getByLabel('Shop or stall name')).toHaveValue('Example puff shop');
});

test('the review form supports keyboard ratings', async ({page}) => {
  await page.goto('contribute/?kind=review&place=mpdb-7b2be6dd7ad3');
  await expect(page.getByLabel('Atlas listing')).toHaveValue('mpdb-7b2be6dd7ad3');
  await expect(page.getByRole('slider')).toHaveCount(5);
  const pastry = page.getByRole('slider', {name: 'Pastry and flakiness'});
  await pastry.press('ArrowRight');
  await expect(pastry).toHaveValue('6');
});

test('GitHub receives the completed contribution with a copyable draft on the atlas', async ({page, context}) => {
  await page.goto('contribute/');
  const continueButton = page.getByRole('button',{name:'Continue on GitHub'});
  let draftRequest: URL | undefined;
  await context.route('https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new**', async route => {
    draftRequest = new URL(route.request().url());
    await route.fulfill({status:200,contentType:'text/html',body:'<title>GitHub draft request</title>'});
  });
  await page.getByLabel('Shop or stall name').fill('Example puff shop');
  await page.getByLabel('City or neighbourhood').fill('Kochi');
  await page.getByLabel('Shop or map link').fill('https://maps.example/shop?test=1&pin=2');
  await page.getByLabel('Notes from your visit').fill('Fresh pastry.\nമുട്ട പഫ്സ്');
  const popup = page.waitForEvent('popup');
  await continueButton.click();
  await (await popup).waitForLoadState('domcontentloaded');
  expect(draftRequest?.searchParams.get('title')).toBe('Add a puff spot: Example puff shop');
  expect(draftRequest?.searchParams.get('template')).toBe('atlas-contribution.md');
  const body = draftRequest?.searchParams.get('body');
  expect(body).toContain('https://maps.example/shop?test=1&pin=2');
  expect(body).toContain('Fresh pastry.\n> മുട്ട പഫ്സ്');
  await page.getByText('View issue body',{exact:true}).click();
  await expect(page.getByLabel('Issue body',{exact:true})).toHaveValue(body!);
});

test('dated observations validate the price and batch times before opening a GitHub draft', async ({page,context}) => {
  await context.route('https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new**',route =>
    route.fulfill({status:200,contentType:'text/html',body:'<title>GitHub draft request</title>'}));
  await page.goto('contribute/?kind=observation&place=mpdb-7b2be6dd7ad3');
  const proceed = page.getByRole('button',{name:'Continue on GitHub'});
  const price = page.getByRole('textbox',{name:'Price per puff',exact:true});
  const times = page.getByRole('textbox',{name:'Fresh batch times',exact:true});
  await page.getByLabel('Observation date').fill('2026-01-01');
  await price.fill('25');
  await proceed.click();
  await expect(price).toBeFocused();
  await expect(price).toHaveAttribute('aria-invalid','true');
  await expect(price).toHaveAccessibleDescription(/positive amount and a three-letter currency code/);

  await price.fill('25 INR');
  await times.fill('4 pm');
  await proceed.click();
  await expect(times).toBeFocused();
  await expect(times).toHaveAccessibleDescription(/enter each local batch time once/i);
  await times.fill('08:00, 16:30');
  const opening = page.waitForEvent('popup');
  await proceed.click();
  const popup = await opening;
  await popup.waitForLoadState('domcontentloaded');
  const body = new URL(popup.url()).searchParams.get('body');
  expect(body).toContain('> 2026-01-01');
  expect(body).toContain('> 25 INR');
  expect(body).toContain('> 08:00, 16:30');
});

test('localized corrections preserve place IDs and native-script draft text across language switches', async ({page,context,baseURL}) => {
  await context.route('https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new**',route =>
    route.fulfill({status:200,contentType:'text/html',body:'<title>GitHub draft request</title>'}));
  for (const [locale,text] of [
    ['ml','കടയുടെ പിൻ തിരുത്തുക'], ['hi','दुकान का पिन सही करें'],
    ['ta','கடையின் இடக்குறியைத் திருத்துங்கள்'], ['kn','ಅಂಗಡಿಯ ಪಿನ್ ತಿದ್ದಿ'],
  ]) {
    const id = 'mpdb-7b2be6dd7ad3';
    await page.goto(locale + '/places/' + id + '/');
    await page.locator('a[href*="kind=correction"]').click();
    expect(new URL(page.url()).pathname).toBe(new URL(locale + '/contribute/',baseURL!).pathname);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('[name=place_id]')).toHaveValue(id);
    await page.locator('[name=correction]').fill(text);
    await page.locator('#page-languages').getByRole('link',{name:'English',exact:true}).click();
    await expect(page.getByLabel('What needs to change?')).toHaveValue(text);
    await expect(page.getByLabel('Atlas listing')).toHaveValue(id);
    const pending = page.waitForEvent('popup');
    await page.getByRole('button',{name:'Continue on GitHub'}).click();
    const popup = await pending;
    await popup.waitForLoadState('domcontentloaded');
    const draft = new URL(popup.url()).searchParams;
    expect(draft.get('title')).toBe("Correct a listing: Sam's Bakers");
    expect(draft.get('body')).toContain(id);
    expect(draft.get('body')).toContain(text);
    await popup.close();
  }
});

test('all homepages link straight to Puff Heritage chapters', async ({page, baseURL}) => {
  const heritagePath = new URL('heritage/', baseURL!).pathname;
  for (const route of ['./', 'ml/', 'hi/', 'ta/', 'kn/']) {
    await page.goto(route);
    const feature = page.locator('#puff-heritage');
    await expect(feature.getByRole('heading', {level: 2})).toBeVisible();
    const links = feature.getByRole('link');
    await expect(links).toHaveCount(5);
    expect(await links.evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href'))))
      .toEqual(['', '#name', '#origins', '#recipe', '#travels'].map(fragment => heritagePath + fragment));
  }
  await page.locator('#puff-heritage').getByRole('link').filter({hasText: 'ಪಫ್ ಮಾಡುವ ವಿಧಾನ'}).click();
  await expect(page).toHaveURL(new URL('heritage/#recipe', baseURL!).href);
  await expect(page.getByRole('heading', {name: 'Make Kerala-style egg puffs'})).toBeInViewport();
});

test('the Guide and Heritage pass automated accessibility and reflow checks', async ({page, isMobile}) => {
  await page.goto('guide/');
  if (isMobile) {
    const menu = page.locator('.mobile-menu summary');
    await menu.press('Enter');
    await expect(page.locator('.navigation-mobile a').last()).toHaveText('Contribute');
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
  }
  for (const route of ['guide/', 'heritage/']) {
    await page.goto(route);
    await expect(page.getByRole('main')).toBeVisible();
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflows).toBe(false);
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map(({id, nodes}) => ({id, targets: nodes.map(node => node.target)}))).toEqual([]);
  }
});
