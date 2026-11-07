/* Aggregate results from the first TikTok development experiment. */
(function(root) {
  const experiment = {
  "experiment_date": "2026-11-07",
  "stage": "development validation",
  "live_model": "A",
  "model_choices": {
    "A": "Civil Comments TF-IDF + logistic regression",
    "B": "SetFit / BGE-small, comment",
    "C": "SetFit / BGE-small, comment + caption + direct parent"
  },
  "batch": {
    "reviewed": 40,
    "N": 26,
    "V": 10,
    "U": 2,
    "P": 2
  },
  "train": {
    "N": 18,
    "V": 8
  },
  "validation": {
    "N": 8,
    "V": 2
  },
  "validation_note": "One seeded split by creator, video and similar text. Both validation violations concern harm. Cutoffs selected using these two violations; 90% requires catching both.",
  "original_pilot": {
    "reviewed": 100,
    "N": 100,
    "A_live_cutoff_false_flags": 5,
    "role": "previously inspected regression batch"
  },
  "baseline_on_40": {
    "live_cutoff": 0.15794454885986295,
    "resolved": {
      "n": 36,
      "positives": 10,
      "negatives": 26,
      "tp": 8,
      "fp": 11,
      "fn": 2,
      "tn": 15,
      "precision": 0.42105263157894735,
      "recall": 0.8,
      "fpr": 0.4230769230769231,
      "review_rate": 0.5277777777777778
    },
    "flagged_by_label": {
      "V": 8,
      "N": 11,
      "U": 1,
      "P": 2
    },
    "capacity_four_by_label": {
      "V": 0,
      "N": 3,
      "U": 0,
      "P": 1
    },
    "rules_capacity_four_by_label": {
      "V": 0,
      "N": 2,
      "U": 0,
      "P": 2
    }
  },
  "validation_comparison": {
    "A": {
      "validation_cutoff": 0.18201750481483422,
      "validation": {
        "n": 10,
        "positives": 2,
        "negatives": 8,
        "tp": 2,
        "fp": 4,
        "fn": 0,
        "tn": 4,
        "precision": 0.3333333333333333,
        "recall": 1.0,
        "fpr": 0.5,
        "review_rate": 0.6
      },
      "first_review_label": "N",
      "review_slots": 1,
      "top1_violations_caught": 0,
      "top1_recall": 0.0,
      "top1_precision": 0,
      "prior_100_false_flags_at_validation_cutoff": 5,
      "prior_five_repeated_at_validation_cutoff": 5
    },
    "B": {
      "validation_cutoff": 0.28435513377189636,
      "validation": {
        "n": 10,
        "positives": 2,
        "negatives": 8,
        "tp": 2,
        "fp": 4,
        "fn": 0,
        "tn": 4,
        "precision": 0.3333333333333333,
        "recall": 1.0,
        "fpr": 0.5,
        "review_rate": 0.6
      },
      "first_review_label": "V",
      "review_slots": 1,
      "top1_violations_caught": 1,
      "top1_recall": 0.5,
      "top1_precision": 1,
      "prior_100_false_flags_at_validation_cutoff": 19,
      "prior_five_repeated_at_validation_cutoff": 2
    },
    "C": {
      "validation_cutoff": 0.3932895362377167,
      "validation": {
        "n": 10,
        "positives": 2,
        "negatives": 8,
        "tp": 2,
        "fp": 1,
        "fn": 0,
        "tn": 7,
        "precision": 0.6666666666666666,
        "recall": 1.0,
        "fpr": 0.125,
        "review_rate": 0.3
      },
      "first_review_label": "V",
      "review_slots": 1,
      "top1_violations_caught": 1,
      "top1_recall": 0.5,
      "top1_precision": 1,
      "prior_100_false_flags_at_validation_cutoff": 4,
      "prior_five_repeated_at_validation_cutoff": 0
    }
  },
  "decision": "Retain A in the live queue. B and C are trained offline. The validation and regression samples do not establish a model winner.",
  "next_evaluation": "Freeze candidates and cutoffs, then evaluate on fresh comments grouped by creator and video. Report natural-sample review workload and per-category detection separately from enriched error analysis.",
  "models_sha256": {
    "B": "aa767be7c693d0480020c1a15b8f34bddfd995f4ca6ab814fbabcb375197066d",
    "C": "c46bb98c5c82e863a19f6cf7456d72f9a660535af0ca5143e3ee763d2bdcadc1"
  },
  "training_data_sha256": "ef8f46814525a1ff5adcf3f5fbd7d03e794f57c7c662722f649fe6a8f077ad7a"
};
  if (typeof module !== "undefined") module.exports = experiment;
  else root.ReviewContextRun = experiment;
})(typeof window !== "undefined" ? window : globalThis);
