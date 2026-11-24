import assert from 'node:assert/strict';
import test from 'node:test';
import {browserPosition, distanceKm} from '../src/lib/distance.ts';

test('nearby distances handle identical pins, ordinary distances, and the date line', () => {
  assert.equal(distanceKm([0, 0], [0, 0]), 0);
  assert.ok(Math.abs(distanceKm([0, 0], [0, 1]) - 111.2) < .1);
  assert.ok(Math.abs(distanceKm([0, 179.99], [0, -179.99]) - 2.22) < .1);
});

test('device location is requested once, with a timeout, and returns coordinates only', async () => {
  let requests = 0;
  const point = await browserPosition({
    getCurrentPosition(success, _error, options) {
      requests++;
      assert.equal(options.timeout, 10_000);
      success({coords: {latitude: 9.981, longitude: 76.3, accuracy: 200}});
    },
  });
  assert.equal(requests, 1);
  assert.deepEqual(point, [9.981, 76.3]);
});

test('a denied permission leaves the city fallback available to the caller', async () => {
  const denied = {code: 1, message: 'Permission denied'};
  await assert.rejects(browserPosition({getCurrentPosition(_success, error) { error(denied); }}), denied);
});
