import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from community_metrics import WEIGHTS, summarize


class CommunityMetricsTests(unittest.TestCase):
    def test_empty_catalogue_has_no_scores_ranks_or_index(self):
        result = summarize([], [], [])
        self.assertEqual(result["place_metrics"], {})
        self.assertEqual(result["leaderboard"]["ranking"], [])
        self.assertEqual(result["price_index"]["series"], [])

    def test_single_perfect_review_does_not_enter_the_ranking(self):
        reviews = [{"place_id": "one", "scores": dict.fromkeys(WEIGHTS, 10)}]
        reviews += [{"place_id": "many", "scores": dict.fromkeys(WEIGHTS, 9)} for _ in range(12)]
        reviews += [{"place_id": "few", "scores": dict.fromkeys(WEIGHTS, 9)} for _ in range(3)]
        result = summarize(reviews, [], [])
        self.assertEqual(result["place_metrics"]["one"]["score"]["score"], 100)
        self.assertEqual([row["place_id"] for row in result["leaderboard"]["ranking"]], ["many", "few"])
        self.assertEqual(result["leaderboard"]["ranking"][0]["adjusted"], 86)

    def test_scores_weight_puff_components_out_of_one_hundred(self):
        review = {"place_id": "one", "scores": {"pastry": 10, "filling": 8, "egg": 6, "freshness": 4, "value": 2}}
        result = summarize([review], [], [])
        self.assertEqual(result["place_metrics"]["one"]["score"]["score"], 67)

    def test_price_index_deduplicates_monthly_shops_and_separates_currencies(self):
        def price(shop, date, value, currency="INR"):
            return {"id": shop + date, "place_id": shop, "observed_on": date,
                    "price": {"amount": value, "currency": currency}, "source": "test evidence"}

        reports = [price("a", "2025-01-01", 20), price("a", "2025-01-03", 30),
                   price("b", "2025-01-04", 28), price("c", "2025-01-05", 32),
                   price("a", "2025-02-01", 10), price("b", "2025-02-04", 34),
                   price("a", "2025-03-01", 33), price("b", "2025-03-04", 36), price("c", "2025-03-05", 39),
                   price("d", "2025-01-04", 2, "GBP")]
        metrics = summarize([], list(reversed(reports)), [{"id": "city", "place_ids": ["a", "b", "c", "d"]}])
        by_currency = {series["currency"]: series for series in metrics["price_index"]["series"]}
        months = by_currency["INR"]["months"]
        self.assertEqual([row["shop_count"] for row in months], [3, 2, 3])
        self.assertEqual([row["index"] for row in months], [100, None, 120])
        self.assertEqual(months[0]["first_observed"], "2025-01-03")
        self.assertIsNone(by_currency["GBP"]["baseline"])
        self.assertEqual(metrics["place_metrics"]["a"]["price"]["amount"], 33)
