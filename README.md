# Mutta Puffs Database

**MuttaPuffs Everywhere** is a crowdsourced Google Maps list of places people have saved for mutta puffs, also known as egg puffs. The export includes bakeries, tea shops, restaurants, landmarks, and standalone pins. Notes came from contributors and may reflect a particular visit.

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
- [Interactive report](analysis/index.html) with a searchable list, map provider picker, coverage charts, and contributor notes. Download the HTML and open it in a browser.
- [Analysis CSV](analysis/places.csv) with the source fields, source row numbers, and derived fields for each entry
- [Summary JSON](analysis/summary.json) with the counts, coverage gaps, and duplicate checks

![The mutta puff trail. Of 149 rows, 147 have usable coordinates and 9 have notes. The list covers 5 countries. Kerala has 85 of the 140 entries assigned to India, followed by Tamil Nadu with 26 and Karnataka with 22.](visuals/mutta-puff-trail.png)

## Analysis method

- **Geography.** Four direct pins supply coordinates. For other mappable links, the analysis interprets the first Maps feature ID component as an [S2 cell](https://s2geometry.io/devguide/s2cell_hierarchy) and uses its estimated centre. Country and Indian state assignments use [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2) public-domain boundaries. A point just outside can be assigned when exactly one boundary is within 2 km. The analysis records this method and leaves ambiguous assignments blank.
- **City areas.** Each point is counted once at the closest selected city centre within 25 km. Those groups can include suburbs and nearby towns. The map shows a southern India window, with nearby points grouped. Country tables describe the whole list.
- **Place types.** Title keywords suggest one primary type per entry. The CSV also includes all matching type signals. A hospital, cinema, or other landmark is kept so contributors can identify the actual stall or shop later.
- **Notes.** Contributor wording is preserved. Topic counts recognise explicit terms for fillings, preparation, availability, and pairings. One note can contribute to several topics. The export has no timestamps, current business hours, prices, or Google review counts.
- **Duplicates.** Exact URLs and stable Maps targets are checked separately. Similar titles with different targets stay as separate entries. Coordinate pin labels are excluded from the repeated listing-title check.
- **Map links.** Google Maps opens the original saved link. Apple Maps and OpenStreetMap search by title for listings and use the saved coordinates for direct pins. Alternate providers may return multiple results. **Nive backery** is a tag-only entry and needs a map link.

## Regenerate the report

Run these from the repository root with Python 3. The analysis works offline with the included boundary snapshot. The infographic uses Pillow.

```sh
python scripts/analyze.py
python -m pip install Pillow
python scripts/build_infographic.py
```

To rebuild the boundary snapshot, download the [country GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson) and [state and province GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson), then run `python scripts/prepare_boundaries.py /path/to/countries.geojson /path/to/states.geojson`.
