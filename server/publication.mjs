const atlas = new URL('https://subtlesayak.github.io/Mutta-Puffs-Database/');

async function readAtlas(route,request,signal) {
  const response = await request(new URL(route,atlas),{signal,redirect:'error',cache:'no-cache'});
  if (!response.ok) throw new Error('The published atlas is unavailable.');
  return response;
}

async function readExport(name,request,signal) {
  const data = await (await readAtlas('api/v1/' + name + '.json',request,signal)).json();
  if (data?.schema_version !== 1 || !Array.isArray(data[name])) throw new Error('The public export could not be read.');
  return data[name];
}

const normalizedName = value => value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();

export async function isPublishedSubmission(submission, reference, request = fetch) {
  const {kind,fields} = submission;
  const signal = AbortSignal.timeout(7000);

  if (kind === 'heritage') {
    const html = await (await readAtlas('heritage/',request,signal)).text();
    for (const [article] of html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)) {
      for (const [, , href] of article.matchAll(/<a\b[^>]*\shref=(["'])([^"'<>]+)\1/gi)) {
        if (href === reference) return true;
      }
    }
    return false;
  }

  const group = kind === 'review' ? 'reviews' : kind === 'observation' ? 'observations' : 'places';
  const records = await readExport(group,request,signal);
  if (kind === 'place') {
    return records.some(place => place.source?.kind === 'community' && place.source.reference === reference &&
      (normalizedName(place.name) === normalizedName(fields.place_name) ||
        Object.values(place.map_links ?? {}).includes(fields.map_link)));
  }

  const matches = placeId => {
    if (kind === 'review') return records.some(review =>
      review.source === reference && review.place_id === placeId && review.visited_on === fields.visited_on);
    if (kind === 'observation') return records.some(observation =>
      observation.source === reference && observation.place_id === placeId && observation.observed_on === fields.observed_on);
    const place = records.find(record => record.id === placeId);
    if (kind === 'correction') {
      return place?.verification?.reference === reference && (fields.mission !== 'pin' ||
        (place.location?.accuracy === 'verified' && place.verification.status === 'verified' &&
          place.verification.last_verified === fields.verified_on));
    }
    return Boolean(place?.photos?.some(photo => photo.source === reference));
  };
  if (matches(fields.place_id)) return true;
  const data = await (await readAtlas('api/v1/place-aliases.json',request,signal)).json();
  if (data?.schema_version !== 1 || !data.aliases || typeof data.aliases !== 'object' || Array.isArray(data.aliases)) {
    throw new Error('The public place aliases could not be read.');
  }
  const canonical = data.aliases[fields.place_id];
  return typeof canonical === 'string' && matches(canonical);
}
