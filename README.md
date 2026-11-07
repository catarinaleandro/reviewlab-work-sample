# ReviewLab

**Which comments should a moderator review first?**

Catarina Leandro · Independent AI product work sample · November 2026

I gave a test queue two review slots. The model that reads a comment alongside its caption and any parent comment (Model C) put an affectionate joke about a corgi first and a reassuring message second. The only comment I labelled a violation came fifth out of 16. I read it as a statement about physical harm directed at another person. With only the text and caption, the speaker’s tone remained uncertain. The model raised an alert, but a reviewer with two slots would never have reached it.

## Two decisions and what would change them

### Should context change which comments get flagged?

**Decision. Keep the baseline in the demo and test the context model offline.** On ten validation comments, the comment-only challenger (B) flagged four of eight harmless comments. Adding the caption and parent comment (C) reduced that to one. Both caught the two labelled violations.

**What would change my mind.** On a fresh, independently labelled English sample, I would look for at least a 30% relative reduction versus the demo baseline (A) in the share of harmless comments flagged. I would set each model’s cutoff on validation to catch 90% of labelled violations, then check how many each actually catches on the fresh sample. C would also need to outperform B at comparable recall to justify collecting context. I would hold the decision open if serious cases were missed or the uncertainty was too large.

### Should one physical-harm alert move to the front?

**Decision. Keep the original score order.** Giving one existing alert priority moved the known example from fifth to first on replay. In each of two fresh 40-comment batches, both orders selected the same five comments.

**What would change my mind.** Freeze the rule and compare it with C’s original order on the same new queues, with identical scores, cutoffs and review slots. I would adopt it for a pilot only if more independently confirmed serious violations reached reviewers across batches, with no newly displaced critical cases. Count what enters and leaves the queue in every policy category. The rule changes order only, so the number of alerts stays the same.

