'use strict';
const assert = require('node:assert/strict'),
  p = require('../dist/pilot-data.js'),
  policy = require('../dist/policy.js'),
  { summarize, evaluate } = require('./evaluate-pilot.cjs');
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/report.json'))),
  modelBytes = fs.readFileSync(path.join(__dirname, '../dist/data/model.json')),
  bundle = JSON.parse(modelBytes);
assert.equal(p.input_hashes.model, crypto.createHash('sha256').update(modelBytes).digest('hex'));
assert.equal(p.fixed_threshold.value, report.selection.threshold);
assert.equal(p.policy_version, policy.data.version);
assert.equal(p.records.length, 100);
assert.equal(new Set(p.records.map((r) => r.id)).size, 100);
assert.ok(p.records.every((r) => r.label === 0));
assert.equal(p.label_counts.no_violation, 100);
for (const key of ['word_char', 'word', 'rules']) {
  const ordered = [...p.records].sort((a, b) => a.ranks[key] - b.ranks[key]);
  assert.deepEqual(
    ordered.map((r) => r.ranks[key]),
    Array.from({ length: 100 }, (_, i) => i + 1),
  );
  for (let i = 1; i < 100; i++) assert.ok(ordered[i - 1].scores[key] >= ordered[i].scores[key]);
  assert.deepEqual(summarize(p.records, ordered.slice(0, 10)), p.fixed_capacity.methods[key]);
}
const selected = [...p.records]
  .sort((a, b) => a.ranks.word_char - b.ranks.word_char)
  .filter((r) => r.scores.word_char >= p.fixed_threshold.value);
assert.deepEqual(
  selected.map((r) => r.id),
  ['TT097', 'TT002', 'TT036', 'TT066', 'TT063'],
);
for (const [key, value] of Object.entries(summarize(p.records, selected)))
  assert.deepEqual(p.fixed_threshold[key], value);
assert.equal(p.fixed_threshold.fp, 5);
assert.equal(p.fixed_threshold.tn, 95);
assert.equal(p.fixed_threshold.precision, 0);
assert.equal(p.fixed_threshold.recall, null);
assert.equal(p.any_keyword_match.flagged, 0);
assert.equal(p.any_keyword_match.precision, null);
for (const c of p.cases) {
  const r = p.records.find((r) => r.id === c.id);
  assert.equal(c.score, r.scores.word_char);
  assert.equal(c.rank, r.ranks.word_char);
  assert.equal(c.above_frozen_cutoff, c.score >= p.fixed_threshold.value);
}
// Validate positive denominators and empty-queue handling, not just this all-negative sample.
const fixture = [
  { id: 'a', label: 1 },
  { id: 'b', label: 0 },
  { id: 'c', label: 1 },
  { id: 'd', label: 0 },
];
assert.deepEqual(summarize(fixture, fixture.slice(0, 2)), {
  n: 4,
  positives: 2,
  negatives: 2,
  flagged: 2,
  tp: 1,
  fp: 1,
  fn: 1,
  tn: 1,
  review_rate: 0.5,
  precision: 0.5,
  recall: 0.5,
  false_positive_rate: 0.5,
  selected_ids: ['a', 'b'],
});
assert.equal(summarize(fixture, []).precision, null);
assert.equal(summarize(fixture, []).recall, 0);
assert.throws(
  () =>
    evaluate(
      [{ id: 'x', text: 'test' }],
      [{ id: 'x', human_decision: 'Needs context' }],
      bundle,
      report,
    ),
  /Unresolved/,
);
function checkPublic(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, v] of Object.entries(value)) {
    assert.ok(
      ![
        'text',
        'caption',
        'video_id',
        'comment_id',
        'video_url',
        'human_reason',
        'history',
        'dashboard_id',
      ].includes(key),
      'Private source field in public payload: ' + key,
    );
    checkPublic(v);
  }
}
checkPublic(p);
console.log(
  JSON.stringify({
    pilot_rows: 100,
    frozen_cutoff_false_positives: 5,
    top10_false_positives: 10,
    recall: 'unavailable: zero positives',
    private_source_fields: 'absent',
    status: 'passed',
  }),
);
