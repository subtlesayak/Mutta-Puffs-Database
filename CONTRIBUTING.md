# Contribute to the atlas

Start with the [contribution page](https://subtlesayak.github.io/Mutta-Puffs-Database/contribute/) or the [GitHub issue forms](https://github.com/subtlesayak/Mutta-Puffs-Database/issues/new/choose). Include a public shop link and first-hand details. A price, batch time, or tasting needs the date you observed it. Use your own words and share only material you can license for publication.

## Review and publish

1. Check the [directory](analysis/PLACES.md) and the stable place ID. Check the public map target and nearby branches before adding a new ID. Similar shop names can refer to different branches.
2. Keep private addresses and personal contact details out of public records. Verify a corrected pin against first-hand evidence, and link the review discussion.
3. Use the [v1 schemas](schemas/) and edit the appropriate file in [data/approved](data/approved/). New places use an unused `mpdb-` ID and a community source. Override an existing place by adding its full v1 record with the **same** ID, original source fields, and the issue or PR in `verification.reference`. Keep the source CSV intact.
4. Put dated tastes in `reviews.json`, and prices, egg portions, batch times, or availability in `observations.json`. Use local 24-hour batch times and an ISO currency code. Verify that each reviewed puff was tasted by a different contributor before counting their review toward the leaderboard. Record the original submission URL as the source.
5. Run `python3 scripts/validate.py`, `npm test`, `npm run check` and `npm run build`, then submit a pull request. The workflow validates and publishes approved changes after merge to `main`.

Location estimates and source pins are separate from independently verified coordinates. A submitted issue remains a proposal until a maintainer reviews the evidence and merges a record.

## Optional community service

The atlas always offers GitHub issue drafts. To also accept contributions without a GitHub account and offer encrypted Passport sync, run `npm run community` with Node 24 and a persistent SQLite directory. Set `MPDB_DATABASE_PATH` to the database file, `MPDB_ALLOWED_ORIGINS` to the browser origin (for GitHub Pages, `https://subtlesayak.github.io`), and `MPDB_MODERATOR_TOKEN` to a private random secret of at least 32 bytes.

The Node service defaults to `127.0.0.1:8787`. Run it under the VPS service manager with a dedicated account that can write its SQLite directory. Keep the database and moderator secret outside the repository and public build. Back up the database with SQLite’s backup mechanism.

Set up an HTTPS reverse proxy for the API hostname. For a Caddy instance on the same host that receives connections directly from the internet, use a site block like this and set `MPDB_TRUST_LOCAL_PROXY=1` in the API service environment.

```caddyfile
api.example.org {
    reverse_proxy 127.0.0.1:8787 {
        header_up X-MPDB-Client-IP {remote_host}
    }
}
```

The proxy overwrites the client-address header, and the API trusts it only on loopback when enabled. If the VPS already runs a reverse proxy, configure the equivalent header on that proxy. [Caddy reverse proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)

Check that the HTTPS `/health` route returns `{"ok":true}`. Then set `PUBLIC_COMMUNITY_API_URL` to the HTTPS API root in the repository’s Actions variables and redeploy Pages. To exercise the account-free form and Passport sync with a local test database, run `MPDB_TEST_COMMUNITY=1 npm run test:e2e` after installing the Playwright Chromium browser.

Open `/moderation/` under the atlas URL and enter the moderation key to review the queue. Check consent and evidence, then approve or decline. For an approved entry, open its GitHub record, follow the publication steps above, and attach the issue or pull request to the submission. Contributors can check the outcome with their private receipt code.

## Refresh the Maps export

Run `python scripts/refresh_export.py PATH_TO_EXPORT.csv` with the new file. It checks the export against the place identities already published, preserves the input bytes, and registers IDs for new records. Rebuild the offline analysis and infographic before submitting the update.

When a Maps link acquires a new import key, add the new key beside the old key in [the place identity registry](data/place-identities.json), pointing both to the existing place ID. A correction remains attached to that identity when an export changes row numbers. Exact duplicate entries remain in the source CSV and resolve to one place in the atlas.

For a reviewed duplicate, add the retired ID to `merges` with the surviving `place_id` and the issue or pull request documenting the decision. Review any approved details for the retired record first and carry the relevant evidence to the survivor. The build redirects old place URLs and resolves existing trail stops, reviews, observations and Passport records to the surviving ID.

## Photos, stories and trails

Check the photo issue for the photographer’s credit, consent to CC BY 4.0, and an accurate alt description. Publish an optimized copy with precise location metadata removed. The place record’s `photos` entry links to that image and the issue. Preserve the place’s verification status unless the contributor also provided evidence for a verification.

For Heritage, attribute stories to the source or interviewee and record whether a statement is a recollection. Trails are ordered lists of stable place IDs. Check each listing’s public map target and explain what readers can expect from the route. Include any caveat about coordinate accuracy or unconfirmed availability.
