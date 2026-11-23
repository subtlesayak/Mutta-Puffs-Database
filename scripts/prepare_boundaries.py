"""Prepare the vendored Natural Earth 5.1.2 boundary snapshot from two GeoJSON files."""

import argparse
import gzip
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "reference" / "natural-earth-5.1.2.json.gz"
DISTRICT_OUTPUT = ROOT / "data" / "reference" / "geoboundaries-ind-adm2-9469f09.json.gz"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))["features"]


def geometry(feature):
    shape = feature["geometry"]
    polygons = shape["coordinates"] if shape["type"] == "MultiPolygon" else [shape["coordinates"]]
    return [[[(round(lon, 5), round(lat, 5)) for lon, lat, *_ in ring]
             for ring in polygon] for polygon in polygons]


def prepare(countries_file, states_file):
    countries = [
        [f["properties"]["ADMIN"], f["properties"]["ADM0_A3"], geometry(f)]
        for f in load(countries_file) if f["geometry"]
    ]
    states = [
        [f["properties"]["name"], f["properties"]["iso_3166_2"], geometry(f)]
        for f in load(states_file) if f["geometry"] and f["properties"]["adm0_a3"] == "IND"
    ]
    return {"countries": countries, "india_states": states}


def write_snapshot(path, data):
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(payload.encode("utf-8"), mtime=0))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("countries", type=Path)
    parser.add_argument("states", type=Path)
    parser.add_argument("--india-districts", type=Path)
    args = parser.parse_args()
    write_snapshot(OUTPUT, prepare(args.countries, args.states))
    if args.india_districts:
        districts = [
            [feature["properties"]["shapeName"], feature["properties"]["shapeID"], geometry(feature)]
            for feature in load(args.india_districts) if feature["geometry"]
        ]
        write_snapshot(DISTRICT_OUTPUT, districts)
