const fields = {
  place: [
    ['place_name','Shop or stall name'], ['area','City, state and neighbourhood'],
    ['map_link','Public map link'], ['details','First-hand notes'],
  ],
  correction: [
    ['place_id','Atlas place ID'], ['correction','What should change?'],
    ['evidence','Corrected public pin or reference'], ['verified_on','Date you checked the place'],
  ],
  review: [
    ['place_id','Atlas place ID'], ['visited_on','Visit date'],
    ['pastry','Pastry and flakiness'], ['filling','Masala and filling'],
    ['egg','Egg quality'], ['freshness','Freshness'], ['value','Value for money'], ['review_note','First-hand notes'],
  ],
  observation: [
    ['place_id','Atlas place ID'], ['observed_on','Observation date'], ['price','Price per puff'],
    ['egg_portion','Egg portion'], ['fresh_batch_times','Fresh batch times'], ['availability','Availability'],
  ],
  photo: [
    ['place_id','Atlas place ID'], ['photo_url','Public image link'],
    ['alt','Describe the photo for readers who cannot see it'], ['credit','Photographer credit'], ['captured_on','Date taken'],
  ],
  heritage: [
    ['story_title','Story title'], ['story','Your story'], ['story_source','Public reference or interview link'],
  ],
} as const;

const consent = {
  place: 'I checked for an existing listing and can share my original contribution under CC BY 4.0.',
  correction: 'I can share my original contribution under CC BY 4.0.',
  review: 'This is my own review and I can share it under CC BY 4.0.',
  observation: 'These are my observations and I can share them under CC BY 4.0.',
  photo: 'I took this photo and license it for reuse under CC BY 4.0. I removed precise location metadata and kept identifiable people out of the photo.',
  heritage: 'This is my original writing. I have permission to share any interviews and can license this submission under CC BY 4.0.',
};

export type ContributionKind = keyof typeof fields;

export function githubDraft(repo: string, kind: ContributionKind, title: string, data: FormData) {
  const bodySections: string[] = [];
  for (const [name,label] of fields[kind]) {
    const value = data.get(name);
    if (typeof value !== 'string' || !value.trim()) continue;
    const quoted = value.trim().split(/\r\n?|\n/).map(line => '> ' + line).join('\n');
    bodySections.push('### ' + label + '\n\n' + quoted);
  }
  if (kind === 'photo' && !String(data.get('photo_url') ?? '').trim()) {
    bodySections.push('### Attach your photo\n\n<!-- Attach your image here before posting. -->');
  }
  bodySections.push('### Publication\n\n- [ ] ' + consent[kind]);
  const body = bodySections.join('\n\n') + '\n';
  const url = new URL(repo + '/issues/new');
  url.searchParams.set('template','atlas-contribution.md');
  url.searchParams.set('title',title.trim());
  url.searchParams.set('body',body);
  // Keep room for redirects and URL encoding, including GitHub's sign-in handoff.
  const prefilled = url.href.length <= 6000;
  if (!prefilled) url.searchParams.delete('body');
  return {body, href:url.href, prefilled};
}
