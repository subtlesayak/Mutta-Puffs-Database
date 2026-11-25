import assert from 'node:assert/strict';
import test from 'node:test';
import {githubDraft} from '../src/lib/github-draft.ts';

const repo = 'https://github.com/subtlesayak/Mutta-Puffs-Database';
const form = fields => {
  const data = new FormData();
  for (const [name,value] of Object.entries(fields)) data.set(name,value);
  return data;
};

test('hands GitHub a Markdown issue with the title, map link, and multiline notes', () => {
  const title = 'Add a puff spot: പഫ്സ് & tea';
  const draft = githubDraft(repo,'place',title,form({
    place_name:'പഫ്സ് & tea', area:'Kochi', map_link:'https://maps.example/?q=a&other=b',
    details:'First line\r\n\r\n### Publication\r\n- [x] Quoted test notes',
    publication_consent:'on',
  }));
  const url = new URL(draft.href);
  assert.equal(url.origin + url.pathname,repo + '/issues/new');
  assert.equal(url.searchParams.get('template'),'atlas-contribution.md');
  assert.equal(url.searchParams.get('title'),title);
  assert.equal(url.searchParams.get('body'),draft.body);
  assert.match(draft.body,/### First-hand notes\n\n> First line\n> \n> ### Publication\n> - \[x\]/);
  assert.ok(draft.body.includes('https://maps.example/?q=a&other=b'));
  assert.match(draft.body,/\n### Publication\n\n- \[ \]/);
  assert.equal(url.searchParams.has('publication_consent'),false);
});

test('keeps structured review, observation, correction and photo details', () => {
  const review = githubDraft(repo,'review','Review',form({
    place_id:'test-id', visited_on:'2026-11-24', pastry:'9', filling:'8', egg:'7', freshness:'6', value:'5',
    review_note:'Flaky test pastry',
  }));
  assert.match(review.body,/### Atlas place ID\n\n> test-id/);
  assert.match(review.body,/### Pastry and flakiness\n\n> 9/);
  assert.match(review.body,/### Value for money\n\n> 5/);
  const observation = githubDraft(repo,'observation','Price',form({price:'INR 25',egg_portion:'Half egg'}));
  assert.match(observation.body,/### Price per puff\n\n> INR 25/);
  assert.doesNotMatch(observation.body,/Availability/);
  const correction = githubDraft(repo,'correction','Correction',form({verified_on:'2026-11-24'}));
  assert.match(correction.body,/### Date you checked the place\n\n> 2026-11-24/);
  const photo = githubDraft(repo,'photo','Photo',form({alt:'Pastry cut in half',credit:'Photographer'}));
  assert.match(photo.body,/### Attach your photo/);
});

test('preserves the complete copyable body when a non-Latin draft exceeds the URL budget', () => {
  const story = 'മുട്ട പഫ്സ് '.repeat(145).trim();
  const draft = githubDraft(repo,'heritage','Bakery story',form({story}));
  assert.equal(draft.prefilled,false);
  assert.equal(new URL(draft.href).searchParams.has('body'),false);
  assert.ok(draft.body.includes(story));
});
