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
  test.skip(await continueButton.count() === 0, 'The community API is enabled on this build.');
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
