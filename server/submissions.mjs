const fields = {
  place: {place_name: ['text', 200, true], area: ['text', 150, true], map_link: ['url', 650, true], details: ['text', 1000, true]},
  correction: {place_id: ['place', 40, true], correction: ['text', 900, true], evidence: ['url', 650], verified_on: ['date', 10]},
  review: {place_id: ['place', 40, true], visited_on: ['date', 10, true], pastry: ['score', 2, true], filling: ['score', 2, true], egg: ['score', 2, true], freshness: ['score', 2, true], value: ['score', 2, true], review_note: ['text', 900, true]},
  observation: {place_id: ['place', 40, true], observed_on: ['date', 10, true], price: ['text', 35], egg_portion: [['Whole egg', 'Half egg', 'Eggless', 'Other'], 20], fresh_batch_times: ['text', 60], availability: [['Available', 'Sold out', 'No longer sold'], 30]},
  photo: {place_id: ['place', 40, true], photo_url: ['url', 650, true], alt: ['text', 250, true], credit: ['text', 120, true], captured_on: ['date', 10]},
  heritage: {story_title: ['text', 120, true], story: ['text', 1800, true], story_source: ['url', 650]},
};

export const publicationReference = /^https:\/\/github\.com\/subtlesayak\/Mutta-Puffs-Database\/(issues|pull)\/[1-9]\d*$/;

function matches(type, value) {
  if (Array.isArray(type)) return type.includes(value);
  if (type === 'place') return /^mpdb-[a-z0-9]{8,24}$/.test(value);
  if (type === 'score') return /^(?:[1-9]|10)$/.test(value);
  if (type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const day = new Date(value + 'T00:00:00Z');
    return Number.isFinite(day.valueOf()) && day.toISOString().slice(0, 10) === value &&
      day.getTime() < Date.now() + 86_400_000;
  }
  if (type === 'url') {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && !/[\s\\]/.test(value);
    } catch {return false;}
  }
  return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

export function parseSubmission(body) {
  if (!body || typeof body !== 'object' || !Object.hasOwn(fields, body.kind)) throw new Error('Choose a contribution type.');
  if (body.website) throw new Error('This submission could not be accepted.');
  if (body.consent !== true) throw new Error('Confirm permission to publish your contribution.');
  if (!body.fields || typeof body.fields !== 'object' || Array.isArray(body.fields)) throw new Error('Check the contribution fields.');
  const rules = fields[body.kind];
  if (Object.keys(body.fields).some(key => !Object.hasOwn(rules, key))) throw new Error('Remove unrecognized contribution fields.');
  const data = {};
  for (const [key, [type, max, required]] of Object.entries(rules)) {
    const input = body.fields[key];
    const label = key.replaceAll('_', ' ');
    if (input !== undefined && typeof input !== 'string') throw new Error('Check the ' + label + ' field.');
    const value = input?.trim();
    if (!value) {
      if (required) throw new Error('Complete the ' + label + ' field.');
      continue;
    }
    if (value.length > max || !matches(type, value)) throw new Error('Check the ' + label + ' field.');
    data[key] = value;
  }
  if (body.kind === 'observation' && ![data.price, data.egg_portion, data.fresh_batch_times, data.availability].some(Boolean)) {
    throw new Error('Add a price, egg portion, batch time or availability report.');
  }
  return {kind: body.kind, fields: data, license: 'CC BY 4.0'};
}
