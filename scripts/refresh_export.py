"""Validate a new CSV and register import identities before refreshing the atlas archive."""

import argparse
import json
from io import StringIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from analyze import SOURCE, parse_rows
from atlas_data import IDENTITIES, catalogue, read_json


def refresh(candidate):
    contents = candidate.read_bytes()
    rows = parse_rows(StringIO(contents.decode("utf-8-sig"), newline=""))
    current = read_json(IDENTITIES)
    data = catalogue(raw_rows=rows, identities=current)
    registered = dict(current["import_ids"])
    for place in data["places"]:
        key = place["source"]["import_key"]
        if key:
            registered.setdefault(key, place["id"])
    identities = {**current, "import_ids": dict(sorted(registered.items()))}
    catalogue(raw_rows=rows, identities=identities)
    registry = (json.dumps(identities, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    for destination, data in ((SOURCE, contents), (IDENTITIES, registry)):
        with NamedTemporaryFile(dir=destination.parent, delete=False) as stream:
            temp = Path(stream.name)
            try:
                stream.write(data)
                stream.close()
                temp.chmod(destination.stat().st_mode & 0o777)
                temp.replace(destination)
            finally:
                temp.unlink(missing_ok=True)
    return len(rows), len(data["places"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    args = parser.parse_args()
    rows, places = refresh(args.csv)
    print(f"Imported {rows} source rows for {places} atlas places.")
