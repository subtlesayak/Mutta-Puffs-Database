import assert from 'node:assert/strict';
import test from 'node:test';
import {contributionDraft, pinLink} from '../src/lib/share.ts';

test('a Maps link shared in Android text opens a new place draft', () => {
  const link = 'https://maps.app.goo.gl/ExampleShop';
  assert.deepEqual(contributionDraft({title: 'Example Shop', text: 'Behind the bus stop ' + link}), {
    name: 'Example Shop', link, details: 'Behind the bus stop',
  });
});

test('a shared map pin takes precedence over another public listing link', () => {
  const url = 'https://maps.apple.com/?ll=9.981,76.3';
  assert.equal(contributionDraft({url, text: 'https://example.com/shop'}).link, url);
  assert.equal(contributionDraft({url: 'https://example.com/shop'}).link, 'https://example.com/shop');
});

test('a geographic URI becomes a public pin and invalid coordinates are ignored', () => {
  const link = pinLink(9.981, 76.3);
  assert.equal(new URL(link).searchParams.get('query'), '9.981000,76.300000');
  assert.deepEqual(contributionDraft({title: 'geo:9.981,76.3', text: 'geo:9.981,76.3'}), {name: '', link, details: ''});
  assert.equal(contributionDraft({url: 'geo:90.1,0'}).link, '');
  assert.equal(pinLink(NaN, 76.3), '');
});

test('non-HTTPS and credential-bearing links are never placed in the map field', () => {
  assert.equal(contributionDraft({url: 'http://example.com/shop'}).link, '');
  assert.equal(contributionDraft({url: 'https://name:pass@example.com/shop'}).link, '');
});
