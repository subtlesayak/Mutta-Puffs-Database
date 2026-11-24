"""Normalize the archive and independently approved records into atlas v1."""

import gzip
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from hashlib import sha256
from itertools import combinations
from pathlib import Path
from urllib.parse import urlsplit

from jsonschema import Draft202012Validator

from analyze import MAP_PROVIDERS, analyse, normalise_name, read_rows
from geography import BOUNDARIES, Boundaries, CITY_CENTRES, distance_km, map_reference

ROOT = Path(__file__).resolve().parents[1]
VERSION = 1
KINDS = {"places": "place", "reviews": "review", "observations": "observation", "trails": "trail"}
ACCURACY = {"Estimated from link": "estimated", "Explicit pin": "source_pin"}


def read_json(path):
    def invalid_constant(value):
        raise ValueError(f"Invalid JSON number {value} in {path}")

    return json.loads(path.read_text(encoding="utf-8"), parse_constant=invalid_constant)


def token(text):
    return sha256(text.encode("utf-8")).hexdigest()[:12]


def slug(text):
    latin = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", latin.lower()).strip("-") or token(text)


def imported_place(row):
    key = row["target_key"] or "tag:" + normalise_name(row["tags"] or row["title"])
    name = row["title"].strip() or row["tags"].strip()
    if name == "Dropped pin" and row["near_city"]:
        name = f"Dropped pin near {row['near_city']}"
    category = row["place_type"]
    accuracy = ACCURACY.get(row["coordinate_source"], "unknown")
    return {
        "id": f"mpdb-{token(key)}",
        "name": name or f"Source row {row['source_row']}",
        "category": category,
        "location": {
            "latitude": row["latitude"], "longitude": row["longitude"], "accuracy": accuracy,
            "locality": None, "city": row["near_city"] or None, "district": row["india_district"] or None,
            "state": row["india_state"] or None, "country": row["country"] or None,
        },
        "verification": {
            "status": "needs_details" if accuracy == "unknown" or category == "Landmark or institution" else "unverified",
            "last_verified": None, "reference": None,
        },
        "source": {"kind": "original_maps_export", "reference": row["url"] or None, "source_row": row["source_row"], "import_key": key},
        "map_links": {key: row[key] for key in MAP_PROVIDERS if row[key]},
        "note": row["note"].strip() or None,
        "photos": [],
    }


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validated(records, kind):
    require(isinstance(records, list), f"{kind} data must be an array")
    validator = Draft202012Validator(read_json(ROOT / "schemas" / f"{kind}.schema.json"), format_checker=Draft202012Validator.FORMAT_CHECKER)
    identifiers = set()
    for index, record in enumerate(records, 1):
        error = next(validator.iter_errors(record), None)
        if error:
            path = ".".join(map(str, error.absolute_path))
            raise ValueError(f"{kind}[{index}]{'.' + path if path else ''}: {error.message}")
        require(record["id"] not in identifiers, f"Duplicate {kind} ID {record['id']}")
        identifiers.add(record["id"])
    return records


def valid_https(value):
    try:
        url = urlsplit(value)
        return url.scheme == "https" and bool(url.hostname) and not url.username and not url.password and not re.search(r"[\s\\]", value)
    except ValueError:
        return False


def validate_places(places):
    for place in places:
        loc = place["location"]
        verification = place["verification"]
        require(loc["accuracy"] != "verified" or verification["status"] == "verified",
                f"Verified coordinates need independent verification for {place['id']}")
        if verification["last_verified"]:
            require(date.fromisoformat(verification["last_verified"]) <= date.today(), f"Future verification date for {place['id']}")
        urls = [*place["map_links"].values(), *(photo[key] for photo in place["photos"] for key in ("url", "source"))]
        if place["source"]["reference"]:
            urls.append(place["source"]["reference"])
        require(all(map(valid_https, urls)), f"Malformed HTTPS link for {place['id']}")


def merge_places(imports, approved):
    merged = {place["id"]: place for place in validated(imports, "place")}
    for place in validated(approved, "place"):
        original = merged.get(place["id"])
        if original:
            require(place["source"] == original["source"], f"Correction must preserve import provenance for {place['id']}")
            require(place["verification"]["reference"] is not None, f"Correction needs a repository issue or PR for {place['id']}")
        else:
            require(place["source"]["kind"] == "community", f"New place must have a community source: {place['id']}")
        merged[place["id"]] = place
    places = list(merged.values())
    validate_places(places)
    check_duplicate_targets(places)
    return places


def check_duplicate_targets(places):
    targets = {}
    for place in places:
        google = place["map_links"].get("google_maps")
        # Apple/OSM search URLs are deliberately unsuitable as identity keys.
        if google:
            _, target, _, _ = map_reference(google)
            require(target not in targets, f"Duplicate Maps target for {place['id']} and {targets.get(target)}")
            targets[target] = place["id"]


