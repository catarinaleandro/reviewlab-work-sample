/* Model choices, not challenger performance results. */
(function(root){const data={
  "version": "context-v2.1",
  "status": "Implementation prepared; policy training awaits confirmed mixed labels",
  "policy_version": "review-rubric-v3-tiktok-2026-09-24",
  "recommended_candidate": "C",
  "production_candidate": "A",
  "selected_winner": null,
  "base_model": {
    "id": "BAAI/bge-small-en-v1.5",
    "revision": "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a",
    "url": "https://huggingface.co/BAAI/bge-small-en-v1.5",
    "license": "MIT",
    "language": "English",
    "max_tokens": 512,
    "description": "A compact pretrained sentence encoder. It is not a ready-made moderation model."
  },
  "training": {
    "framework": "SetFit 1.1.3",
    "seed": 42,
    "batch_size": 8,
    "num_epochs": 1,
    "num_iterations": 10,
    "body_learning_rate": 2e-05,
    "head": "Logistic regression; C=1; max_iter=1000; class_weight=null",
    "target": "Human-confirmed No violation (0) versus Violation (1), under the scoped rubric",
    "unresolved": "Escalate and Policy review are excluded from binary training and retained for a separate routing evaluation.",
    "rationale": "Start with one controlled configuration. B and C share the same checkpoint, examples, splits and training settings; only their inputs differ."
  },
  "arms": [
    {
      "id": "A",
      "name": "Current baseline",
      "model": "Word + character TF-IDF + logistic regression",
      "input": "Comment only",
      "learns": "Associations between text fragments and Civil Comments toxicity",
      "role": "Reference: measures how the current system behaves",
      "status": "Live reference",
      "tradeoff": "Fast, transparent and browser-based; limited sentence and conversation understanding",
      "evidence": "5 cutoff false positives among the 100 human-labelled non-violations; violation recall unavailable"
    },
    {
      "id": "B",
      "name": "Sentence model",
      "model": "SetFit + BGE-small-en-v1.5 + logistic-regression head",
      "input": "Comment only",
      "learns": "Sentence patterns associated with our confirmed policy labels",
      "role": "Simpler challenger: tests the new representation and policy training",
      "status": "Awaiting confirmed mixed labels",
      "tradeoff": "Can learn phrase meaning; cannot resolve information that appears only in the parent reply or caption",
      "evidence": "No policy-trained performance result yet"
    },
    {
      "id": "C",
      "name": "Context model",
      "model": "Same SetFit + BGE-small-en-v1.5 setup as B",
      "input": "Comment + caption + direct parent reply, explicitly separated",
      "learns": "How the comment's interpretation changes with surrounding text",
      "role": "Recommended candidate to test; not a declared winner",
      "status": "Awaiting confirmed mixed labels",
      "tradeoff": "May resolve literal meaning and implicit endorsement; irrelevant, missing or misleading context can also cause errors",
      "evidence": "No policy-trained performance result yet"
    }
  ],
  "comparison_logic": [
    "A versus B tests the full change in representation and training labels together; it does not isolate architecture alone.",
    "B versus C isolates the value of context because examples, architecture and training settings are held fixed.",
    "Prefer C only if fresh evaluation supports it. If B meets the evidence requirements and C adds no reliable benefit, prefer B for simplicity. If neither passes, retain A as the reference without claiming safety."
  ],
  "input_rules": [
    "Use only the actual comment, archived caption and direct parent reply. Never invent a missing reply or infer a video transcript.",
    "Preserve the whole comment. Limit total input to 512 tokens; shorten context first and record truncation. An oversized comment is referred for manual handling.",
    "Keep speaker roles explicit. A harmless caption never becomes a blanket exemption for an explicit threat.",
    "Do not train with toxicity annotations, scores, ranks, adjudication notes or reviewer decisions as input features."
  ],
  "data_readiness": {
    "confirmed_pilot_no_violation": 100,
    "confirmed_pilot_violation": 0,
    "pilot_role": "Disclosed regression/development set; never a fresh test after inspecting its mistakes",
    "constructed_examples": 20,
    "constructed_role": "Assistant-authored diagnostic exercises with unconfirmed proposed labels; not real TikTok evaluation",
    "training_ready": false,
    "next_input": "Fresh rubric-labelled examples of violations and non-violations with available context, plus ambiguous cases for routing evaluation"
  },
  "evaluation": {
    "target_recall": 0.9,
    "target_recall_note": "Provisional experimental operating point, not a guarantee or a production safety standard",
    "false_positive_reduction_goal": 0.3,
    "primary": "Compare false-positive rates at validation-selected thresholds targeting 90% violation recall. Report the achieved recall on fresh test data; do not call a comparison matched-recall if test recalls materially differ.",
    "capacity": "Separately compare recall and precision at 10% review capacity on a natural-prevalence sample. Count escalation and urgent review in total workload.",
    "gates": [
      "Aim for at least 30% relative false-positive reduction on fresh in-domain data, not on the five pilot errors.",
      "Require no observed loss in clear-violation recall and no new misses on human-confirmed critical regression cases; include category counts and paired uncertainty.",
      "Too few violations, unstable intervals or insufficient serious-harm coverage means inconclusive. A strong aggregate result cannot hide a failed severe-harm slice.",
      "Set category-specific deployment requirements before any live moderation use. This experiment proposes a prototype comparison, not automated enforcement."
    ],
    "split": "Group by video/conversation and near-duplicate family before assigning train, validation or locked test. A candidate is frozen before opening its test results.",
    "sampling": "Keep natural-prevalence evaluation separate from an enriched challenge set. A balanced challenge set cannot estimate production precision or workload."
  },
  "workflow": {
    "model_output": "A review score for clear violations; not a calibrated probability or a policy decision",
    "human_actions": [
      "No violation",
      "Violation",
      "Escalate",
      "Policy review"
    ],
    "limits": "This binary classifier does not yet generate validated policy categories, evidence spans or urgent routing. Those remain reviewer fields; uncertainty routing needs separate validation.",
    "deployment": "Train and compare offline first. Publish verified comparison results to Vercel; do not load an unvalidated challenger into the live review queue."
  },
  "sources": [
    {
      "title": "BGE-small model card",
      "url": "https://huggingface.co/BAAI/bge-small-en-v1.5"
    },
    {
      "title": "SetFit training guide",
      "url": "https://huggingface.co/docs/setfit/v1.1.3/en/quickstart"
    },
    {
      "title": "Context in toxicity detection",
      "url": "https://aclanthology.org/2020.acl-main.396/"
    },
    {
      "title": "HateCheck functional testing",
      "url": "https://aclanthology.org/2021.acl-long.4/"
    }
  ],
  "implementation_checks": {
    "data_contract_tests": 12,
    "B_training_and_prediction_smoke_passed": true,
    "C_training_and_prediction_smoke_passed": true,
    "fixture": "Invented gardening versus music topic task; no moderation-performance claim",
    "policy_model_trained": false
  }
};if(typeof module!=="undefined")module.exports=data;else root.ReviewModelPlan=data;})(typeof window!=="undefined"?window:globalThis);
