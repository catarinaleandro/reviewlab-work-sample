'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'),
  plan = require('./context-experiment.json'),
  publicPlan = require('../dist/context-plan.js'),
  pilot = require('../dist/pilot-data.js');
assert.deepEqual(publicPlan, plan, 'Public model plan drifted from the training configuration');
assert.deepEqual(
  plan.arms.map((a) => a.id),
  ['A', 'B', 'C'],
);
assert.equal(plan.production_candidate, 'A');
assert.equal(plan.recommended_candidate, 'C');
assert.equal(plan.selected_winner, null);
assert.equal(plan.data_readiness.training_ready, false);
assert.equal(plan.implementation_checks.policy_model_trained, false);
assert.equal(plan.data_readiness.confirmed_pilot_violation, pilot.label_counts.violation);
assert.equal(plan.data_readiness.confirmed_pilot_no_violation, pilot.label_counts.no_violation);
assert.match(plan.base_model.revision, /^[a-f0-9]{40}$/);
assert.equal(plan.base_model.max_tokens, 512);
assert.equal(plan.evaluation.false_positive_reduction_goal, 0.3);
assert.equal(plan.evaluation.target_recall, 0.9);
const index = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
for (const file of ['context-plan.js', 'model-choices.js'])
  assert.ok(index.includes(`src="${file}"`));
// The historical plan above remains the pre-training configuration.
const run = require('../dist/context-results.js');
assert.equal(run.live_model, 'A');
assert.equal(
  run.batch.reviewed,
  ['N', 'V', 'U', 'P'].reduce((total, label) => total + run.batch[label], 0),
);
assert.equal(run.train.V + run.validation.V, run.batch.V);
assert.equal(run.train.N + run.validation.N, run.batch.N);
assert.ok(index.includes('src="context-results.js"'));
for (const arm of ['A', 'B', 'C']) {
  const result = run.validation_comparison[arm];
  const m = result.validation;
  assert.equal(m.tp + m.fn, run.validation.V);
  assert.equal(m.fp + m.tn, run.validation.N);
  assert.equal(m.precision, m.tp / (m.tp + m.fp));
  assert.equal(m.n, m.tp + m.fp + m.tn + m.fn);
  assert.equal(result.review_slots, 1);
}
console.log('Original model plan and first policy-training comparison verified.');