def duplicate_candidates(places):
    names = defaultdict(list)
    for place in places:
        if place["category"] != "Coordinate pin":
            names[normalise_name(place["name"])].append(place)
    candidates = []
    for group in names.values():
        for first, second in combinations(group, 2):
            a, b = (p["location"] for p in (first, second))
            if a["latitude"] is not None and b["latitude"] is not None:
                distance = distance_km((a["latitude"], a["longitude"]), (b["latitude"], b["longitude"]))
                proximity = round(distance, 2)
            else:
                proximity = None
            candidates.append({"place_ids": [first["id"], second["id"]], "distance_km": proximity})
    return candidates


def check_references(places, reviews, observations, trails):
    place_ids = {place["id"] for place in places}
    for record, field in [(r, "visited_on") for r in reviews] + [(o, "observed_on") for o in observations]:
        require(record["place_id"] in place_ids, f"Unknown place in {record['id']}")
        require(date.fromisoformat(record[field]) <= date.today(), f"Future visit or observation in {record['id']}")
    for trail in trails:
        require(set(trail["place_ids"]) <= place_ids, f"Unknown place in trail {trail['id']}")


def city_directory(places):
    groups = defaultdict(list)
    for place in places:
        if place["location"]["city"]:
            groups[place["location"]["city"]].append(place)
    cities = []
    for name, group in groups.items():
        loc = group[0]["location"]
        country = next((p["location"]["country"] for p in group if p["location"]["country"]), None)
        state = next((p["location"]["state"] for p in group if p["location"]["state"]), None)
        cities.append({
            "id": slug(name), "name": name, "state": state, "country": country,
            "centre": list(CITY_CENTRES[name]) if name in CITY_CENTRES else (
                [loc["latitude"], loc["longitude"]] if loc["latitude"] is not None else None
            ),
            "count": len(group), "place_ids": [p["id"] for p in group],
        })
    require(len({city["id"] for city in cities}) == len(cities), "Two city names have the same URL slug")
    return sorted(cities, key=lambda city: (-city["count"], city["name"]))


def catalogue(raw_rows=None, approved=None):
    analysis = analyse(read_rows() if raw_rows is None else raw_rows, Boundaries())
    if approved is None:
        approved = {group: read_json(ROOT / "data" / "approved" / f"{group}.json") for group in KINDS}
    places = merge_places([imported_place(row) for row in analysis["records"]], approved["places"])
    reviews, observations, trails = (validated(approved[key], KINDS[key]) for key in ("reviews", "observations", "trails"))
    check_references(places, reviews, observations, trails)
    cities = city_directory(places)
    stats = {
        "places": len(places), "mappable": sum(p["location"]["latitude"] is not None for p in places),
        "countries": dict(Counter(p["location"]["country"] for p in places if p["location"]["country"]).most_common()),
        "states": dict(Counter(p["location"]["state"] for p in places if p["location"]["state"]).most_common()),
        "districts": dict(Counter(" · ".join(filter(None, (p["location"]["district"], p["location"]["state"])))
                                  for p in places if p["location"]["district"]).most_common()),
        "accuracy": dict(Counter(p["location"]["accuracy"] for p in places).most_common()),
        "verification": dict(Counter(p["verification"]["status"] for p in places).most_common()),
        "reviews": len(reviews), "observations": len(observations), "cities": len(cities),
        "notes": sum(bool(p["note"]) for p in places),
        "archive": analysis["summary"], "duplicate_candidates": duplicate_candidates(places),
    }
    return {"schema_version": VERSION, "places": places, "reviews": reviews, "observations": observations,
            "trails": trails, "cities": cities, "stats": stats}


def place_geojson(places):
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "id": p["id"], "geometry": {"type": "Point", "coordinates": [p["location"]["longitude"], p["location"]["latitude"]]},
         "properties": {"id": p["id"], "name": p["name"], "accuracy": p["location"]["accuracy"],
                        "status": p["verification"]["status"], "city": p["location"]["city"],
                        "district": p["location"]["district"], "state": p["location"]["state"]}}
        for p in places if p["location"]["latitude"] is not None
    ]}


def basemap_geojson():
    # This overview layer is local so looking around the map requires no tile vendor.
    with gzip.open(BOUNDARIES, "rt", encoding="utf-8") as stream:
        countries = json.load(stream)["countries"]
    features = []
    for name, _, polygons in countries:
        if name == "Antarctica":
            continue
        simplified = []
        for polygon in polygons:
            ring = polygon[0]
            if len(ring) < 18:
                continue
            # Quantize and keep corners after moving about one tenth of a degree.
            outline = [tuple(round(v, 3) for v in ring[0])]
            for longitude, latitude in ring[1:-1]:
                x, y = outline[-1]
                if (longitude - x) ** 2 + (latitude - y) ** 2 >= 0.12 ** 2:
                    outline.append((round(longitude, 3), round(latitude, 3)))
            if len(outline) >= 3:
                simplified.append([outline + [outline[0]]])
        if simplified:
            features.append({"type": "Feature", "properties": {"name": name},
                             "geometry": {"type": "MultiPolygon", "coordinates": simplified}})
    return {"type": "FeatureCollection", "features": features}
