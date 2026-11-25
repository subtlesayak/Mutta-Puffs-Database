import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from atlas_data import catalogue, check_duplicate_targets, imported_place, merge_places, place_geojson, validated
from analyze import analyse, read_rows
from geography import Boundaries

APPROVED = {"places": [], "reviews": [], "observations": [], "trails": []}


class AtlasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = read_rows()
        cls.boundaries = Boundaries()
        cls.atlas = catalogue(cls.rows, APPROVED)

    def test_import_preserves_all_rows_and_pin_provenance(self):
        places = self.atlas["places"]
        self.assertEqual(len(places), len(self.rows))
        self.assertEqual({p["source"]["source_row"] for p in places}, set(range(2, len(self.rows) + 2)))
        self.assertEqual(len({p["id"] for p in places}), len(places))
        self.assertTrue(all(p["verification"]["status"] != "verified" for p in places))
        by_key = {p["source"]["import_key"]: p for p in places}
        data = analyse(self.rows, self.boundaries)["records"]
        for row in data:
            record = imported_place(row)
            self.assertEqual(record, by_key[record["source"]["import_key"]])
            if row["coordinate_source"] == "Explicit pin":
                self.assertEqual(record["location"]["accuracy"], "source_pin")
            if row["coordinate_source"] == "Estimated from link":
                self.assertEqual(record["location"]["accuracy"], "estimated")

    def test_stable_ids_ignore_csv_sort_order(self):
        reverse = [imported_place(row)["id"] for row in analyse(self.rows[::-1], self.boundaries)["records"]]
        self.assertEqual(set(reverse), {p["id"] for p in self.atlas["places"]})

    def test_geojson_uses_lon_lat_and_only_mappable_rows(self):
        places = {p["id"]: p for p in self.atlas["places"]}
        geo = place_geojson(list(places.values()))
        self.assertEqual(len(geo["features"]), self.atlas["stats"]["mappable"])
        for pin in geo["features"]:
            loc = places[pin["id"]]["location"]
            self.assertEqual(pin["geometry"]["coordinates"], [loc["longitude"], loc["latitude"]])
            self.assertEqual(pin["properties"]["accuracy"], loc["accuracy"])

    def test_no_invented_price_review_or_coordinates_for_tag_only_row(self):
        self.assertFalse(self.atlas["reviews"])
        self.assertFalse(self.atlas["observations"])
        tag = next(p for p in self.atlas["places"] if p["name"] == "Nive backery")
        self.assertIsNone(tag["location"]["latitude"])
        self.assertFalse(tag["map_links"])

    def test_duplicate_target_may_not_be_added_but_repeated_names_are_kept(self):
        places = self.atlas["places"]
        duplicate = copy.deepcopy(next(p for p in places if "google_maps" in p["map_links"]))
        duplicate["id"] = "mpdb-testlink"
        with self.assertRaisesRegex(ValueError, "Duplicate Maps target"):
            check_duplicate_targets(places + [duplicate])
        self.assertTrue(self.atlas["stats"]["duplicate_candidates"])

    def test_correction_cannot_replace_the_registered_source(self):
        place = copy.deepcopy(self.atlas["places"][0])
        place["source"]["import_key"] = "cid:bad"
        with self.assertRaisesRegex(ValueError, "preserve import provenance"):
            merge_places(self.atlas["places"], [place])

    def test_corrections_follow_a_refresh_and_keep_current_archive_provenance(self):
        first = self.atlas["places"][0]
        correction = copy.deepcopy(first)
        correction["name"] = "Corrected name"
        correction["verification"]["reference"] = "https://github.com/subtlesayak/Mutta-Puffs-Database/issues/1"
        rows = [*self.rows[1:], self.rows[0]]
        atlas = catalogue(rows, {**APPROVED, "places": [correction]})
        found = next(place for place in atlas["places"] if place["id"] == first["id"])
        self.assertEqual(found["name"], "Corrected name")
        self.assertEqual(found["source"]["source_row"], len(rows) + 1)

    def test_retargeted_link_requires_identity_registration(self):
        first = self.atlas["places"][0]
        alternate = "https://www.google.com/maps/search/?api=1&query=12.5,77.5"
        rows = [{**self.rows[0], "URL": alternate}, *self.rows[1:]]
        identities = {"schema_version": 1, "import_ids": {first["source"]["import_key"]: first["id"]}, "merges": {}}
        with self.assertRaisesRegex(ValueError, "is missing"):
            catalogue(rows, APPROVED, identities)
        identities["import_ids"]["url:" + alternate] = first["id"]
        refreshed = catalogue(rows, APPROVED, identities)
        self.assertEqual(refreshed["places"][0]["id"], first["id"])
        self.assertEqual(refreshed["places"][0]["source"]["reference"], alternate)

    def test_duplicate_rows_stay_in_archive_with_one_place(self):
        atlas = catalogue([*self.rows, self.rows[0]], APPROVED)
        self.assertEqual(atlas["stats"]["archive"]["rows"], len(self.rows) + 1)
        self.assertEqual(len(atlas["places"]), len(self.rows))

    def test_reviewed_merge_moves_references_and_preserves_raw_rows(self):
        retired, canonical, other = [place["id"] for place in self.atlas["places"][:3]]
        reference = "https://github.com/subtlesayak/Mutta-Puffs-Database/issues/1"
        identities = {"schema_version": 1, "import_ids": {}, "merges": {retired: {"place_id": canonical, "reference": reference}}}
        observation = {"id": "observation-test", "place_id": retired, "observed_on": "2020-01-01",
                       "source": reference, "price": {"amount": 20, "currency": "INR"}}
        reviewed = {**APPROVED, "observations": [observation],
                    "trails": [{"id": "trail-test", "name": "Test trail", "description": "Fixture", "place_ids": [retired, canonical, other]}]}
        atlas = catalogue(self.rows, reviewed, identities)
        self.assertEqual(atlas["stats"]["archive"]["rows"], len(self.rows))
        self.assertEqual(len(atlas["places"]), len(self.rows) - 1)
        self.assertEqual(atlas["place_aliases"], {retired: canonical})
        self.assertEqual(atlas["observations"][0]["place_id"], canonical)
        self.assertEqual(atlas["trails"][0]["place_ids"], [canonical, other])
        self.assertEqual(observation["place_id"], retired)
        identities["merges"][canonical] = {"place_id": retired, "reference": reference}
        with self.assertRaisesRegex(ValueError, "Circular place merge"):
            catalogue(self.rows, reviewed, identities)

    def test_review_and_observation_validation(self):
        first = self.atlas["places"][0]["id"]
        issue = "https://github.com/subtlesayak/Mutta-Puffs-Database/issues/1"
        review = {"id":"review-test","place_id":first,"visited_on":"2020-01-01","source":issue,
                  "scores":{"pastry":10,"filling":8,"egg":6,"freshness":4,"value":2},"note":"Test fixture only"}
        observation = {"id":"observation-test","place_id":first,"observed_on":"2020-01-01","source":issue,
                       "price":{"amount":20,"currency":"INR"},"fresh_batch_times":["16:00"]}
        self.assertEqual(validated([review], "review"), [review])
        self.assertEqual(validated([observation], "observation"), [observation])
        review["scores"]["egg"] = 11
        with self.assertRaises(ValueError):
            validated([review], "review")
        observation["fresh_batch_times"] = ["26:03"]
        with self.assertRaises(ValueError):
            validated([observation], "observation")


if __name__ == "__main__":
    unittest.main()
