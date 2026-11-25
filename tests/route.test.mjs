import assert from 'node:assert/strict';
import test from 'node:test';
import {nearestRoutePoint,routeSegments,searchPitStops} from '../src/lib/routes.ts';

test('route proximity projects onto the segment and keeps separate tracks apart', () => {
  const route = routeSegments([[[0,0],[0,2]],[[0,8],[0,10]]]);
  const off = nearestRoutePoint([.01,1],route);
  assert.ok(off.offset >= 1.1 && off.offset < 1.2);
  assert.ok(off.distanceAlong >= 111 && off.distanceAlong < 112);
  assert.ok(nearestRoutePoint([0,5],route).offset > 300);
});

test('routes crossing the dateline use the short arc', () => {
  const route = routeSegments([[[0,179],[0,-179]]]);
  const point = nearestRoutePoint([.01,180],route);
  assert.ok(point.offset >= 1.1 && point.offset < 1.2);
  assert.ok(point.distanceAlong >= 111 && point.distanceAlong < 112);
});

test('pit stops keep the route order and exclude distant and unknown pins', () => {
  const segments = [[[0,0],[0,2]],[[0,8],[0,10]]];
  const pins = [[0,9],[0,5],null,[.01,.8],[0,1]];
  assert.deepEqual(searchPitStops({segments,pins,radius:2}).matches.map(match => match.index), [3,4,0]);
  assert.deepEqual(searchPitStops({segments,pins,radius:.5}).matches.map(match => match.index), [4,0]);
  assert.match(searchPitStops({segments:[[[0,0],[0,0]]],pins,radius:2}).error, /two different coordinates/);
});