[Read the public case study](https://reviewlab-content-moderation.vercel.app/work-sample.html) · [Try the review queue](https://reviewlab-content-moderation.vercel.app/#queue) · [Compare the models](https://reviewlab-content-moderation.vercel.app/#models)

## Product stage and my role

**Phase 1 is in offline validation, before an operational pilot.** I defined the review problem, built a working text prototype with AI coding assistance, and acted as the reviewer. I labelled 260 distinct archived TikTok comments across five batches and discussed ambiguous cases against a versioned rubric. Phase 2 would test visual evidence where the available text leaves a question unresolved.

| Model | What it reads and learns | Why it’s here |
|---|---|---|
| **A · Toxicity baseline** | Reads only the comment. Learns from words and word fragments in Civil Comments with human toxicity ratings. | Powers the demo and gives us a reference to beat. |
| **B · Comment only** | Reads only the comment. A pretrained sentence model learned from 26 examples labelled under the project rubric. | Tests how well a model trained on the scoped policy labels can do with just the words the commenter wrote. |
| **C · Comment with context** | Uses the same starting model, 26 training examples and settings as B. It also reads the caption and, for replies, the comment being answered when available. | Comparing C with B tests what surrounding text adds. Both are offline experiments. |

## What I tested

| Experiment | Observation | Product decision |
|---|---|---|
| **Establish a baseline.** Give keyword rules and a word-and-character text model the same 992 slots on 9,916 Civil Comments test examples. | Of 797 toxicity-labelled comments, the rules surfaced 253 and the text model surfaced 528. Recall at that budget rose from 31.7% to 66.2%. | Use the text model as the demo baseline. Evaluate transfer separately because TikTok policy labels answer a different question. |
| **Test whether context helps.** The first 100 TikTok comments all received a no-violation label, yet A flagged five. In the next 40, I used 26 for training, ten for validation and set aside four unresolved decisions. | With cutoffs chosen to catch both validation violations, B (comment only) flagged four of eight harmless comments. C (comment, caption and available parent reply) flagged one. | Take C into blind testing with its cutoff frozen at 0.3933 rounded. Two validation positives gave little evidence about other kinds of harm. |
| **Test a fresh queue.** I labelled 40 new comments before seeing C’s predictions. | C raised six alerts. One was the sole labelled violation and five were false alarms. One additional comment needed context. The violation ranked fifth for two review slots in the wording-selected group. | Investigate ranking and context errors. One positive gives too little evidence to estimate detection reliably. |
| **Challenge the proposed fix.** Give one already-flagged comment priority when its wording describes possible physical harm to a person. Compare both orders at identical capacity. | The rule moved the known example from fifth to first in replay. On two subsequent 40-comment batches, both methods picked the same five comments per batch. In the last batch, a revised human label left one violation, ranked fourth for two slots. | Keep Model A in the demo and retain C’s original order as the offline comparison. The replay motivated a hypothesis. The fresh comparisons have yet to demonstrate an improvement. |

## Limitations

- **Whose judgement is measured.** One reviewer applied a scoped interpretation of TikTok’s public guidelines. Several decisions were discussed with AI assistance. The last batch keeps its original blind labels and a later revision separate. Independent reviewers could reasonably disagree about the fifth-ranked comment.
- **What the samples cover.** Short English comments from public archives, including groups selected for particular wording, cannot establish how often violations occur across TikTok. Civil Comments measures toxicity. TikTok examples measure a policy judgement. The two benchmarks have different denominators and cannot establish platform-wide accuracy.
- **How much evidence we have.** The context-model validation split had just two violations, both about physical harm. Both helped determine the cutoff. The first blind batch contained one labelled violation. On the Civil Comments benchmark, the demo model also flagged 23.3% of non-toxic comments in the identity-term slice, versus 11.2% for rules. This measures wording and gives reviewers a reason to inspect errors involving identity terms.
- **What the prototype can measure.** Captions and some parent comments are available. Video, audio, a full thread and many tone cues are missing. Review capacity is simulated. Reviewer time, appeals, harm reduction and performance across languages still need measurement in a pilot.

## Assumptions behind the design

| Choice | Why I made it | How I would check it |
|---|---|---|
| Start with English comments and a human decision | I could review English comments against an English-language rubric. A reviewer can use the caption and parent reply to distinguish criticism, quotation and targeted abuse, or request more evidence. | Observe reviewers resolving the same cases, record what evidence they open and measure time and agreement. |
| Compare simple rules, A, B and C | Rules are easy to audit. A provides a low-cost reference. B and C use the same small sentence model, training rows and settings, so their comparison tests the value of adding context. | Freeze the models and cutoffs. Check false alerts and missed violations across policy types, language varieties and missing context. |
| Use four reviewer decisions | “Needs context” and “needs policy review” describe different next actions. Forcing either into a yes/no training label would teach the model an unsupported answer. | Have independent reviewers label a fresh sample and resolve disagreements with a policy specialist. Count escalations in workload. |
| Measure capture at a fixed budget | An alert helps only if a reviewer can reach it. I used roughly 10% of a batch as an experimental capacity assumption. Actual capacity depends on review time and severity. | Ask Operations for staffing and handling-time distributions. Compare violations caught per reviewer-hour and time to review serious harm. |
| Lock examples and predictions before revealing test results | Keeping creators, conversations and similar comments together reduces leakage. A rule designed after inspecting a mistake needs fresh evidence. | Compare queues on the same unseen items. Count violations gained and displaced. Inspect harmless comments that move ahead of a violation. |

## How I would apply this at TikTok

I would start with **one English-language comment-review queue** and a narrow question for the Content Ecosystem team. Can a reviewer reach actionable harassment sooner while preserving coverage of other serious harm? Earlier review could benefit the person targeted. An unnecessary flag costs reviewer time, and an incorrect enforcement decision can limit a creator’s reach and take time to appeal. Each has a different measurement.

1. **Validate the workflow.** With Operations, shadow reviewers across shifts and map the path from report to decision. With Policy and Trust & Safety, agree on the scope, escalation reasons and existing urgent routes. The deliverable is a reviewer-tested rubric and a measured capacity baseline.
2. **Set the offline release criteria.** With Data Science, collect a randomly sampled queue plus a separate challenge set. Double-label a subset, adjudicate disagreements and size each severity slice before testing. Set the required serious-harm coverage, minimum worthwhile gain and acceptable uncertainty for each decision before opening the test.
3. **Run in shadow mode.** With Engineering, score the same incoming cases alongside the existing queue. Measure processing latency, cost, missing context and reviewer disagreement. Investigate any newly displaced serious violation. Advance only when Policy and Operations accept the safety and workload results.
4. **Pilot with a small reviewer team.** Compare matched shifts at equal staffing. Track violations caught per reviewer-hour, time to serious cases, reversals after appeal and reviewer overrides. Pause the pilot and restore the previous queue if the agreed serious-harm or creator-impact limits are crossed. Audit a sample below the cutoff for missed violations. If the pilot meets its safety and workload criteria across shifts, expand gradually and keep monitoring outcomes by policy version.
5. **Expand one capability at a time.** For a second language, use local policy experts, native-speaking annotators and a separate market evaluation. For visual review, start with one category and licensed image-caption pairs. A ResNet50 baseline could identify an object such as a knife. A reviewer would still need the surrounding activity to distinguish cooking from a threat. Compare text alone with text plus visual evidence before adding it to the queue.

## Explore the prototype

- Download the one-page application work sample. [PDF summary](https://github.com/catarinaleandro/reviewlab-work-sample/blob/main/Catarina-Leandro-ReviewLab-Work-Sample.pdf)
- Inspect the source, evaluation code and the published review outcomes for all five batches. [Public GitHub repository](https://github.com/catarinaleandro/reviewlab-work-sample) · [TikTok evaluation results](https://github.com/catarinaleandro/reviewlab-work-sample/blob/main/evaluation.json)

- Adjust the review budget and inspect which cases enter the queue. [Review queue](https://reviewlab-content-moderation.vercel.app/#queue)
- Compare the rules and text models at the same capacity. [Experiment lab](https://reviewlab-content-moderation.vercel.app/#experiments)
- Inspect the policy boundaries, reviewer actions and examples. [Policy guide](https://reviewlab-content-moderation.vercel.app/#policy)
- Compare comment-only and contextual inputs on the first development split. [Model choices](https://reviewlab-content-moderation.vercel.app/#models)

Sources include [Civil Comments](https://www.tensorflow.org/datasets/catalog/civil_comments), [TikTok’s Safety and Civility guidelines](https://www.tiktok.com/safety/en/policies-and-engagement/safety-civility), [Crawlora’s TikTok archive](https://huggingface.co/datasets/crawlora-net/tiktok-product-video-comments) and [Shofo’s TikTok archive](https://huggingface.co/datasets/Shofo/shofo-tiktok-general-small). ReviewLab is an independent prototype using public sources.

## Run and reproduce

To follow a score from training through the dashboard and see how the ranking experiment works, start with the [code walkthrough](TECHNICAL.md#follow-a-comment-through-the-code).

Serve the dashboard locally with `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`. Open [the local dashboard](http://127.0.0.1:8765/). Run `npm test` to check the benchmark, policy workflow and model-comparison calculations. The [technical guide](TECHNICAL.md) covers model settings, experiments, data provenance and reproduction commands.
