"""Data leakage, label provenance, context preservation and metric checks."""

import copy, unittest
from context_train import PLAN, validate_rows, serialize, threshold_for_recall, metrics


class Words:
    def encode(self, text, add_special_tokens=True):
        return text.split() + (["<end>"] if add_special_tokens else [])

    def decode(self, ids):
        return " ".join(ids)


def dataset():
    rows = []
    for split, n in (("train", 16), ("validation", 4)):
        for i in range(n):
            key = f"{split}-{i}"
            rows.append(
                dict(
                    id=key,
                    comment=f"Unique example {split} {i}",
                    caption=None,
                    parent=None,
                    group_id=key,
                    family_id=key,
                    split=split,
                    human_decision="Violation" if i % 2 else "No violation",
                    reviewer="test-fixture",
                    label_status="human_confirmed",
                    policy_version=PLAN["policy_version"],
                    source_kind="real",
                )
            )
    return rows


class ContextContracts(unittest.TestCase):
    def test_valid_data(self):
        self.assertEqual(validate_rows(dataset())["train"]["Violation"], 8)

    def test_unconfirmed_rejected(self):
        rows = dataset()
        rows[0]["label_status"] = "assistant_proposed"
        with self.assertRaisesRegex(ValueError, "Unconfirmed"):
            validate_rows(rows)

    def test_one_class_rejected(self):
        rows = dataset()
        for r in rows:
            r["human_decision"] = "No violation"
        with self.assertRaisesRegex(ValueError, "both classes"):
            validate_rows(rows)

    def test_cross_split_group_and_family_rejected(self):
        for field in ("group_id", "family_id"):
            rows = dataset()
            rows[-1][field] = rows[0][field]
            with self.assertRaisesRegex(ValueError, "spans splits"):
                validate_rows(rows)

    def test_normalized_duplicate_rejected(self):
        rows = dataset()
        rows[-1]["comment"] = rows[0]["comment"].upper() + "!!!"
        with self.assertRaisesRegex(ValueError, "spans splits"):
            validate_rows(rows)

    def test_locked_test_rejected(self):
        rows = dataset()
        rows[-1]["split"] = "test"
        with self.assertRaisesRegex(ValueError, "locked test"):
            validate_rows(rows)

    def test_synthetic_cannot_train(self):
        rows = dataset()
        rows[0]["source_kind"] = "synthetic"
        with self.assertRaisesRegex(ValueError, "Synthetic"):
            validate_rows(rows)

    def test_context_truncates_before_comment(self):
        row = {
            "comment": "Keep every comment token.",
            "caption": "caption " * 100,
            "parent": "parent " * 100,
            "human_decision": "SECRET_LABEL",
            "note": "SECRET_REASON",
        }
        text, audit = serialize(row, "C", Words(), limit=50)
        self.assertIn(row["comment"], text)
        self.assertTrue(audit["context_truncated"])
        self.assertLessEqual(audit["tokens"], 50)
        self.assertNotIn("SECRET", text)

    def test_long_comment_rejected(self):
        for arm in ("B", "C"):
            with self.assertRaisesRegex(ValueError, "manual handling"):
                serialize({"comment": "word " * 100}, arm, Words(), limit=30)

    def test_missing_context_explicit(self):
        text, audit = serialize({"comment": "Hello"}, "C", Words())
        self.assertIn("[missing or omitted]", text)
        self.assertTrue(audit["caption_missing"] and audit["parent_missing"])

    def test_recall_threshold_with_ties(self):
        self.assertEqual(
            threshold_for_recall([1, 0, 1, 0], [0.8, 0.4, 0.4, 0.1], 1), 0.4
        )
        with self.assertRaises(ValueError):
            threshold_for_recall([0, 0], [0.8, 0.1], 0.9)

    def test_metrics_do_not_invent_recall(self):
        self.assertIsNone(metrics([0, 0], [0.8, 0.1], 0.5)["recall"])
        self.assertEqual(
            metrics([1, 0, 1, 0], [0.9, 0.8, 0.2, 0.1], 0.5),
            dict(
                n=4,
                positives=2,
                negatives=2,
                tp=1,
                fp=1,
                fn=1,
                tn=1,
                precision=0.5,
                recall=0.5,
                fpr=0.5,
                review_rate=0.5,
            ),
        )


if __name__ == "__main__":
    unittest.main()
