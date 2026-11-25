import assert from 'node:assert/strict';
import test from 'node:test';
import {changePassport, readPassport, recap, toggleSaved} from '../src/lib/passport.ts';

test('saved places and private visits survive independent storage updates', () => {
  const values = new Map();
  const storage = {getItem: key => values.get(key), setItem: (key,value) => values.set(key,value)};
  const visit = {id:'v1',placeId:'p1',date:'2026-02-03',note:'private'};
  toggleSaved(storage,'p1');
  changePassport(storage, book => book.visits.push(visit));
  toggleSaved(storage,'p1');
  assert.deepEqual(readPassport(storage),{saved:[],visits:[visit]});
});

test('Wrapped counts unique places, excludes other years, and separates currencies', () => {
  const visits = [
    {id:'v1',placeId:'p1',date:'2026-02-03',note:'private',spent:{amount:25,currency:'INR'}},
    {id:'v2',placeId:'p1',date:'2026-02-05',note:'private',spent:{amount:30,currency:'INR'}},
    {id:'v3',placeId:'p2',date:'2026-02-07',note:'private',spent:{amount:2.5,currency:'GBP'}},
    {id:'v4',placeId:'p2',date:'2025-02-08',note:'private',spent:{amount:10,currency:'GBP'}},
  ];
  const places = new Map([
    ['p1',{name:'Puff stop',city:'Kochi',country:'India'}],
    ['p2',{name:'Bakery',city:'Liverpool',country:'United Kingdom'}],
  ]);
  assert.deepEqual(recap(visits,2026,places),{
    visits:3,places:2,cities:2,countries:2,spent:{INR:55,GBP:2.5},paidVisits:3,
    favourite:{name:'Puff stop',count:2},
  });
});

test('saved places and visits resolve to the surviving identity after a merge', () => {
  const values = new Map();
  const storage = {getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value)};
  const aliases = {'mpdb-retired01':'mpdb-survivor01'};
  changePassport(storage, passport => {
    passport.saved = ['mpdb-retired01','mpdb-survivor01'];
    passport.visits.push({id:'visit-one',placeId:'mpdb-retired01',date:'2026-01-02',note:'Private'});
  });
  assert.deepEqual(readPassport(storage,aliases).saved,['mpdb-survivor01']);
  assert.equal(readPassport(storage,aliases).visits[0].placeId,'mpdb-survivor01');
  assert.deepEqual(toggleSaved(storage,'mpdb-survivor01',aliases).saved,[]);
});
