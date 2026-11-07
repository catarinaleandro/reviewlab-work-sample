const fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'),
  E = require(path.join(root, 'dist/engine.js'));
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const bundle = read('dist/data/model.json'),
  engine = E.createEngine(bundle),
  rows = read('dist/data/benchmark.json'),
  report = read('dist/data/report.json');
let max = 0;
for (const r of rows) {
  for (const key of ['word', 'word_char']) {
    const delta = Math.abs(engine.scoreModel(r.text, key).score - r.scores[key]);
    max = Math.max(max, delta);
    assert.ok(delta < 1e-8);
  }
  assert.equal(engine.scoreRules(r.text).score, r.scores.rules);
}
for (const key of ['word', 'word_char', 'rules', 'random'])
  for (const c of [0.05, 0.1, 0.2]) {
    const s = E.summarize(rows, key, c),
      ref = report.models[key].capacity.find((x) => x.capacity === c);
    for (const p of ['k', 'tp', 'fp', 'fn', 'recall', 'precision', 'fpr'])
      assert.equal(s[p], ref[p]);
  }
for (const r of read('ml/parity_reference.json'))
  for (const key of ['word', 'word_char'])
    assert.ok(Math.abs(engine.scoreModel(r.text, key).score - r.scores[key]) < 1e-8);
assert.equal(
  E.summarize([{ id: 'x', label: null, scores: { word: 0.9 } }], 'word', 0.1).labelled,
  false,
);
assert.deepEqual(E.parseCSV('text,label\r\n"hello, friend",0\r\n"line 1\nline ""2""",1'), [
  { text: 'hello, friend', label: '0' },
  { text: 'line 1\nline "2"', label: '1' },
]);
assert.throws(() => E.parseCSV('text,label\n"unclosed,0'));
assert.throws(() => E.parseCSV('text,label\nx,0,extra'));
assert.throws(() => E.parseCSV('text,text\na,b'));
const review = read('dist/data/error-review.json'),
  ranked = E.rank(rows, bundle.selected),
  queued = new Set(ranked.slice(0, review.review_capacity).map((r) => r.id));
for (const c of review.cases) {
  const original = rows.find((r) => r.id === c.id);
  assert.ok(original);
  assert.equal(c.text, original.text);
  assert.equal(c.model_score, original.scores[bundle.selected]);
  assert.equal(c.toxicity, original.toxicity);
  assert.equal(c.reference_label, original.label);
  assert.equal(c.rank, ranked.findIndex((r) => r.id === c.id) + 1);
  assert.equal(c.error_type === 'false_positive', queued.has(c.id));
  assert.equal(c.error_type === 'false_negative', original.label === 1);
}
assert.equal(review.benchmark_unchanged, true);
assert.equal(review.rubric_version, 'review-rubric-v2');
const result = {
  benchmark_rows: rows.length,
  learned_prediction_checks: rows.length * 2,
  rules_checks: rows.length,
  max_absolute_prediction_error: max,
  metric_comparisons: 12,
  csv_checks: 'passed',
  unlabelled_metrics: 'hidden',
  status: 'passed',
};
fs.writeFileSync(path.join(root, 'ml/verification.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));

require('./verify-policy.cjs');

require('./verify-pilot.cjs');
require('./verify-context-plan.cjs');
