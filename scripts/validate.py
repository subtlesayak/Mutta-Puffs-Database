"""Check the atlas schemas, provenance, duplicates, and references."""

from atlas_data import catalogue


if __name__ == "__main__":
    data = catalogue()
    print(f"Validated {len(data['places'])} places, {len(data['reviews'])} reviews and {len(data['observations'])} observations")
    for pair in data["stats"]["duplicate_candidates"]:
        print(f"Repeated name for review: {', '.join(pair['place_ids'])} ({pair['distance_km']} km apart)")
