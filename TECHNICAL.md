# ReviewLab technical guide

[Product case study and roadmap](README.md) · [Public case study](https://reviewlab-content-moderation.vercel.app/work-sample.html)

## Follow a comment through the code

| If you want to understand… | Start here | What to follow |
|---|---|---|
| How the demo scores a comment | [Benchmark training](ml/train.py) → [browser scoring](dist/engine.js) → [review queue](dist/app.js) | Training exports the vocabulary, word weights and coefficients. In the browser, `createEngine` applies them to text, `rank` sorts the scores and `summarize` counts outcomes within the selected budget. |
| What changes between B and C | [Context training](ml/context_train.py) | `validate_rows` checks the groups and labels. `serialize` builds the two inputs. `threshold_for_recall` chooses a cutoff from validation scores. The trainer is preserved byte-for-byte because the blind-test protocol records its fingerprint. |
| How a flag becomes a human decision | [Policy rules](dist/policy.js) → [review queue](dist/app.js) | `validateDecision` checks the reviewer's reason and evidence. `buildDecision` preserves earlier decisions. The model score and benchmark reference label stay separate. |
| How the one-slot comparison works | [Offline queue rule](ml/queue_order.py) | Give `order` already-scored rows with unique `id`, `text` and `score`, plus the frozen cutoff. It returns the original order, candidate order and eligible comment ID (or `None`). Take the first K rows from each for the same K. |
| Which results the dashboard displays | [Original plan](ml/context-experiment.json) → [development results](dist/context-results.js) → [model comparison](dist/model-choices.js) | The plan records what was known before training. The results contain measured development counts. Later blind-test outcomes and the provisional success criteria appear in the [case study](README.md). |
| How to verify the export | [Build checks](ml/verify.cjs) and [context checks](ml/verify-context.py) | Run `node ml/verify.cjs` and `python3 ml/verify-context.py` from the repository root. The first checks scoring parity, capacity metrics, policy workflow and published aggregates. The second checks the B/C input and evaluation contract. |

The ranking rule runs offline. Eligible alerts must match a narrow English wording pattern and already meet C’s cutoff. Only the highest-scoring eligible alert can move. All other comments keep their relative order. An eligible item already ranked first produces the same queue. A comment below the cutoff keeps its original place.

## Run the prototype

No build tools, API keys, inference service, or installation are needed to preview the exported model.

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8765/. Keep the server running while using the local preview. Do not open index.html directly: the app loads local JSON assets through HTTP.

To edit the public case study, update the root README. Run `npm ci` and then `npm run case-study` to regenerate `dist/work-sample.html` with the [page renderer](render-case.mjs). Commit the README and generated page together. The public deployment serves the checked-in page.

Eight workspaces:

1. **Review queue** — real benchmark comments, model selection, capacity controls, reference-label toggle, error filters, and human decisions.
2. **Experiment lab** — frozen comparison, uncertainty interval, category and contextual diagnostics, and offline/pilot decision.
3. **Import & score** — local CSV scoring or single-comment prediction. Imported comments are not sent to an inference service.
4. **Error review** — six real mistakes, feature evidence, historical v2 proposals (not current policy labels).
5. **Policy guide** — source-linked TikTok text rules, examples, decision boundaries and versioned review controls.
6. **TikTok results** — human-labelled calibration, frozen-cutoff flags, top-10 review workload and contextual false positives.
7. **Methodology** — product brief, annotation rubric, model/data card, limitations, and the two-phase roadmap.
8. **Model choices** — A/B/C inputs, the first policy-trained comparison, earlier-pilot false flags and the frozen training plan.

## First TikTok context-model experiment

The current model overflags some literal or enthusiastic wording. This experiment makes the next choices explicit:

| Arm | Model | Input | Purpose |
|---|---|---|---|
| A | Frozen word + character TF-IDF/logistic regression | Comment | Current Civil Comments toxicity reference |
| B | SetFit + `BAAI/bge-small-en-v1.5` + logistic-regression head | Comment | Learn the scoped policy labels with a sentence encoder |
| C | The same checkpoint, training cohort and settings as B | Comment, caption, direct parent reply | Test whether context adds value; recommended experiment |

The 7 November 2026 experiment trained B and C on the same 26 comments (18 harmless, eight violations) and reserved ten for developer validation (eight harmless, two violations). Creator, video and similar-text groups stayed in one split. Four additional comments received context or policy-review labels and were excluded from binary fitting.

| Model | Violations caught on validation | False flags on validation | First review slot | False flags on earlier 100 harmless comments |
|---|---:|---:|---|---:|
| A | 2/2 | 4/8 | Harmless | 5 |
| B | 2/2 | 4/8 | Violation | 19 |
| C | 2/2 | 1/8 | Violation | 4 |

These results use cutoffs selected on those same ten validation rows to reach the planned 90% recall target. With only two violations, the cutoff had to include both. The earlier 100 comments were used for regression checks only. C cleared the five previous false positives and introduced four different false positives. Both validation positives concerned physical harm. A remains the demo baseline. Subsequent blinded queue comparisons are summarized in the product case study. The dashboard serves aggregate metrics from `dist/context-results.js`. Candidate weights and raw annotation records stay local.

`ml/context-experiment.json` is the owning configuration. B and C use the pinned BGE revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`, SetFit 1.1.3, seed 42, batch size 8, one epoch, ten pair-generation iterations and a logistic-regression head with C=1. The encoder supports English and a 512-token input. Complete comments are preserved; context is shortened first, and overly long comments are rejected for manual handling. The classifier produces a binary review score, not validated category detection or generated evidence.

The software was exercised end to end on an unrelated invented gardening-versus-music fixture. Both arms trained and returned finite predictions. That check verifies the pipeline only. Its weights and scores are not moderation candidates and are not deployed. Twelve contract tests cover label provenance, cross-split leakage, context truncation and metrics. The original 100-comment pilot consisted entirely of No violation labels. The subsequent 40-comment development batch supplied mixed policy labels.

```sh
python3 -m venv .venv-context
.venv-context/bin/pip install -r ml/context-requirements.txt
.venv-context/bin/python ml/context_download.py --output context-base --cache context-cache
python3 ml/verify-context.py
# Software execution check only; use a new output directory for each run.
.venv-context/bin/python ml/context_train.py --base context-base --cache context-cache --output context-runs/smoke-01 --smoke
# Train on human-confirmed policy labels:
.venv-context/bin/python ml/context_train.py --data labelled-development.json --base context-base --cache context-cache --output context-runs/policy-01
```

The training input is an object containing a `rows` array. Each row needs `id`, `comment`, nullable `caption` and `parent`, `group_id`, `family_id`, `split`, `human_decision`, `reviewer`, `label_status`, `policy_version` and `source_kind`. Labels must be `human_confirmed` under the current policy. `train` and `validation` accept real examples only; constructed examples belong to `regression`. Unresolved decisions are excluded from binary fitting. The minimum class counts are software checks, not sample-size adequacy claims. Family IDs must come from an upstream near-duplicate audit; this validator checks their split consistency but does not discover fuzzy duplicates.

Keep locked test data in a separate file: the training command rejects test rows. It fits both arms, saves independent weights, selects each threshold on validation at the provisional 90% recall target and records validation results. It does not score locked test data, declare a winner, generate final confidence intervals or deploy a model. The first development comparison is complete. The subsequent blind and paired ranking tests are documented in the product case study. Larger samples with enough serious violations remain necessary for a rollout decision. Evaluate false-positive reduction and achieved recall on fresh data, plus a separate capacity comparison on a natural-prevalence sample. The proposed 30% false-positive reduction is a target, not an observed improvement or deployment guarantee.

The public page is generated from the same configuration and checked for consistency during the existing build. The Vercel dashboard remains a static app; candidate training runs offline and requires no public inference endpoint or API key.

## Measured result

The final sampled test contains 9,916 comments, including 797 comments with toxicity annotation fraction ≥ 0.5. At a review budget of 992 comments:

| Method | Toxic captured | Recall | Precision | False positives | Missed toxic |
|---|---:|---:|---:|---:|---:|
| Keyword rules | 253 | 31.7% | 25.5% | 739 | 544 |
| Word TF-IDF + logistic regression | 497 | 62.4% | 50.1% | 495 | 300 |
| Word + character TF-IDF + logistic regression | 528 | 66.2% | 53.2% | 464 | 269 |

The combined model was selected on validation recall at 10% capacity before test predictions were calculated. It captured 275 more toxic-labelled comments than keyword rules at the same review volume, a relative increase of 108.7%. The paired row-bootstrap 95% interval for recall improvement is +30.8 to +38.4 percentage points. This interval does not account for unavailable thread clusters.

**Product decision: continue offline validation; hold live routing.** The overall capture target passed, but the reference-negative identity-term slice had a 23.3% false-positive rate versus 11.2% for rules. This is a lexical diagnostic, not a demographic identity measurement or fairness certification. The sample contains only 22 threat positives, of which the selected queue captures 10; severe-toxicity performance cannot be assessed because there are no positives at the chosen label cutoff.

## Reproduce the benchmark

The measured environment used Python 3.14.6. Install dependencies in an isolated environment. Download requires network access and about 422 MB of public data.

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python ml/download.py
python ml/train.py
node ml/verify.cjs
```

The downloader stores data in `../data`, outside the website directory. Training honours `REVIEWLAB_DATA` as an optional replacement data directory. The included source record identifies the exact Hugging Face revision and SHA-256 file hashes. The downloader uses that pinned revision when this record exists.

Uniform sampling uses seed 42 for training, 43 for validation, and 44 for test. Samples were initially 60,000 / 8,000 / 10,000; empty and normalised duplicate removal left 59,690 / 7,944 / 9,916. No class balancing was applied. The chosen mirror does not provide thread/video IDs; full fuzzy near-duplicate and group leakage checks remain incomplete.

`ml/protocol.json` fixes feature settings, candidates, selection, capacities, and uncertainty procedure. `ml/rules.json` contains the frozen keyword baseline. Word and character TF-IDF branches each have at most 30,000 features. Each branch uses sublinear term frequency and its own L2 normalisation. Logistic regression uses C=2 with no class weighting.

Exports:

- `dist/data/model.json`: vocabularies, IDFs, coefficients, intercepts, and keyword rules for real browser inference.
- `dist/data/benchmark.json`: test comments, reference labels, and frozen model scores.
- `dist/data/report.json`: complete metrics, source provenance, sample audit, and limitations.
- The benchmark training command can generate a Python model bundle locally. The public release serves the scoring weights as JSON in `dist/data/model.json`.
- `ml/verification.json`: model parity and metric checks.

## CSV import and reviewer feedback

Required column: `text`, `comment`, or `comment_text`. Optional: `label` (0/1), `toxicity` (0–1), and `caption` (display-only context). A nonempty toxicity fraction maps to label 1 at ≥0.5. Conflicting supplied labels are rejected. Limits: 5,000 rows, 5 MB, 20,000 characters per comment.

The queue evaluates imported data only when all rows have labels. It never treats predictions as truth. Use independently annotated labels. CSV comments stay in page memory and disappear on reload. Review decisions and notes persist only in local browser storage, keyed by comment IDs. Export them through the top-right button. No shared multi-user database is implemented. Reference labels never change when a reviewer records a decision.

## Product validation status

Three additional batches tested frozen model C or the one-slot queue rule. The README records the observed outcomes, annotation revision and proposed release criteria. Reviewer research, independent adjudication, multilingual evaluation and an operational pilot remain future stages. [Product decision and roadmap](README.md)

## Phase 2 plan and acceptance gate

1. Select one visual policy category with an appropriate licensed/permissioned labelled dataset.
2. Use genuine image-caption pairs. Treat this as a post-level decision, separate from the Phase 1 comment-level task.
3. Use pretrained ResNet50 as an image-classification/feature baseline. Its ImageNet scores are not harm probabilities, and it does not locate every object. A knife in a cooking image is an example of why tags alone do not establish a violation.
4. Record image evidence, extracted text if OCR is added, model versions, and associated captions. Keep them distinct from policy-risk estimates and human decisions.
5. Train or validate a policy-specific scoring layer using labelled paired data, selecting any signal-combination weights on validation only.
6. Compare text-only, image-only, and combined systems on the same held-out pairs at fixed review capacity. Measure recall, precision, contextual false positives, latency, cost, and missing-image behaviour.
7. Add visual evidence to the review workspace only if the combined system provides useful measured improvement. Begin with shadow-mode evaluation; full video understanding additionally requires temporal/audio work.

## Sources

- Civil Comments: https://huggingface.co/datasets/google/civil_comments
- Annotation and dataset documentation: https://www.tensorflow.org/datasets/catalog/civil_comments
- Threshold selection: https://scikit-learn.org/stable/modules/classification_threshold.html
- ResNet50: https://docs.pytorch.org/vision/main/models/generated/torchvision.models.resnet50.html

Civil Comments is released under CC0-1.0. The dataset contains offensive material. This prototype is independently developed, is not affiliated with TikTok, and does not claim TikTok performance.

## TikTok-aligned rubric v3

Guideline release: 25 August 2026. Effective: 24 September 2026. Verified directly on TikTok’s English (US) pages on 6 November 2026. This is a selected text-policy mapping, not a complete copy of TikTok policy or an official enforcement system.

The guide covers violence/harmful crime, hate, harassment, sexual harassment, privacy/doxing and self-harm promotion. It offers four actions: No violation in scope, Flag violation, Needs context, and Policy / specialist review. Lower-severity hostility is not automatically a removal violation; FYF restrictions, public-interest exceptions and adult public-figure context require a separate assessment. An urgent priority is a local record only and does not notify a safety service.

`dist/policy.js` is the shared source for the guide, reviewer reason codes, validation and policy metadata. `dist/policy-view.js` renders the dashboard and [printable guide](dist/rubric.html). The examples are synthetic teaching examples. Raw TikTok sample comments are not republished. TT056 and TT083 summaries retain the product owner’s No violation decisions after AI-assisted discussion, not independent blind annotations.

Each new decision records policy version, source URL, effective date, target context and priority. Flags and escalations require evidence notes, and reason/action mismatches are rejected. Editing a decision preserves earlier records; the CSV export distinguishes current and superseded rows. Old browser records are not silently relabelled.

The six-case error audit in `dist/data/error-review.json` remains a historical v2 analysis. Its original proposed decisions must be explicitly re-reviewed under v3 before use as policy evaluation labels. The learned weights, Civil Comments labels, benchmark metrics and original audit are unchanged. The model estimates general toxicity; this update does not train or validate any new category detector.

Official policy sources:
- https://www.tiktok.com/safety/en/policies-and-engagement/safety-civility
- https://www.tiktok.com/safety/en/policies-and-engagement/privacy-security
- https://www.tiktok.com/safety/en/policies-and-engagement/mental-behavioral-health
- https://www.tiktok.com/safety/en/policies-and-engagement/enforcement

`node ml/verify.cjs` checks model parity, metrics and policy decision/history invariants. Repeat a policy-source review when TikTok changes its guidelines; the version and verification date are deliberately explicit.

## GitHub and Vercel

This public portfolio edition contains the dashboard, training and evaluation code, frozen browser weights, public benchmark, anonymised evaluation rows, and application PDF. The live dashboard is built from the development repository. Its verification command is the build step and `dist` is the static output directory. The trained context checkpoints and underlying TikTok research records are stored separately. The [evaluation file](evaluation.json) includes project-local IDs, label versions and scores that were available per experiment. Original archived TikTok comments, platform identifiers, reviewer notes and account settings are outside this edition.

## TikTok human-label comparison (v1.3)

The first calibration batch has 100 final No violation decisions by Catarina under rubric v3, with zero unresolved cases. The model predicts Civil Comments toxicity, while these human labels apply a TikTok-aligned policy subset. This is a single-reviewer, shopping/lifestyle sample across 24 videos and 12 source topics. Five cases involved AI-assisted contextual discussion. It is not a representative or independent gold test.

The frozen Civil Comments validation cutoff (score >= 0.15794454885986295) flags five comments: TT097, TT002, TT036, TT066 and TT063. Against the human labels: FP=5, TN=95, TP=0, FN=0, precision=0/5 and false-positive rate=5/100. Recall is undefined because there are no positive labels. This is not evidence of perfect harm detection or a model winner.

At fixed top-10 capacity, each ranked approach selects ten non-violations. Every keyword-rule score is zero, so its top-10 ranking is only the deterministic tie-break. An any-rule-match diagnostic flags zero but uses a different review workload.

The TikTok results page distinguishes the two operating modes. Public cases are paraphrases and feature evidence; source comments, captions and identifiers remain in private review files. `dist/pilot-data.js` holds aggregate results and anonymous sample-level scores/labels. The original benchmark, model, policy data and AI audit are unchanged.

Recompute from the local review inputs (not bundled or published):

```sh
node ml/evaluate-pilot.cjs /path/to/scored.json /path/to/human-decisions.json /path/to/private-outputs
node ml/verify.cjs
```

The evaluator checks human-label completeness and policy consistency, recomputes all 100 scores, checks saved prediction parity, and records input hashes. `ml/verify-pilot.cjs` independently checks the released metrics, rankings, cutoff, missing-denominator behavior and absence of private source fields. No training or cutoff tuning happens during this comparison.

This section describes the original all-negative calibration batch. Later mixed-label samples are documented in the product case study.
