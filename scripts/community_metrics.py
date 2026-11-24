"""Derive scores and price series from independently approved contributions."""

from collections import defaultdict
from statistics import mean, median

WEIGHTS = {"pastry": 25, "filling": 25, "egg": 20, "freshness": 20, "value": 10}
MIN_REVIEWS = 3
PRIOR_SCORE = 70
PRIOR_REVIEWS = 3
MIN_INDEX_SHOPS = 3


def summarize(reviews, observations, cities):
    metrics = defaultdict(dict)
    grouped = defaultdict(list)
    for review in reviews:
        grouped[review["place_id"]].append(review)
    ranking = []
    for place_id, group in grouped.items():
        count = len(group)
        parts = {key: mean(review["scores"][key] for review in group) for key in WEIGHTS}
        raw = sum(parts[key] * weight / 10 for key, weight in WEIGHTS.items())
        adjusted = (raw * count + PRIOR_SCORE * PRIOR_REVIEWS) / (count + PRIOR_REVIEWS)
        score = {
            "count": count, "score": round(raw, 1), "adjusted": round(adjusted, 1),
            "breakdown": {key: round(value, 1) for key, value in parts.items()},
        }
        metrics[place_id]["score"] = score
        if count >= MIN_REVIEWS:
            ranking.append({"place_id": place_id, **score})

    city_for = {place_id: city["id"] for city in cities for place_id in city["place_ids"]}
    monthly = defaultdict(dict)
    prices = sorted((row for row in observations if "price" in row), key=lambda row: (row["observed_on"], row["id"]))
    for row in prices:
        place_id, day, price = row["place_id"], row["observed_on"], row["price"]
        metrics[place_id]["price"] = {**price, "observed_on": day, "source": row["source"]}
        if place_id in city_for:
            monthly[city_for[place_id], price["currency"], day[:7]][place_id] = row

    series = defaultdict(list)
    for (city, currency, month), records in sorted(monthly.items()):
        values = list(records.values())
        series[city, currency].append({
            "month": month, "median": median(row["price"]["amount"] for row in values),
            "shop_count": len(values), "first_observed": min(row["observed_on"] for row in values),
            "last_observed": max(row["observed_on"] for row in values),
        })
    index = []
    for (city_id, currency), months in series.items():
        baseline = next((month for month in months if month["shop_count"] >= MIN_INDEX_SHOPS), None)
        for month in months:
            month["index"] = (round(month["median"] / baseline["median"] * 100, 1)
                              if baseline and month["shop_count"] >= MIN_INDEX_SHOPS else None)
        index.append({"city_id": city_id, "currency": currency, "baseline": baseline["month"] if baseline else None, "months": months})

    ranking.sort(key=lambda row: (-row["adjusted"], -row["count"], row["place_id"]))
    return {
        "place_metrics": dict(metrics),
        "leaderboard": {
            "ranking": ranking, "status": "ready" if ranking else "collecting_reviews",
            "policy": {"weights": WEIGHTS, "minimum_reviews": MIN_REVIEWS, "prior_score": PRIOR_SCORE, "prior_reviews": PRIOR_REVIEWS},
        },
        "price_index": {"series": index, "minimum_shops": MIN_INDEX_SHOPS},
    }
