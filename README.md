# Mutta Puffs Database

**Mutta Puffs Everywhere** is a community-powered global atlas of mutta puffs, also known as egg puffs. Its source archive is a crowdsourced Google Maps list of bakeries, tea shops, restaurants, landmarks, and standalone pins.

[Explore the atlas](https://subtlesayak.github.io/Mutta-Puffs-Database/) · [Puff Map](https://subtlesayak.github.io/Mutta-Puffs-Database/map/) · [Cities](https://subtlesayak.github.io/Mutta-Puffs-Database/cities/) · [Insights](https://subtlesayak.github.io/Mutta-Puffs-Database/insights/) · [Contribute](https://subtlesayak.github.io/Mutta-Puffs-Database/contribute/)

Use your device location or choose a city, filter by an Indian district, and open a place in Google Maps, Apple Maps, or OpenStreetMap. Each listing has a permanent link with its source and coordinate accuracy.

The [Puff Guide](https://subtlesayak.github.io/Mutta-Puffs-Database/guide/) brings together curated trails, a nearby Roulette draw, and Puff Heritage stories. Puff Passport saves shops and visits in the current browser. Puff Wrapped uses those visits to make an annual recap you can share.

The [Puff Leaderboard](https://subtlesayak.github.io/Mutta-Puffs-Database/leaderboard/) ranks places with at least three approved, first-hand reviews using confidence-adjusted scores. The [Mutta Puff Index](https://subtlesayak.github.io/Mutta-Puffs-Database/price-index/) publishes monthly medians by city and currency and only computes an index for samples of at least three shops. Price and score filters use approved reports.

## Install and contribute from Maps

1. Open the atlas in Android Chrome and choose **Install app** from the browser menu or the button on the Contribute page when it appears.
2. Open a public shop listing or pin in Maps, tap **Share**, and choose **Mutta Puffs** when it appears in the share sheet.
3. Review the prefilled draft, complete the shop details, and choose **Continue on GitHub** when ready to submit it for review.

On browsers without share-target support, including iPhone Safari, copy the link and paste it into **Contribute → Paste a shared link or location**. At the shop, you can also choose **Use my current location** to fill in a pin. Drafts can be saved on your device while offline. Your shared link or location stays in the draft until you continue to GitHub.

## Data

[Download the original CSV](data/mutta-puffs-everywhere.csv). It contains 149 rows, including 148 entries with Maps links and one tag-only entry (`Nive backery`). The original titles, notes, URLs, tags, comments, and row order are preserved. Four links point directly to coordinates. Places with the same name and different links have their own rows.

| Column | Contents |
| --- | --- |
| `Title` | Place name or pin label in the export |
| `Note` | Contributor note about the place |
| `URL` | Google Maps place link or coordinate pin |
| `Tags` | Labels saved with the entry |
| `Comment` | Comment field from the export |

## Browse places and explore the analysis

- [Place directory](analysis/PLACES.md) with clickable Google Maps, Apple Maps, and OpenStreetMap links
- [Summary and count tables](analysis/README.md)
- [Offline report](analysis/index.html) with the searchable list, district filter, coverage charts, and contributor notes. Download the HTML and open it in a browser.
- [Analysis CSV](analysis/places.csv) with the source fields, source row numbers, and derived fields for each entry
- [Summary JSON](analysis/summary.json) with the counts, coverage gaps, and duplicate checks

![The mutta puff trail. Of 149 rows, 147 have usable coordinates and 9 have notes. The list covers 5 countries. Kerala has 85 of the 140 entries assigned to India, followed by Tamil Nadu with 26 and Karnataka with 22.](visuals/mutta-puff-trail.png)

## Analysis method

- **Geography.** Four direct pins supply coordinates. For other mappable links, the analysis interprets the first Maps feature ID component as an [S2 cell](https://s2geometry.io/devguide/s2cell_hierarchy) and uses its estimated centre. Country and Indian state assignments use [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2) public-domain boundaries. A point just outside can be assigned when exactly one boundary is within 2 km. The analysis records this method and leaves ambiguous assignments blank.
- **City areas.** Each point is counted once at the closest selected city centre within 25 km. Those groups can include suburbs and nearby towns. The map shows a southern India window, with nearby points grouped. Country tables describe the whole list.
- **Districts.** Contains [geoBoundaries India ADM2 data](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/) from Pathways Data Pvt. Ltd. and the Local Government Directory, under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The included [district snapshot](data/reference/geoboundaries-ind-adm2-9469f09.json.gz) repackages the simplified 2021 polygons. District assignments use those polygons or a unique district within 2 km of an estimated point and can differ from current boundaries.
- **Nearby search.** Results sort by straight-line distance from the chosen city centre or the location your browser shares. The page uses that location in memory for sorting and filtering.
- **Place types.** Title keywords suggest one primary type per entry. The CSV also includes all matching type signals. A hospital, cinema, or other landmark is kept so contributors can identify the actual stall or shop later.
- **Notes.** Contributor wording is preserved. Topic counts recognise explicit terms for fillings, preparation, availability, and pairings. One note can contribute to several topics. The export has no timestamps, current business hours, prices, or Google review counts.
- **Duplicates.** Exact URLs and stable Maps targets are checked separately. Similar titles with different targets stay as separate entries. Coordinate pin labels are excluded from the repeated listing-title check.
- **Map links.** Google Maps opens the original saved link. Apple Maps and OpenStreetMap search by title for listings and use the saved coordinates for direct pins. Alternate providers may return multiple results. **Nive backery** is a tag-only entry and needs a map link.

## Develop and build

Use Node.js 24 and Python 3.12. The analysis runs with the included boundary snapshots.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm ci
npm run dev
```

Run the same checks as CI before publishing.

```sh
python scripts/validate.py
npm test
npm run check
npm run build
python scripts/check_site.py
```

GitHub Actions validates pull requests and publishes successful builds on `main` through GitHub Pages. The build generates the Astro site, the v1 API, and the preserved offline report.

### Optional Google Maps basemap

Enable the Maps JavaScript API and billing in your Google Cloud project, create a JavaScript map ID, and make a dedicated browser key restricted to the Maps JavaScript API and the `https://subtlesayak.github.io/*` website referrer. Use repository Actions variables named `PUBLIC_GOOGLE_MAPS_API_KEY` and `PUBLIC_GOOGLE_MAPS_MAP_ID`, then run **Validate and publish the atlas** from the Actions tab. For a local production preview, set the same names in an ignored `.env.local` and allow your preview origin on a separate development key. The browser key is public in the built site. Google Maps loads only when a visitor selects it, and those loads count toward your Google Cloud usage. [Browser key setup](https://developers.google.com/maps/documentation/javascript/get-api-key) · [Map ID setup](https://developers.google.com/maps/documentation/javascript/advanced-markers/start) · [Usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)

### Optional usage analytics

Add this site to your Umami instance. Set the repository Actions variables `PUBLIC_UMAMI_WEBSITE_ID` to its website ID and `PUBLIC_UMAMI_SEND_URL` to its HTTPS ingestion URL ending in `/api/send`. For Umami Cloud use `https://gateway.umami.is/api/send`. If you self-host, allow the atlas origin to send cross-origin JSON requests. Run **Validate and publish the atlas** to enable the preference under About → Privacy. Each visitor opts in. The client sends page paths, selected city IDs, map app choices, no-result counts, and contribution handoffs. A handoff measures the click to GitHub. Completed contributions can be counted in the repository’s issues. [Umami ingestion API](https://docs.umami.is/docs/api/sending-stats)

To regenerate the archived infographic, run:

```sh
python scripts/build_infographic.py
```

To rebuild the boundary snapshots, download the [country GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson), [state and province GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson), and [district GeoJSON](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson), then run `python scripts/prepare_boundaries.py countries.geojson states.geojson --india-districts districts.geojson`.

## Reuse the data

The [v1 API directory](https://subtlesayak.github.io/Mutta-Puffs-Database/about/#data) links to static JSON and GeoJSON. [Schemas](schemas/) define places, dated observations, reviews, and trails. Approved records go through the [contribution workflow](CONTRIBUTING.md). See [data sources and licensing](DATA-LICENSE.md) for archive and boundary terms.
