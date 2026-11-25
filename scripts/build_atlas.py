"""Produce the static data and preserve the existing offline analysis."""

import json
import runpy
from shutil import copy2

from atlas_data import KINDS, ROOT, VERSION, basemap_geojson, catalogue, place_geojson


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n", encoding="utf-8")


def build():
    data = catalogue()
    write(ROOT / ".atlas" / "data.json", data)
    api = ROOT / "public" / "api" / "v1"
    metadata = {"schema_version": VERSION, "provenance": "https://github.com/subtlesayak/Mutta-Puffs-Database/blob/main/DATA-LICENSE.md"}
    for key in ("places", "stats", "cities", "trails", "reviews", "observations", "place_metrics"):
        write(api / f"{key.replace('_', '-')}.json", {**metadata, key: data[key]})
    write(api / "place-aliases.json", {**metadata, "aliases": data["place_aliases"]})
    write(api / "places.geojson", {**place_geojson(data["places"]), **metadata})
    write(api / "leaderboard.json", {**metadata, **data["leaderboard"]})
    write(api / "price-index.json", {**metadata, **data["price_index"]})
    schemas = ROOT / "public" / "schemas" / "v1"
    schemas.mkdir(parents=True, exist_ok=True)
    for kind in (*KINDS.values(), "place-identities"):
        copy2(ROOT / "schemas" / f"{kind}.schema.json", schemas / f"{kind}.json")
    write(ROOT / "public" / "basemap.geojson", basemap_geojson())
    runpy.run_path(str(ROOT / "scripts" / "analyze.py"), run_name="__main__")
    report = ROOT / "public" / "analysis"
    report.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "places.csv", "summary.json", "PLACES.md", "README.md"):
        copy2(ROOT / "analysis" / name, report / name)
    visuals = ROOT / "public" / "visuals"
    visuals.mkdir(parents=True, exist_ok=True)
    copy2(ROOT / "visuals" / "mutta-puff-trail.png", visuals / "mutta-puff-trail.png")
    print(f"Generated atlas v{VERSION}: {len(data['places'])} places in {len(data['cities'])} city directories")


if __name__ == "__main__":
    build()
