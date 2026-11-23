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

## Infographic

![The mutta puff trail. The five largest clusters are Kozhikode (22), Bengaluru (20), Thiruvananthapuram (17), Chennai (14), and Kochi (12). The snapshot contains 148 Maps links, 9 saved notes, and 4 coordinate pins.](visuals/mutta-puff-trail.png)

The graphic shows the concentration of saved entries and a few contributor tips. The area counts use direct coordinates where available and approximate positions inferred by interpreting the geographic portion of Maps feature IDs as [S2 cells](https://s2geometry.io/devguide/s2cell_hierarchy). A point counts toward the closest selected city centre if it is within 25 km. The radius includes suburbs and nearby towns. The counts describe this list's coverage. One linked entry has no usable location in its URL.

With more contributions, useful follow-ups include a **fresh-batch guide** based on reported times and a **puff varieties chart** based on structured notes about fillings and styles. The current CSV contains nine notes, so the graphic presents individual tips with their place names.

### Regenerate the graphic

Run from the repository root with Python 3 and Pillow.

```sh
python -m pip install Pillow
python scripts/build_infographic.py
```
