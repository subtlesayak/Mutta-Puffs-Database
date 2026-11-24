# Contribute to the atlas

Start with the [contribution page](https://subtlesayak.github.io/Mutta-Puffs-Database/contribute/) or the [GitHub issue forms](https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new/choose). Include a public shop link and first-hand details. A price, batch time, or tasting needs the date you observed it. Use your own words and share only material you can license for publication.

## Review and publish

1. Check the [directory](analysis/PLACES.md) and the stable place ID. Check the public map target and nearby branches before adding a new ID. Similar shop names can refer to different branches.
2. Keep private addresses and personal contact details out of public records. Verify a corrected pin against first-hand evidence, and link the review discussion.
3. Use the [v1 schemas](schemas/) and edit the appropriate file in [data/approved](data/approved/). New places use an unused `mpdb-` ID and a community source. Override an existing place by adding its full v1 record with the **same** ID, original source fields, and the issue or PR in `verification.reference`. Keep the source CSV intact.
4. Put dated tastes in `reviews.json`, and prices, egg portions, batch times, or availability in `observations.json`. Use local 24-hour batch times and an ISO currency code. Verify that each reviewed puff was tasted by a different contributor before counting their review toward the leaderboard. Record the original submission URL as the source.
5. Run `python3 scripts/validate.py`, `npm test`, `npm run check` and `npm run build`, then submit a pull request. The workflow validates and publishes approved changes after merge to `main`.

Location estimates and source pins are separate from independently verified coordinates. A submitted issue remains a proposal until a maintainer reviews the evidence and merges a record.

## Photos, stories and trails

Check the photo issue for the photographer’s credit, consent to CC BY 4.0, and an accurate alt description. Publish an optimized copy with precise location metadata removed. The place record’s `photos` entry links to that image and the issue. Preserve the place’s verification status unless the contributor also provided evidence for a verification.

For Heritage, attribute stories to the source or interviewee and record whether a statement is a recollection. Trails are ordered lists of stable place IDs. Check each listing’s public map target and explain what readers can expect from the route. Include any caveat about coordinate accuracy or unconfirmed availability.
