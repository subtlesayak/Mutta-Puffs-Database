"""Build the analysis CSV, JSON, Markdown and offline HTML from the Maps export."""

import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from html import escape
from pathlib import Path
from urllib.parse import urlencode, urlsplit

from geography import Boundaries, MAP_BOUNDS, map_reference, nearest_area


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "mutta-puffs-everywhere.csv"
OUTPUT = ROOT / "analysis"
SOURCE_FIELDS = ("Title", "Note", "URL", "Tags", "Comment")
MAP_PROVIDERS = {"google_maps": "Google Maps", "apple_maps": "Apple Maps", "openstreetmap": "OpenStreetMap"}
PLACE_TYPES = (
    ("Landmark or institution", r"\b(?:hospital|study centre|cinemas?|film city|movie houses)\b"),
    ("Bakery or confectionery", r"\b(?:bake\w*|cakes?|bread|oven|muffins?|sweets?|confectionery|halwa)\b|பேக்கரி"),
    ("Tea or café", r"\b(?:tea|chai|caf[eé]|caffe|coffee)\b"),
    ("Restaurant or snack shop", r"\b(?:restaurants?|food court|hotel|snacks?|spicy bites|puff & curries)\b"),
    ("Store, market or dairy", r"\b(?:stores?|hypermarket|milk|shopping|milma)\b"),
)
NOTE_SIGNALS = (
    ("Egg or mutta puff", r"\b(?:egg|mutta\s*puff)s?\b"),
    ("Whole egg", r"\b(?:full|whole) egg\b"),
    ("Uncut", r"\b(?:no cut|uncut)\b"),
    ("Onion puff", r"\bonion puff\b"),
    ("Chenna puff", r"\bchenna puff\b"),
    ("Sarbath pairing", r"\bsarbath\b"),
    ("Made on site", r"\bmade on site\b"),
    ("Morning availability", r"\bmorning\b"),
    ("Afternoon batch", r"\b(?:afternoon|3\s*p\.?\s*m\.?)\b"),
    ("Evening availability", r"\bevening\b"),
)


def normalise_name(text):
    chars = unicodedata.normalize("NFKC", text).casefold()
    return " ".join("".join(c if unicodedata.category(c)[0] in "LMN" else " " for c in chars).split())


def ranked(values):
    return dict(sorted(Counter(value for value in values if value).items(), key=lambda item: (-item[1], item[0])))


def matching_labels(value, rules):
    return [label for label, pattern in rules if re.search(pattern, value, re.IGNORECASE)]


def repeated(records, key):
    groups = defaultdict(list)
    for row in records:
        if row[key]:
            groups[row[key]].append(row["source_row"])
    return {name: rows for name, rows in sorted(groups.items()) if len(rows) > 1}


def read_rows(path=SOURCE):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if tuple(reader.fieldnames or ()) != SOURCE_FIELDS:
            raise ValueError(f"Expected an export with these columns: {', '.join(SOURCE_FIELDS)}")
        rows = list(reader)
        if any(None in row or None in row.values() for row in rows):
            raise ValueError("Every export row must have all five columns")
        return rows


def map_links(row):
    links = dict.fromkeys(MAP_PROVIDERS, "")
    source = row["url"].strip()
    if not source:
        return links
    url = urlsplit(source)
    if url.scheme == "https" and url.netloc == "www.google.com" and url.path.startswith("/maps/"):
        links["google_maps"] = source

    lat, lon = row["latitude"], row["longitude"]
    if row["coordinate_source"] == "Explicit pin":
        links["apple_maps"] = "https://maps.apple.com/place?" + urlencode({"coordinate": f"{lat},{lon}"})
        links["openstreetmap"] = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=18/{lat}/{lon}"
    elif row["title"].strip():
        title = row["title"].strip()
        context = dict.fromkeys(label for label in (row["near_city"], row["india_state"], row["country"]) if label)
        query = ", ".join([title, *context])
        apple_params = {"query": title}
        if lat is not None:
            apple_params["center"] = f"{lat},{lon}"
        links["apple_maps"] = "https://maps.apple.com/search?" + urlencode(apple_params)
        links["openstreetmap"] = "https://www.openstreetmap.org/search?" + urlencode({"query": query})
    return links


