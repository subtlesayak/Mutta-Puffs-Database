"""Check that the built Pages artifact includes and cross-links its public routes."""

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DIST = Path(__file__).resolve().parents[1] / "dist"
BASE = "/Mutta-Puffs-Database/"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value and value.startswith(BASE):
                self.targets.append(value)


def check():
    places = json.loads((DIST / "api/v1/places.json").read_text())["places"]
    cities = json.loads((DIST / "api/v1/cities.json").read_text())["cities"]
    trails = json.loads((DIST / "api/v1/trails.json").read_text())["trails"]
    for route in ("", "map/", "cities/", "insights/", "about/", "contribute/", "analysis/", "share/", "offline/",
                  "guide/", "leaderboard/", "price-index/", "trails/", "pit-stops/", "missions/", "heritage/", "passport/", "roulette/", "wrapped/", "languages/", "ml/", "hi/", "ta/", "kn/"):
        assert (DIST / route / "index.html").is_file(), route
    for locale in ("", "ml", "hi", "ta", "kn"):
        assert (DIST / locale / "cities" / "index.html").is_file(), locale
        assert (DIST / locale / "map" / "index.html").is_file(), locale
        assert (DIST / locale / "contribute" / "index.html").is_file(), locale
        for group, records in (("places", places), ("cities", cities)):
            for record in records:
                target = DIST / locale / group / record["id"] / "index.html"
                assert target.is_file(), target.relative_to(DIST)
    assert all((DIST / "trails" / trail["id"] / "index.html").is_file() for trail in trails)
    for endpoint in ("leaderboard", "place-metrics", "price-index"):
        assert json.loads((DIST / "api/v1" / (endpoint + ".json")).read_text())["schema_version"] == 1
    assert (DIST / "api/v1/places.geojson").is_file()
    assert all((DIST / "schemas" / "v1" / (kind + ".json")).is_file() for kind in ("place", "review", "observation", "trail"))
    assert (DIST / "images/egg-puff.webp").is_file()
    assert (DIST / "sitemap.xml").is_file()
    manifest = json.loads((DIST / "manifest.webmanifest").read_text())
    assert manifest["scope"] == manifest["start_url"] == "./"
    assert manifest["share_target"]["action"] == "./share/"
    assert manifest["share_target"]["method"] == "POST"
    assert all((DIST / icon["src"]).is_file() for icon in manifest["icons"])
    assert (DIST / "sw.js").is_file()
    for page in DIST.rglob("*.html"):
        parser = Links()
        parser.feed(page.read_text(encoding="utf-8"))
        for link in parser.targets:
            rel = unquote(urlsplit(link).path.removeprefix(BASE))
            target = DIST / rel
            assert target.is_file() or (target / "index.html").is_file(), f"{page.relative_to(DIST)} → {link}"
    print(f"Checked {len(places)} place pages and {len(cities)} city pages in each of five languages, {len(trails)} trails, public data and internal links")


if __name__ == "__main__":
    check()
