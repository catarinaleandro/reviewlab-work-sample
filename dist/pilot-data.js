/* Aggregate evaluation and paraphrased cases; original comments remain private. */
(function(root){const data={
  "version": "tiktok-human-review-v1",
  "evaluated_on": "2026-11-06",
  "sample_id": "reviewlab-tiktok-pilot-v1-2026-11-06",
  "model_id": "civil-60k-v1",
  "policy_version": "review-rubric-v3-tiktok-2026-09-24",
  "label_counts": {
    "reviewed": 100,
    "no_violation": 100,
    "violation": 0,
    "unresolved": 0
  },
  "provenance": {
    "source_title": "Crawlora: TikTok Product Video Comments 2026",
    "source_url": "https://huggingface.co/datasets/crawlora-net/tiktok-product-video-comments",
    "source_revision": "e2ba71105668f398ad93e6e5b5fa9a973068657b",
    "videos": 24,
    "source_topics": 12,
    "collection_period": "10–13 September 2026",
    "reviewer": "Catarina Leandro",
    "review_method": "Single-reviewer calibration. Batch display hid predictions. Five decisions involved AI-assisted contextual discussion; original decisions remain in the private history.",
    "assisted_discussion_ids": [
      "TT003",
      "TT008",
      "TT056",
      "TT083",
      "TT085"
    ],
    "model_input": "Comment text only. Captions informed human review; video/audio were not reviewed.",
    "sampling": "Shopping/lifestyle archive, balanced across source topics; not representative of all TikTok.",
    "publication": "Case summaries are paraphrases. Public records contain sample IDs, scores and labels, not original comments or personal/source identifiers."
  },
  "input_hashes": {
    "scored_sample": "aa9224b091dc8c8565b2287af4d5d7e3a5fa3a1fc14ba47d85ba91273ee7e19c",
    "human_decisions": "86b49c30e69ee3c3753916c88c40ca8a0ecc0634d4890a156b988a0c5e9f231a",
    "model": "284e3859c49ceb7eb3cedc03d8f04bfd14d1617fead98f4d4191f9c12ae7a1a0"
  },
  "fixed_threshold": {
    "value": 0.15794454885986295,
    "operator": ">=",
    "origin": "Frozen Civil Comments validation cutoff, selected before this TikTok sample",
    "n": 100,
    "positives": 0,
    "negatives": 100,
    "flagged": 5,
    "tp": 0,
    "fp": 5,
    "fn": 0,
    "tn": 95,
    "review_rate": 0.05,
    "precision": 0,
    "recall": null,
    "false_positive_rate": 0.05,
    "selected_ids": [
      "TT097",
      "TT002",
      "TT036",
      "TT066",
      "TT063"
    ]
  },
  "fixed_capacity": {
    "fraction": 0.1,
    "k": 10,
    "tie_break": "Descending score, then dashboard SHA-256 import ID ascending",
    "methods": {
      "word_char": {
        "n": 100,
        "positives": 0,
        "negatives": 100,
        "flagged": 10,
        "tp": 0,
        "fp": 10,
        "fn": 0,
        "tn": 90,
        "review_rate": 0.1,
        "precision": 0,
        "recall": null,
        "false_positive_rate": 0.1,
        "selected_ids": [
          "TT097",
          "TT002",
          "TT036",
          "TT066",
          "TT063",
          "TT004",
          "TT074",
          "TT029",
          "TT021",
          "TT048"
        ]
      },
      "word": {
        "n": 100,
        "positives": 0,
        "negatives": 100,
        "flagged": 10,
        "tp": 0,
        "fp": 10,
        "fn": 0,
        "tn": 90,
        "review_rate": 0.1,
        "precision": 0,
        "recall": null,
        "false_positive_rate": 0.1,
        "selected_ids": [
          "TT002",
          "TT097",
          "TT066",
          "TT036",
          "TT055",
          "TT024",
          "TT063",
          "TT076",
          "TT029",
          "TT011"
        ]
      },
      "rules": {
        "n": 100,
        "positives": 0,
        "negatives": 100,
        "flagged": 10,
        "tp": 0,
        "fp": 10,
        "fn": 0,
        "tn": 90,
        "review_rate": 0.1,
        "precision": 0,
        "recall": null,
        "false_positive_rate": 0.1,
        "selected_ids": [
          "TT099",
          "TT057",
          "TT084",
          "TT055",
          "TT053",
          "TT003",
          "TT037",
          "TT021",
          "TT076",
          "TT018"
        ]
      }
    }
  },
  "any_keyword_match": {
    "definition": "Rule score > 0; a diagnostic, not a capacity-matched classifier comparison",
    "n": 100,
    "positives": 0,
    "negatives": 100,
    "flagged": 0,
    "tp": 0,
    "fp": 0,
    "fn": 0,
    "tn": 100,
    "review_rate": 0,
    "precision": null,
    "recall": null,
    "false_positive_rate": 0,
    "selected_ids": []
  },
  "cases": [
    {
      "id": "TT097",
      "rank": 1,
      "score": 0.9768751582974063,
      "human_decision": "No violation",
      "above_frozen_cutoff": true,
      "summary": "Enthusiastic praise for a pair of earbuds.",
      "context": "Earbud launch and workout features.",
      "interpretation": "Profanity expresses enthusiasm here. It does not target anyone with abuse.",
      "positive_word_features": [
        {
          "term": "damn",
          "contribution": 2.548839273858891
        },
        {
          "term": "they look",
          "contribution": 0.24834174370430506
        },
        {
          "term": "they",
          "contribution": 0.11920180146767642
        }
      ]
    },
    {
      "id": "TT002",
      "rank": 2,
      "score": 0.8757766356782295,
      "human_decision": "No violation",
      "above_frozen_cutoff": true,
      "summary": "An emphatic one-word reaction to a mop-cleaning demonstration.",
      "context": "Scrubbing a dirty mop with cleaning gel.",
      "interpretation": "The reaction has no established personal target. A word associated with insults can also express surprise.",
      "positive_word_features": [
        {
          "term": "crazy",
          "contribution": 2.2650352792806805
        }
      ]
    },
    {
      "id": "TT036",
      "rank": 3,
      "score": 0.3763133660896496,
      "human_decision": "No violation",
      "above_frozen_cutoff": true,
      "summary": "Asks whether a screw could function as a drill bit.",
      "context": "Woodworking and screw design.",
      "interpretation": "The potentially ambiguous vocabulary describes physical tools. The human review found no abusive act.",
      "positive_word_features": [
        {
          "term": "screw",
          "contribution": 0.3008014082398358
        },
        {
          "term": "you",
          "contribution": 0.16534125887699266
        },
        {
          "term": "what",
          "contribution": 0.1575125687228894
        }
      ]
    },
    {
      "id": "TT066",
      "rank": 4,
      "score": 0.35322392304787287,
      "human_decision": "No violation",
      "above_frozen_cutoff": true,
      "summary": "Asks whether freezing stored grains eliminates insect eggs.",
      "context": "Long-term dry-food storage.",
      "interpretation": "The reference to killing concerns food pests, not a threat toward a person.",
      "positive_word_features": [
        {
          "term": "kill",
          "contribution": 0.6263974092112904
        },
        {
          "term": "to kill",
          "contribution": 0.2615839348790405
        },
        {
          "term": "have to",
          "contribution": 0.20613715773412886
        }
      ]
    },
    {
      "id": "TT063",
      "rank": 5,
      "score": 0.19837933691876,
      "human_decision": "No violation",
      "above_frozen_cutoff": true,
      "summary": "Expresses frustration about a crowded freezer and switching to drying food.",
      "context": "Chopping and freezing onions.",
      "interpretation": "Negative language describes a storage problem. It does not establish targeted harassment.",
      "positive_word_features": [
        {
          "term": "ridiculous",
          "contribution": 0.3926129726233378
        },
        {
          "term": "cant",
          "contribution": 0.09070329181120537
        },
        {
          "term": "is",
          "contribution": 0.08106393159380255
        }
      ]
    },
    {
      "id": "TT004",
      "rank": 6,
      "score": 0.15406235898403997,
      "human_decision": "No violation",
      "above_frozen_cutoff": false,
      "summary": "Praises a dirty-mop cleaning demonstration.",
      "context": "Scrubbing a dirty mop with cleaning gel.",
      "interpretation": "The language describes a literal cleaning task. This is a top-10 selection but falls below the frozen cutoff.",
      "positive_word_features": [
        {
          "term": "dirty",
          "contribution": 0.9744032579340721
        },
        {
          "term": "good",
          "contribution": 0.11718472260333414
        }
      ]
    },
    {
      "id": "TT074",
      "rank": 7,
      "score": 0.09644584499543765,
      "human_decision": "No violation",
      "above_frozen_cutoff": false,
      "summary": "Requests release of files about a political public figure.",
      "context": "A dog-bed post with political references.",
      "interpretation": "The human reviewer found no prohibited act in this political request. A political name alone is not a violation.",
      "positive_word_features": [
        {
          "term": "trump",
          "contribution": 0.32131870506095
        },
        {
          "term": "the trump",
          "contribution": 0.21043580308790333
        },
        {
          "term": "the",
          "contribution": 0.0608816143554227
        }
      ]
    },
    {
      "id": "TT029",
      "rank": 8,
      "score": 0.09030959298164508,
      "human_decision": "No violation",
      "above_frozen_cutoff": false,
      "summary": "Admires a miniature maker’s patience and dedication.",
      "context": "Building a miniature house from craft materials.",
      "interpretation": "The comment expresses admiration. Its low score still enters a queue that must fill ten slots.",
      "positive_word_features": [
        {
          "term": "dedication",
          "contribution": 0.19360532758627477
        },
        {
          "term": "patience",
          "contribution": 0.16305760364195318
        },
        {
          "term": "this",
          "contribution": 0.14443238957441146
        }
      ]
    },
    {
      "id": "TT021",
      "rank": 9,
      "score": 0.07753127395440354,
      "human_decision": "No violation",
      "above_frozen_cutoff": false,
      "summary": "Jokes that a home coffee setup resembles a café.",
      "context": "A home espresso machine and grinder.",
      "interpretation": "The joke concerns a coffee setup. The human review found no harmful targeting.",
      "positive_word_features": [
        {
          "term": "buddy",
          "contribution": 0.21818113250514448
        },
        {
          "term": "an",
          "contribution": 0.10239439221493439
        },
        {
          "term": "at home",
          "contribution": 0.07625490616852544
        }
      ]
    },
    {
      "id": "TT048",
      "rank": 10,
      "score": 0.07575381973610615,
      "human_decision": "No violation",
      "above_frozen_cutoff": false,
      "summary": "Plans to try a hair routine and asks for good luck.",
      "context": "Heatless curls using socks.",
      "interpretation": "An ordinary intention to try the routine. Queue membership alone does not mean the model passed its flag cutoff.",
      "positive_word_features": [
        {
          "term": "try",
          "contribution": 0.18207514316298276
        },
        {
          "term": "this",
          "contribution": 0.1085934411629308
        },
        {
          "term": "me",
          "contribution": 0.06225704428174581
        }
      ]
    }
  ],
  "records": [
    {
      "id": "TT001",
      "label": 0,
      "scores": {
        "word": 0.019927085067379707,
        "word_char": 0.008521854391556435,
        "rules": 0
      },
      "ranks": {
        "word_char": 91,
        "word": 88,
        "rules": 27
      }
    },
    {
      "id": "TT002",
      "label": 0,
      "scores": {
        "word": 0.8844822871358081,
        "word_char": 0.8757766356782295,
        "rules": 0
      },
      "ranks": {
        "word_char": 2,
        "word": 1,
        "rules": 56
      }
    },
    {
      "id": "TT003",
      "label": 0,
      "scores": {
        "word": 0.0287808433725241,
        "word_char": 0.028354564724937793,
        "rules": 0
      },
      "ranks": {
        "word_char": 34,
        "word": 62,
        "rules": 6
      }
    },
    {
      "id": "TT004",
      "label": 0,
      "scores": {
        "word": 0.07938448205077171,
        "word_char": 0.15406235898403997,
        "rules": 0
      },
      "ranks": {
        "word_char": 6,
        "word": 11,
        "rules": 74
      }
    },
    {
      "id": "TT005",
      "label": 0,
      "scores": {
        "word": 0.02992506755684466,
        "word_char": 0.020659525791891533,
        "rules": 0
      },
      "ranks": {
        "word_char": 46,
        "word": 56,
        "rules": 95
      }
    },
    {
      "id": "TT006",
      "label": 0,
      "scores": {
        "word": 0.03651761018497072,
        "word_char": 0.012435187799117736,
        "rules": 0
      },
      "ranks": {
        "word_char": 74,
        "word": 43,
        "rules": 35
      }
    },
    {
      "id": "TT007",
      "label": 0,
      "scores": {
        "word": 0.0364723185660249,
        "word_char": 0.031191080488036413,
        "rules": 0
      },
      "ranks": {
        "word_char": 31,
        "word": 44,
        "rules": 71
      }
    },
    {
      "id": "TT008",
      "label": 0,
      "scores": {
        "word": 0.021012772602697172,
        "word_char": 0.01441727476838426,
        "rules": 0
      },
      "ranks": {
        "word_char": 65,
        "word": 82,
        "rules": 41
      }
    },
    {
      "id": "TT009",
      "label": 0,
      "scores": {
        "word": 0.05848902953077515,
        "word_char": 0.0429909291302934,
        "rules": 0
      },
      "ranks": {
        "word_char": 22,
        "word": 21,
        "rules": 39
      }
    },
    {
      "id": "TT010",
      "label": 0,
      "scores": {
        "word": 0.062361763388587343,
        "word_char": 0.05134855293073012,
        "rules": 0
      },
      "ranks": {
        "word_char": 15,
        "word": 18,
        "rules": 30
      }
    },
    {
      "id": "TT011",
      "label": 0,
      "scores": {
        "word": 0.0813916726764178,
        "word_char": 0.04103001837361781,
        "rules": 0
      },
      "ranks": {
        "word_char": 23,
        "word": 10,
        "rules": 91
      }
    },
    {
      "id": "TT012",
      "label": 0,
      "scores": {
        "word": 0.024275788877443562,
        "word_char": 0.014415455807888888,
        "rules": 0
      },
      "ranks": {
        "word_char": 66,
        "word": 74,
        "rules": 65
      }
    },
    {
      "id": "TT013",
      "label": 0,
      "scores": {
        "word": 0.024630734039645955,
        "word_char": 0.005719879264051634,
        "rules": 0
      },
      "ranks": {
        "word_char": 96,
        "word": 72,
        "rules": 59
      }
    },
    {
      "id": "TT014",
      "label": 0,
      "scores": {
        "word": 0.04829167893315854,
        "word_char": 0.033314175496046455,
        "rules": 0
      },
      "ranks": {
        "word_char": 27,
        "word": 32,
        "rules": 51
      }
    },
    {
      "id": "TT015",
      "label": 0,
      "scores": {
        "word": 0.05452974212966521,
        "word_char": 0.039920204628807666,
        "rules": 0
      },
      "ranks": {
        "word_char": 25,
        "word": 23,
        "rules": 92
      }
    },
    {
      "id": "TT016",
      "label": 0,
      "scores": {
        "word": 0.04402139389908651,
        "word_char": 0.009859500115844383,
        "rules": 0
      },
      "ranks": {
        "word_char": 84,
        "word": 34,
        "rules": 57
      }
    },
    {
      "id": "TT017",
      "label": 0,
      "scores": {
        "word": 0.05428453134407296,
        "word_char": 0.018311652588073428,
        "rules": 0
      },
      "ranks": {
        "word_char": 54,
        "word": 24,
        "rules": 45
      }
    },
    {
      "id": "TT018",
      "label": 0,
      "scores": {
        "word": 0.03738401886739713,
        "word_char": 0.024001787075052846,
        "rules": 0
      },
      "ranks": {
        "word_char": 38,
        "word": 41,
        "rules": 10
      }
    },
    {
      "id": "TT019",
      "label": 0,
      "scores": {
        "word": 0.048755988523231646,
        "word_char": 0.018337428585417696,
        "rules": 0
      },
      "ranks": {
        "word_char": 52,
        "word": 31,
        "rules": 80
      }
    },
    {
      "id": "TT020",
      "label": 0,
      "scores": {
        "word": 0.033140520192147305,
        "word_char": 0.011298925813313617,
        "rules": 0
      },
      "ranks": {
        "word_char": 80,
        "word": 47,
        "rules": 18
      }
    },
    {
      "id": "TT021",
      "label": 0,
      "scores": {
        "word": 0.03552112248978749,
        "word_char": 0.07753127395440354,
        "rules": 0
      },
      "ranks": {
        "word_char": 9,
        "word": 45,
        "rules": 8
      }
    },
    {
      "id": "TT022",
      "label": 0,
      "scores": {
        "word": 0.02648331122830772,
        "word_char": 0.008910760887078109,
        "rules": 0
      },
      "ranks": {
        "word_char": 88,
        "word": 70,
        "rules": 89
      }
    },
    {
      "id": "TT023",
      "label": 0,
      "scores": {
        "word": 0.04034136588844403,
        "word_char": 0.019872125328878137,
        "rules": 0
      },
      "ranks": {
        "word_char": 49,
        "word": 36,
        "rules": 62
      }
    },
    {
      "id": "TT024",
      "label": 0,
      "scores": {
        "word": 0.11076418981820892,
        "word_char": 0.023980834926974552,
        "rules": 0
      },
      "ranks": {
        "word_char": 39,
        "word": 6,
        "rules": 19
      }
    },
    {
      "id": "TT025",
      "label": 0,
      "scores": {
        "word": 0.018639385683753232,
        "word_char": 0.006974901623215674,
        "rules": 0
      },
      "ranks": {
        "word_char": 94,
        "word": 91,
        "rules": 15
      }
    },
    {
      "id": "TT026",
      "label": 0,
      "scores": {
        "word": 0.071751075839097,
        "word_char": 0.0686763611454287,
        "rules": 0
      },
      "ranks": {
        "word_char": 11,
        "word": 14,
        "rules": 68
      }
    },
    {
      "id": "TT027",
      "label": 0,
      "scores": {
        "word": 0.028758709316238952,
        "word_char": 0.021502860843872214,
        "rules": 0
      },
      "ranks": {
        "word_char": 44,
        "word": 63,
        "rules": 14
      }
    },
    {
      "id": "TT028",
      "label": 0,
      "scores": {
        "word": 0.03220868443833094,
        "word_char": 0.02158267136823923,
        "rules": 0
      },
      "ranks": {
        "word_char": 43,
        "word": 50,
        "rules": 26
      }
    },
    {
      "id": "TT029",
      "label": 0,
      "scores": {
        "word": 0.08199738789155804,
        "word_char": 0.09030959298164508,
        "rules": 0
      },
      "ranks": {
        "word_char": 8,
        "word": 9,
        "rules": 72
      }
    },
    {
      "id": "TT030",
      "label": 0,
      "scores": {
        "word": 0.009972827808242768,
        "word_char": 0.004814668549685781,
        "rules": 0
      },
      "ranks": {
        "word_char": 98,
        "word": 99,
        "rules": 42
      }
    },
    {
      "id": "TT031",
      "label": 0,
      "scores": {
        "word": 0.05331673866295406,
        "word_char": 0.019985804743604233,
        "rules": 0
      },
      "ranks": {
        "word_char": 48,
        "word": 26,
        "rules": 37
      }
    },
    {
      "id": "TT032",
      "label": 0,
      "scores": {
        "word": 0.04607792468112857,
        "word_char": 0.022403774856546186,
        "rules": 0
      },
      "ranks": {
        "word_char": 42,
        "word": 33,
        "rules": 53
      }
    },
    {
      "id": "TT033",
      "label": 0,
      "scores": {
        "word": 0.05637738520736583,
        "word_char": 0.03945275263467467,
        "rules": 0
      },
      "ranks": {
        "word_char": 26,
        "word": 22,
        "rules": 79
      }
    },
    {
      "id": "TT034",
      "label": 0,
      "scores": {
        "word": 0.02170875161367229,
        "word_char": 0.015555264104741314,
        "rules": 0
      },
      "ranks": {
        "word_char": 60,
        "word": 79,
        "rules": 36
      }
    },
    {
      "id": "TT035",
      "label": 0,
      "scores": {
        "word": 0.020242059209607595,
        "word_char": 0.008491767805001032,
        "rules": 0
      },
      "ranks": {
        "word_char": 92,
        "word": 87,
        "rules": 48
      }
    },
    {
      "id": "TT036",
      "label": 0,
      "scores": {
        "word": 0.1644469228516743,
        "word_char": 0.3763133660896496,
        "rules": 0
      },
      "ranks": {
        "word_char": 3,
        "word": 4,
        "rules": 69
      }
    },
    {
      "id": "TT037",
      "label": 0,
      "scores": {
        "word": 0.059112085181398,
        "word_char": 0.03123401287140775,
        "rules": 0
      },
      "ranks": {
        "word_char": 30,
        "word": 20,
        "rules": 7
      }
    },
    {
      "id": "TT038",
      "label": 0,
      "scores": {
        "word": 0.07725921857763256,
        "word_char": 0.06155279036029916,
        "rules": 0
      },
      "ranks": {
        "word_char": 13,
        "word": 13,
        "rules": 81
      }
    },
    {
      "id": "TT039",
      "label": 0,
      "scores": {
        "word": 0.05111764938489788,
        "word_char": 0.04438414704533515,
        "rules": 0
      },
      "ranks": {
        "word_char": 20,
        "word": 28,
        "rules": 96
      }
    },
    {
      "id": "TT040",
      "label": 0,
      "scores": {
        "word": 0.06777492319798083,
        "word_char": 0.06397467918654823,
        "rules": 0
      },
      "ranks": {
        "word_char": 12,
        "word": 16,
        "rules": 73
      }
    },
    {
      "id": "TT041",
      "label": 0,
      "scores": {
        "word": 0.018050676771183775,
        "word_char": 0.014975649910220289,
        "rules": 0
      },
      "ranks": {
        "word_char": 63,
        "word": 92,
        "rules": 100
      }
    },
    {
      "id": "TT042",
      "label": 0,
      "scores": {
        "word": 0.03220868443833094,
        "word_char": 0.012531193786419663,
        "rules": 0
      },
      "ranks": {
        "word_char": 72,
        "word": 51,
        "rules": 43
      }
    },
    {
      "id": "TT043",
      "label": 0,
      "scores": {
        "word": 0.022600778452236403,
        "word_char": 0.015122607582990978,
        "rules": 0
      },
      "ranks": {
        "word_char": 61,
        "word": 78,
        "rules": 58
      }
    },
    {
      "id": "TT044",
      "label": 0,
      "scores": {
        "word": 0.03220868443833094,
        "word_char": 0.013305688709007165,
        "rules": 0
      },
      "ranks": {
        "word_char": 71,
        "word": 52,
        "rules": 52
      }
    },
    {
      "id": "TT045",
      "label": 0,
      "scores": {
        "word": 0.0318085829017618,
        "word_char": 0.01832513413602097,
        "rules": 0
      },
      "ranks": {
        "word_char": 53,
        "word": 54,
        "rules": 46
      }
    },
    {
      "id": "TT046",
      "label": 0,
      "scores": {
        "word": 0.030417722791389674,
        "word_char": 0.011649728895416971,
        "rules": 0
      },
      "ranks": {
        "word_char": 78,
        "word": 55,
        "rules": 64
      }
    },
    {
      "id": "TT047",
      "label": 0,
      "scores": {
        "word": 0.028297963499322707,
        "word_char": 0.0200892652260054,
        "rules": 0
      },
      "ranks": {
        "word_char": 47,
        "word": 67,
        "rules": 50
      }
    },
    {
      "id": "TT048",
      "label": 0,
      "scores": {
        "word": 0.0492260191030212,
        "word_char": 0.07575381973610615,
        "rules": 0
      },
      "ranks": {
        "word_char": 10,
        "word": 29,
        "rules": 83
      }
    },
    {
      "id": "TT049",
      "label": 0,
      "scores": {
        "word": 0.0372679373733276,
        "word_char": 0.015025049460010787,
        "rules": 0
      },
      "ranks": {
        "word_char": 62,
        "word": 42,
        "rules": 31
      }
    },
    {
      "id": "TT050",
      "label": 0,
      "scores": {
        "word": 0.02775731132365237,
        "word_char": 0.01431585645753893,
        "rules": 0
      },
      "ranks": {
        "word_char": 68,
        "word": 68,
        "rules": 67
      }
    },
    {
      "id": "TT051",
      "label": 0,
      "scores": {
        "word": 0.02052677053519389,
        "word_char": 0.008823240984755405,
        "rules": 0
      },
      "ranks": {
        "word_char": 89,
        "word": 85,
        "rules": 70
      }
    },
    {
      "id": "TT052",
      "label": 0,
      "scores": {
        "word": 0.041963280811512814,
        "word_char": 0.024942310529308245,
        "rules": 0
      },
      "ranks": {
        "word_char": 35,
        "word": 35,
        "rules": 82
      }
    },
    {
      "id": "TT053",
      "label": 0,
      "scores": {
        "word": 0.028315814347245317,
        "word_char": 0.014079003039960947,
        "rules": 0
      },
      "ranks": {
        "word_char": 69,
        "word": 66,
        "rules": 5
      }
    },
    {
      "id": "TT054",
      "label": 0,
      "scores": {
        "word": 0.03281567382589719,
        "word_char": 0.015577263839260655,
        "rules": 0
      },
      "ranks": {
        "word_char": 59,
        "word": 48,
        "rules": 86
      }
    },
    {
      "id": "TT055",
      "label": 0,
      "scores": {
        "word": 0.11096331961128109,
        "word_char": 0.058527839244528174,
        "rules": 0
      },
      "ranks": {
        "word_char": 14,
        "word": 5,
        "rules": 4
      }
    },
    {
      "id": "TT056",
      "label": 0,
      "scores": {
        "word": 0.013233623531612759,
        "word_char": 0.004193363429635394,
        "rules": 0
      },
      "ranks": {
        "word_char": 99,
        "word": 97,
        "rules": 29
      }
    },
    {
      "id": "TT057",
      "label": 0,
      "scores": {
        "word": 0.03981171668319988,
        "word_char": 0.029248859846915425,
        "rules": 0
      },
      "ranks": {
        "word_char": 33,
        "word": 39,
        "rules": 2
      }
    },
    {
      "id": "TT058",
      "label": 0,
      "scores": {
        "word": 0.02842308149022026,
        "word_char": 0.017612622443917876,
        "rules": 0
      },
      "ranks": {
        "word_char": 55,
        "word": 65,
        "rules": 63
      }
    },
    {
      "id": "TT059",
      "label": 0,
      "scores": {
        "word": 0.023742470851626736,
        "word_char": 0.0166964919499396,
        "rules": 0
      },
      "ranks": {
        "word_char": 57,
        "word": 75,
        "rules": 90
      }
    },
    {
      "id": "TT060",
      "label": 0,
      "scores": {
        "word": 0.021529148304078722,
        "word_char": 0.012131590015789074,
        "rules": 0
      },
      "ranks": {
        "word_char": 76,
        "word": 81,
        "rules": 24
      }
    },
    {
      "id": "TT061",
      "label": 0,
      "scores": {
        "word": 0.014007758634007668,
        "word_char": 0.0050666155426065465,
        "rules": 0
      },
      "ranks": {
        "word_char": 97,
        "word": 96,
        "rules": 87
      }
    },
    {
      "id": "TT062",
      "label": 0,
      "scores": {
        "word": 0.051733035066126094,
        "word_char": 0.04711548180183582,
        "rules": 0
      },
      "ranks": {
        "word_char": 19,
        "word": 27,
        "rules": 60
      }
    },
    {
      "id": "TT063",
      "label": 0,
      "scores": {
        "word": 0.09413954489145669,
        "word_char": 0.19837933691876,
        "rules": 0
      },
      "ranks": {
        "word_char": 5,
        "word": 7,
        "rules": 85
      }
    },
    {
      "id": "TT064",
      "label": 0,
      "scores": {
        "word": 0.06980636344242858,
        "word_char": 0.0486329946053768,
        "rules": 0
      },
      "ranks": {
        "word_char": 17,
        "word": 15,
        "rules": 11
      }
    },
    {
      "id": "TT065",
      "label": 0,
      "scores": {
        "word": 0.06275993858768168,
        "word_char": 0.04795776701250469,
        "rules": 0
      },
      "ranks": {
        "word_char": 18,
        "word": 17,
        "rules": 49
      }
    },
    {
      "id": "TT066",
      "label": 0,
      "scores": {
        "word": 0.3647249093376489,
        "word_char": 0.35322392304787287,
        "rules": 0
      },
      "ranks": {
        "word_char": 4,
        "word": 3,
        "rules": 84
      }
    },
    {
      "id": "TT067",
      "label": 0,
      "scores": {
        "word": 0.017275099277769147,
        "word_char": 0.01090338590887833,
        "rules": 0
      },
      "ranks": {
        "word_char": 82,
        "word": 93,
        "rules": 98
      }
    },
    {
      "id": "TT068",
      "label": 0,
      "scores": {
        "word": 0.04033989741691181,
        "word_char": 0.014366798388400253,
        "rules": 0
      },
      "ranks": {
        "word_char": 67,
        "word": 37,
        "rules": 17
      }
    },
    {
      "id": "TT069",
      "label": 0,
      "scores": {
        "word": 0.048985988163460524,
        "word_char": 0.04062018024897169,
        "rules": 0
      },
      "ranks": {
        "word_char": 24,
        "word": 30,
        "rules": 34
      }
    },
    {
      "id": "TT070",
      "label": 0,
      "scores": {
        "word": 0.01451286899614236,
        "word_char": 0.00910309405503647,
        "rules": 0
      },
      "ranks": {
        "word_char": 87,
        "word": 95,
        "rules": 44
      }
    },
    {
      "id": "TT071",
      "label": 0,
      "scores": {
        "word": 0.05411462223457269,
        "word_char": 0.04978042448498712,
        "rules": 0
      },
      "ranks": {
        "word_char": 16,
        "word": 25,
        "rules": 76
      }
    },
    {
      "id": "TT072",
      "label": 0,
      "scores": {
        "word": 0.029117465237601232,
        "word_char": 0.0214197572555577,
        "rules": 0
      },
      "ranks": {
        "word_char": 45,
        "word": 60,
        "rules": 40
      }
    },
    {
      "id": "TT073",
      "label": 0,
      "scores": {
        "word": 0.028585691854782134,
        "word_char": 0.03262654269402454,
        "rules": 0
      },
      "ranks": {
        "word_char": 28,
        "word": 64,
        "rules": 88
      }
    },
    {
      "id": "TT074",
      "label": 0,
      "scores": {
        "word": 0.07908364312574505,
        "word_char": 0.09644584499543765,
        "rules": 0
      },
      "ranks": {
        "word_char": 7,
        "word": 12,
        "rules": 47
      }
    },
    {
      "id": "TT075",
      "label": 0,
      "scores": {
        "word": 0.040185728001868384,
        "word_char": 0.0313909354379085,
        "rules": 0
      },
      "ranks": {
        "word_char": 29,
        "word": 38,
        "rules": 32
      }
    },
    {
      "id": "TT076",
      "label": 0,
      "scores": {
        "word": 0.08429578144500942,
        "word_char": 0.043854149950840374,
        "rules": 0
      },
      "ranks": {
        "word_char": 21,
        "word": 8,
        "rules": 9
      }
    },
    {
      "id": "TT077",
      "label": 0,
      "scores": {
        "word": 0.038397804459206056,
        "word_char": 0.023125069187173074,
        "rules": 0
      },
      "ranks": {
        "word_char": 41,
        "word": 40,
        "rules": 61
      }
    },
    {
      "id": "TT078",
      "label": 0,
      "scores": {
        "word": 0.022636876442972315,
        "word_char": 0.013661091749206782,
        "rules": 0
      },
      "ranks": {
        "word_char": 70,
        "word": 77,
        "rules": 33
      }
    },
    {
      "id": "TT079",
      "label": 0,
      "scores": {
        "word": 0.029319807534872427,
        "word_char": 0.015974222689146073,
        "rules": 0
      },
      "ranks": {
        "word_char": 58,
        "word": 59,
        "rules": 94
      }
    },
    {
      "id": "TT080",
      "label": 0,
      "scores": {
        "word": 0.021630421166772964,
        "word_char": 0.014639084350571216,
        "rules": 0
      },
      "ranks": {
        "word_char": 64,
        "word": 80,
        "rules": 77
      }
    },
    {
      "id": "TT081",
      "label": 0,
      "scores": {
        "word": 0.033597935416499074,
        "word_char": 0.009693305355512749,
        "rules": 0
      },
      "ranks": {
        "word_char": 86,
        "word": 46,
        "rules": 25
      }
    },
    {
      "id": "TT082",
      "label": 0,
      "scores": {
        "word": 0.026187468823863216,
        "word_char": 0.009752252169036007,
        "rules": 0
      },
      "ranks": {
        "word_char": 85,
        "word": 71,
        "rules": 78
      }
    },
    {
      "id": "TT083",
      "label": 0,
      "scores": {
        "word": 0.03220868443833094,
        "word_char": 0.019298167881993362,
        "rules": 0
      },
      "ranks": {
        "word_char": 51,
        "word": 53,
        "rules": 97
      }
    },
    {
      "id": "TT084",
      "label": 0,
      "scores": {
        "word": 0.010937989800074249,
        "word_char": 0.00266606359318662,
        "rules": 0
      },
      "ranks": {
        "word_char": 100,
        "word": 98,
        "rules": 3
      }
    },
    {
      "id": "TT085",
      "label": 0,
      "scores": {
        "word": 0.00849662068969582,
        "word_char": 0.006045410541832177,
        "rules": 0
      },
      "ranks": {
        "word_char": 95,
        "word": 100,
        "rules": 99
      }
    },
    {
      "id": "TT086",
      "label": 0,
      "scores": {
        "word": 0.02755919268346277,
        "word_char": 0.017013385437093475,
        "rules": 0
      },
      "ranks": {
        "word_char": 56,
        "word": 69,
        "rules": 16
      }
    },
    {
      "id": "TT087",
      "label": 0,
      "scores": {
        "word": 0.024434128444016438,
        "word_char": 0.008535983018126152,
        "rules": 0
      },
      "ranks": {
        "word_char": 90,
        "word": 73,
        "rules": 21
      }
    },
    {
      "id": "TT088",
      "label": 0,
      "scores": {
        "word": 0.015037953528350495,
        "word_char": 0.010943384988213479,
        "rules": 0
      },
      "ranks": {
        "word_char": 81,
        "word": 94,
        "rules": 66
      }
    },
    {
      "id": "TT089",
      "label": 0,
      "scores": {
        "word": 0.029325956930563526,
        "word_char": 0.011634148782584333,
        "rules": 0
      },
      "ranks": {
        "word_char": 79,
        "word": 58,
        "rules": 38
      }
    },
    {
      "id": "TT090",
      "label": 0,
      "scores": {
        "word": 0.029325956930563526,
        "word_char": 0.01250319914932931,
        "rules": 0
      },
      "ranks": {
        "word_char": 73,
        "word": 57,
        "rules": 13
      }
    },
    {
      "id": "TT091",
      "label": 0,
      "scores": {
        "word": 0.03220868443833094,
        "word_char": 0.029406389668667144,
        "rules": 0
      },
      "ranks": {
        "word_char": 32,
        "word": 49,
        "rules": 22
      }
    },
    {
      "id": "TT092",
      "label": 0,
      "scores": {
        "word": 0.020363398750765607,
        "word_char": 0.012352236446669045,
        "rules": 0
      },
      "ranks": {
        "word_char": 75,
        "word": 86,
        "rules": 93
      }
    },
    {
      "id": "TT093",
      "label": 0,
      "scores": {
        "word": 0.028798935435444265,
        "word_char": 0.012090046751148597,
        "rules": 0
      },
      "ranks": {
        "word_char": 77,
        "word": 61,
        "rules": 12
      }
    },
    {
      "id": "TT094",
      "label": 0,
      "scores": {
        "word": 0.019878378500256904,
        "word_char": 0.007298646027492569,
        "rules": 0
      },
      "ranks": {
        "word_char": 93,
        "word": 89,
        "rules": 20
      }
    },
    {
      "id": "TT095",
      "label": 0,
      "scores": {
        "word": 0.02351439961860479,
        "word_char": 0.02356908675814303,
        "rules": 0
      },
      "ranks": {
        "word_char": 40,
        "word": 76,
        "rules": 55
      }
    },
    {
      "id": "TT096",
      "label": 0,
      "scores": {
        "word": 0.06090218025110574,
        "word_char": 0.024417425097726136,
        "rules": 0
      },
      "ranks": {
        "word_char": 36,
        "word": 19,
        "rules": 54
      }
    },
    {
      "id": "TT097",
      "label": 0,
      "scores": {
        "word": 0.86840035019018,
        "word_char": 0.9768751582974063,
        "rules": 0
      },
      "ranks": {
        "word_char": 1,
        "word": 2,
        "rules": 75
      }
    },
    {
      "id": "TT098",
      "label": 0,
      "scores": {
        "word": 0.019273477653146978,
        "word_char": 0.010161775871118193,
        "rules": 0
      },
      "ranks": {
        "word_char": 83,
        "word": 90,
        "rules": 23
      }
    },
    {
      "id": "TT099",
      "label": 0,
      "scores": {
        "word": 0.020730300396914012,
        "word_char": 0.024204429762786323,
        "rules": 0
      },
      "ranks": {
        "word_char": 37,
        "word": 83,
        "rules": 1
      }
    },
    {
      "id": "TT100",
      "label": 0,
      "scores": {
        "word": 0.020530071223167558,
        "word_char": 0.019770415262419093,
        "rules": 0
      },
      "ranks": {
        "word_char": 50,
        "word": 84,
        "rules": 28
      }
    }
  ],
  "limitations": [
    "No violation-labelled examples: recall and detection of serious harm cannot be established.",
    "All comments are negative under one reviewer’s scoped policy rubric; this does not establish TikTok-wide accuracy or safety.",
    "The model predicts Civil Comments toxicity; the human labels apply a TikTok-aligned policy subset. Disagreements can reflect both language context and a mismatch between these tasks.",
    "At fixed top-10 capacity, all methods select ten non-violations. This batch cannot establish a ranking winner.",
    "Every keyword-rule score is zero; its top-10 order is entirely the deterministic tie-break.",
    "Single reviewer, some AI-assisted adjudication, limited shopping topics and missing media/thread context constrain generalization."
  ],
  "next_steps": [
    "Inspect contextual false positives using fresh development examples.",
    "Retain the frozen model and cutoff for this report; do not tune against these 100 labels.",
    "Future work: independent second reviewer, broader video/topic sampling and a separate positive-containing evaluation set."
  ]
};if(typeof module!=="undefined")module.exports=data;else root.ReviewPilot=data;})(typeof window!=="undefined"?window:globalThis);