def analyse(raw_rows, boundaries):
    records = []
    for source_row, raw in enumerate(raw_rows, start=2):
        title, note, url, tags, comment = (raw[field] for field in SOURCE_FIELDS)
        link_type, target, method, point = map_reference(url.strip())
        country, state, geography_method = boundaries.labels(point)
        type_signals = matching_labels(title, PLACE_TYPES)
        if link_type == "Coordinate pin":
            place_type = "Coordinate pin"
        elif not url.strip():
            place_type = "Unlinked entry"
        else:
            place_type = type_signals[0] if type_signals else "Unclassified listing"
        name_key = normalise_name(title) if link_type != "Coordinate pin" else ""
        score = re.search(r"\b(10|[0-9])\s*/\s*10\b", note)
        row = {
            "source_row": source_row, "title": title, "note": note, "url": url, "tags": tags,
            "comment": comment, "place_type": place_type, "type_signals": type_signals,
            "link_type": link_type, "target_key": target, "name_key": name_key, "coordinate_source": method,
            "latitude": round(point[0], 7 if method == "Explicit pin" else 4) if point else None,
            "longitude": round(point[1], 7 if method == "Explicit pin" else 4) if point else None,
            "country": country, "india_state": state, "geography_method": geography_method, "near_city": nearest_area(point),
            "note_signals": matching_labels(note, NOTE_SIGNALS),
            "note_score_out_of_10": int(score[1]) if score else None,
        }
        row.update(map_links(row))
        records.append(row)

    name_groups = repeated(records, "name_key")
    target_groups = repeated(records, "target_key")
    url_groups = repeated(records, "url")
    for row in records:
        row["repeated_title"] = row["name_key"] in name_groups
        row["repeated_target"] = row["target_key"] in target_groups

    linked = [row for row in records if row["link_type"] != "No link"]
    indian = [row for row in records if row["country"] == "India"]
    mapped = [row for row in records if row["latitude"] is not None]
    notes = [row for row in records if row["note"].strip()]
    return {"records": records, "summary": {
        "rows": len(records), "linked": len(linked), "mappable": len(mapped), "notes": len(notes),
        "countries": ranked(row["country"] for row in records),
        "india_states": ranked(row["india_state"] for row in indian),
        "unassigned_country": sum(not row["country"] for row in mapped),
        "unassigned_india_state": sum(not row["india_state"] for row in indian),
        "city_areas": ranked(row["near_city"] for row in records),
        "place_types": ranked(row["place_type"] for row in records),
        "link_types": ranked(row["link_type"] for row in records),
        "coordinate_sources": ranked(row["coordinate_source"] for row in records),
        "geography_methods": ranked(row["geography_method"] for row in records),
        "note_signals": ranked(signal for row in notes for signal in row["note_signals"]),
        "filled_fields": {field: sum(bool(row[field.lower()].strip()) for row in records) for field in SOURCE_FIELDS},
        "repeated_titles": name_groups, "repeated_targets": target_groups, "repeated_urls": url_groups,
        "landmarks": len([row for row in records if row["place_type"] == "Landmark or institution"]),
        "notes_with_score": sum(row["note_score_out_of_10"] is not None for row in notes),
    }}


