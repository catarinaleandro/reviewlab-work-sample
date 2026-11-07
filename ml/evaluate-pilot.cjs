'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict');
const { createEngine } = require('../dist/engine.js');
const root = path.resolve(__dirname, '..'),
  hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
function summarize(rows, selected) {
  const ids = new Set(selected.map((r) => r.id));
  const positives = rows.filter((r) => r.label === 1).length,
    negatives = rows.length - positives;
  const tp = rows.filter((r) => r.label === 1 && ids.has(r.id)).length,
    fp = selected.length - tp;
  const fn = positives - tp,
    tn = negatives - fp;
  return {
    n: rows.length,
    positives,
    negatives,
    flagged: selected.length,
    tp,
    fp,
    fn,
    tn,
    review_rate: selected.length / rows.length,
    precision: selected.length ? tp / selected.length : null,
    recall: positives ? tp / positives : null,
    false_positive_rate: negatives ? fp / negatives : null,
    selected_ids: selected.map((r) => r.id),
  };
}
function rank(rows, key) {
  return [...rows].sort(
    (a, b) => b.scores[key] - a.scores[key] || a.dashboard_id.localeCompare(b.dashboard_id),
  );
}
function evaluate(sample, decisions, bundle, report) {
  assert.equal(new Set(sample.map((r) => r.id)).size, sample.length, 'Duplicate sample ID');
  assert.equal(
    new Set(decisions.map((r) => r.id)).size,
    decisions.length,
    'Duplicate human decision',
  );
  assert.equal(sample.length, decisions.length, 'Sample/decision count mismatch');
  const labels = new Map(decisions.map((d) => [d.id, d]));
  const engine = createEngine(bundle);
  const rows = sample.map((r, i) => {
    const d = labels.get(r.id);
    assert.ok(d, `Missing human label: ${r.id}`);
    assert.ok(
      ['No violation', 'Violation'].includes(d.human_decision),
      `Unresolved label: ${r.id}`,
    );
    assert.equal(d.human_decision, d.adjudicated_decision, `Unresolved adjudication: ${r.id}`);
    const scores = engine.score(r.text.trim());
    for (const key of ['word_char', 'word', 'rules'])
      if (r.scores)
        assert.ok(Math.abs(scores[key] - r.scores[key]) < 1e-12, `Frozen score mismatch: ${r.id}`);
    return {
      id: r.id,
      label: Number(d.human_decision === 'Violation'),
      scores,
      dashboard_id: hash('import:' + i + ':' + r.text.trim()),
      policy_version: d.policy_version,
    };
  });
  assert.equal(new Set(rows.map((r) => r.policy_version)).size, 1, 'Mixed policy versions');
  const threshold = report.selection.threshold,
    k = Math.ceil(rows.length * 0.1),
    methods = {};
  for (const key of ['word_char', 'word', 'rules'])
    methods[key] = summarize(rows, rank(rows, key).slice(0, k));
  return {
    rows,
    threshold,
    top10: methods,
    threshold_result: summarize(
      rows,
      rank(rows, 'word_char').filter((r) => r.scores.word_char >= threshold),
    ),
    rule_match_result: summarize(
      rows,
      rank(rows, 'rules').filter((r) => r.scores.rules > 0),
    ),
  };
}
module.exports = { summarize, rank, evaluate };
if (require.main === module) {
  const [samplePath, labelsPath, privateDir] = process.argv.slice(2);
  assert.ok(
    samplePath && labelsPath && privateDir,
    'Usage: node ml/evaluate-pilot.cjs SCORED_SAMPLE HUMAN_DECISIONS PRIVATE_OUTPUT_DIR',
  );
  const sampleBytes = fs.readFileSync(samplePath),
    labelBytes = fs.readFileSync(labelsPath),
    modelBytes = fs.readFileSync(path.join(root, 'dist/data/model.json'));
  const sample = JSON.parse(sampleBytes),
    decisions = JSON.parse(labelBytes),
    bundle = JSON.parse(modelBytes),
    report = JSON.parse(fs.readFileSync(path.join(root, 'dist/data/report.json')));
  const e = evaluate(sample, decisions, bundle, report);
  const notes = JSON.parse(fs.readFileSync(path.join(__dirname, 'pilot-case-notes.json')));
  const sampleMap = new Map(sample.map((r) => [r.id, r]));
  const engine = createEngine(bundle);
  const cases = e.top10.word_char.selected_ids.map((id, i) => {
    const row = sampleMap.get(id),
      note = notes[id];
    assert.ok(note, id + ' needs a public case summary');
    return {
      id,
      rank: i + 1,
      score: row.scores.word_char,
      human_decision: 'No violation',
      above_frozen_cutoff: row.scores.word_char >= e.threshold,
      ...note,
      positive_word_features: engine
        .scoreModel(row.text.trim(), 'word_char', true)
        .evidence.slice(0, 3),
    };
  });
  const payload = {
    version: 'tiktok-human-review-v1',
    evaluated_on: '2026-11-06',
    sample_id: 'reviewlab-tiktok-pilot-v1-2026-11-06',
    model_id: bundle.version,
    policy_version: e.rows[0].policy_version,
    label_counts: {
      reviewed: decisions.length,
      no_violation: e.rows.filter((r) => !r.label).length,
      violation: e.rows.filter((r) => r.label).length,
      unresolved: 0,
    },
    provenance: {
      source_title: 'Crawlora: TikTok Product Video Comments 2026',
      source_url: 'https://huggingface.co/datasets/crawlora-net/tiktok-product-video-comments',
      source_revision: 'e2ba71105668f398ad93e6e5b5fa9a973068657b',
      videos: 24,
      source_topics: 12,
      collection_period: '10–13 September 2026',
      reviewer: 'Catarina Leandro',
      review_method:
        'Single-reviewer calibration. Batch display hid predictions. Five decisions involved AI-assisted contextual discussion; original decisions remain in the private history.',
      assisted_discussion_ids: ['TT003', 'TT008', 'TT056', 'TT083', 'TT085'],
      model_input:
        'Comment text only. Captions informed human review; video/audio were not reviewed.',
      sampling:
        'Shopping/lifestyle archive, balanced across source topics; not representative of all TikTok.',
      publication:
        'Case summaries are paraphrases. Public records contain sample IDs, scores and labels, not original comments or personal/source identifiers.',
    },
    input_hashes: {
      scored_sample: hash(sampleBytes),
      human_decisions: hash(labelBytes),
      model: hash(modelBytes),
    },
    fixed_threshold: {
      value: e.threshold,
      operator: '>=',
      origin: 'Frozen Civil Comments validation cutoff, selected before this TikTok sample',
      ...e.threshold_result,
    },
    fixed_capacity: {
      fraction: 0.1,
      k: Math.ceil(e.rows.length * 0.1),
      tie_break: 'Descending score, then dashboard SHA-256 import ID ascending',
      methods: e.top10,
    },
    any_keyword_match: {
      definition: 'Rule score > 0; a diagnostic, not a capacity-matched classifier comparison',
      ...e.rule_match_result,
    },
    cases,
    records: e.rows.map((r) => ({
      id: r.id,
      label: r.label,
      scores: r.scores,
      ranks: Object.fromEntries(
        ['word_char', 'word', 'rules'].map((key) => [
          key,
          rank(e.rows, key).findIndex((x) => x.id === r.id) + 1,
        ]),
      ),
    })),
    limitations: [
      'No violation-labelled examples: recall and detection of serious harm cannot be established.',
      'All comments are negative under one reviewer’s scoped policy rubric; this does not establish TikTok-wide accuracy or safety.',
      'The model predicts Civil Comments toxicity; the human labels apply a TikTok-aligned policy subset. Disagreements can reflect both language context and a mismatch between these tasks.',
      'At fixed top-10 capacity, all methods select ten non-violations. This batch cannot establish a ranking winner.',
      'Every keyword-rule score is zero; its top-10 order is entirely the deterministic tie-break.',
      'Single reviewer, some AI-assisted adjudication, limited shopping topics and missing media/thread context constrain generalization.',
    ],
    next_steps: [
      'Inspect contextual false positives using fresh development examples.',
      'Retain the frozen model and cutoff for this report; do not tune against these 100 labels.',
      'Future work: independent second reviewer, broader video/topic sampling and a separate positive-containing evaluation set.',
    ],
  };
  assert.equal(payload.label_counts.no_violation, 100);
  assert.equal(payload.fixed_threshold.fp, 5);
  assert.equal(payload.fixed_capacity.methods.word_char.fp, 10);
  fs.writeFileSync(
    path.join(root, 'dist/pilot-data.js'),
    '/* Aggregate evaluation and paraphrased cases; original comments remain private. */\n(function(root){const data=' +
      JSON.stringify(payload, null, 2) +
      ';if(typeof module!=="undefined")module.exports=data;else root.ReviewPilot=data;})(typeof window!=="undefined"?window:globalThis);\n',
  );
  fs.mkdirSync(privateDir, { recursive: true });
  const detailed = {
    ...payload,
    cases: cases.map((c) => ({
      ...c,
      text: sampleMap.get(c.id).text,
      caption: sampleMap.get(c.id).caption,
    })),
    records: payload.records.map((r) => ({ ...r, text: sampleMap.get(r.id).text })),
  };
  fs.writeFileSync(
    path.join(privateDir, 'TikTok-100-Human-Evaluation.json'),
    JSON.stringify(detailed, null, 2) + '\n',
  );
  const fields = [
    'id',
    'model_score',
    'frozen_cutoff',
    'flagged_at_cutoff',
    'top10_rank',
    'human_decision',
    'text',
    'caption',
  ];
  const cell = (v) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const csv = [
    fields,
    ...cases.map((c) => [
      c.id,
      c.score,
      e.threshold,
      c.above_frozen_cutoff,
      c.rank,
      c.human_decision,
      sampleMap.get(c.id).text,
      sampleMap.get(c.id).caption,
    ]),
  ]
    .map((r) => r.map(cell).join(','))
    .join('\n');
  fs.writeFileSync(path.join(privateDir, 'TikTok-100-False-Positives.csv'), csv + '\n');
  console.log(
    JSON.stringify({
      threshold: payload.fixed_threshold,
      top10: payload.fixed_capacity.methods.word_char,
      keyword_matches: payload.any_keyword_match.flagged,
      private_case_export: 10,
    }),
  );
}