def write_csv(records):
    if not records:
        return
    fields = [key for key in records[0] if key != "name_key"]

    def cell(value):
        if isinstance(value, list):
            return " | ".join(value)
        if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
            return "'" + value
        return value

    with (OUTPUT / "places.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows({key: cell(row[key]) for key in fields} for row in records)


def south_map(boundaries, records):
    west, south, east, north = MAP_BOUNDS
    width, height = 470, 520

    def xy(lon, lat):
        return (lon - west) / (east - west) * width, (north - lat) / (north - south) * height

    svg = []
    for _, ring in boundaries.southern_outlines():
        # A path smaller than a screen pixel does not need its full source geometry.
        points = []
        for x, y in (xy(*point) for point in ring):
            vertex = round(x), round(y)
            if not points or points[-1] != vertex:
                points.append(vertex)
        if len(points) > 2:
            path = "M" + "L".join(f"{x},{y}" for x, y in points) + "Z"
            svg.append(f'<path class="map-land" d="{path}"/>')

    bins = Counter()
    for row in records:
        lat, lon = row["latitude"], row["longitude"]
        if lat is not None and south <= lat <= north and west <= lon <= east:
            x, y = xy(lon, lat)
            bins[round(x / 8) * 8, round(y / 8) * 8] += 1
    for (x, y), count in sorted(bins.items()):
        svg.append(f'<circle class="map-dot" cx="{x}" cy="{y}" r="{3 + 2 * count**0.5:.1f}"/>')
    labels = (("Kerala", 10.4, 74.25, "start"), ("Tamil Nadu", 10.1, 80.8, "end"),
              ("Karnataka", 14.6, 75.9, "start"), ("Andhra Pradesh", 15.7, 80.8, "end"))
    for name, lat, lon, anchor in labels:
        x, y = xy(lon, lat)
        svg.append(f'<text class="map-label" x="{x:.0f}" y="{y:.0f}" text-anchor="{anchor}">{escape(name)}</text>')
    return "".join(svg), sum(bins.values())


def markdown(summary):
    return f"""# Crowdsourced list analysis

[Browse the place directory](PLACES.md), or download the [interactive report](index.html) and open it in your browser. [Analysis CSV](places.csv) · [Summary JSON](summary.json)

- **{summary['rows']}** source rows, **{summary['linked']}** Maps links, and **{summary['notes']}** contributor notes
- **{summary['mappable']}** links with usable coordinates, including **{summary['coordinate_sources'].get('Explicit pin', 0)}** direct pins
- **{len(summary['repeated_targets'])}** repeated map targets and **{len(summary['repeated_titles'])}** repeated listing-title groups

### Country coverage

{table(summary['countries'])}

### Coverage in India

{table(summary['india_states'])}

### Entries by place type

{table(summary['place_types'])}

Country and state counts are estimates based on the link coordinates and Natural Earth boundaries. Place types come from words in the exported titles. See [methodology](../README.md#analysis-method) for coverage and limits.
"""


def table(counts):
    return "\n".join(["| Group | Entries |", "| --- | ---: |"] +
                     [f"| {label} | {count} |" for label, count in counts.items()])


def directory(records):
    def text(value):
        return re.sub(r"([\\`*_{}\[\]|])", r"\\\1", escape(value))

    def name(row):
        if row["title"] == "Dropped pin" and row["near_city"]:
            return f"Dropped pin near {row['near_city']}"
        return row["title"].strip() or row["tags"].strip() or f"Source row {row['source_row']}"

    groups = defaultdict(list)
    for row in records:
        groups[row["india_state"] or row["country"] or "Location unassigned"].append(row)
    group_order = sorted(groups, key=lambda group: (group == "Location unassigned", -len(groups[group]), group))
    lines = ["# Place directory", "", f"Browse all {len(records)} entries from the crowdsourced MuttaPuffs Everywhere list.", "",
             "Select a place to open its original Google Maps link, or choose Apple Maps or OpenStreetMap. The alternate maps search by name for listings and open saved coordinates for direct pins.", "",
             "[Read the analysis](README.md) · [Download the interactive report](index.html)", ""]
    for group in group_order:
        rows = groups[group]
        lines.extend([f"## {group} ({len(rows)})", "", "| Place | Alternate maps |", "| --- | --- |"])
        for row in sorted(rows, key=lambda item: name(item).casefold()):
            title = text(name(row))
            google = row["google_maps"]
            place = f"[{title}](<{google}>)" if google else title
            alternatives = [f"[{label}](<{row[key]}>)" for key, label in MAP_PROVIDERS.items()
                            if key != "google_maps" and row[key]]
            lines.append(f"| {place} | {' · '.join(alternatives) or 'Map link needed'} |")
        lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    boundaries = Boundaries()
    analysis = analyse(read_rows(), boundaries)
    chart, chart_total = south_map(boundaries, analysis["records"])
    analysis["summary"]["southern_map_rows"] = chart_total
    write_csv(analysis["records"])
    (OUTPUT / "summary.json").write_text(json.dumps(analysis["summary"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT / "README.md").write_text(markdown(analysis["summary"]), encoding="utf-8")
    (OUTPUT / "PLACES.md").write_text(directory(analysis["records"]), encoding="utf-8")
    template = (ROOT / "scripts" / "analysis.html").read_text(encoding="utf-8")
    page_data = json.dumps({**analysis, "map_providers": MAP_PROVIDERS}, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    page = template.replace("<!-- MAP_SHAPES -->", chart).replace("<!-- ANALYSIS_DATA -->", page_data)
    (OUTPUT / "index.html").write_text(page, encoding="utf-8")
