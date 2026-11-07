'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'),
  p = require('../dist/policy.js');
const base = {
  id: 'fixture',
  decision: 'No violation',
  reason_id: 'benign',
  priority: 'routine',
  target_context: 'Unknown',
  note: '',
  timestamp: '2026-11-06T12:00:00Z',
};
assert.equal(p.validateDecision(base), null);
assert.match(p.validateDecision({ ...base, decision: 'Violation' }), /matching/);
assert.match(
  p.validateDecision({ ...base, reason_id: 'harassment', decision: 'Violation' }),
  /evidence/,
);
assert.match(p.validateDecision({ ...base, priority: 'urgent' }), /urgent/);
assert.match(p.validateDecision({ ...base, target_context: 'inferred identity' }), /target/);
const legacy = {
  id: 'fixture',
  decision: 'Violation',
  reason: 'Targeted insult',
  note: 'Old context',
  policy_version: 'review-rubric-v2',
};
const before = JSON.stringify(legacy),
  revised = p.buildDecision(base, legacy);
assert.equal(JSON.stringify(legacy), before);
assert.deepEqual(revised.history, [legacy]);
assert.equal(revised.policy_version, p.data.version);
const escalation = p.buildDecision(
  {
    ...base,
    decision: 'Escalate',
    reason_id: 'missing_context',
    note: 'Need the thread to establish intent.',
  },
  revised,
);
assert.equal(escalation.history.length, 2);
assert.equal(escalation.history[0].policy_version, 'review-rubric-v2');
assert.ok(!('history' in escalation.history[1]));
const flag = p.buildDecision({
  ...base,
  decision: 'Violation',
  reason_id: 'privacy',
  note: 'Home address exposed; omitted from this note.',
  priority: 'urgent',
});
assert.equal(flag.policy_category, 'privacy');
assert.match(flag.policy_source_url, /privacy-security#subpost-1$/);
const specialist = p.buildDecision({
  ...base,
  decision: 'Policy review',
  reason_id: 'restriction',
  note: 'Mild insult; target status not established.',
});
assert.equal(specialist.policy_category, 'harassment');
assert.equal(new Set(p.reasons.map((r) => r.id)).size, p.reasons.length);
for (const c of p.data.categories) {
  assert.match(c.url, /^https:\/\/www\.tiktok\.com\/safety\//);
  assert.ok(c.examples.some((e) => e.decision === 'Violation'));
  assert.ok(c.examples.some((e) => e.decision === 'No violation'));
}
const frozen = {
  'model.json': '284e3859c49ceb7eb3cedc03d8f04bfd14d1617fead98f4d4191f9c12ae7a1a0',
  'benchmark.json': '278ccb2133487ac01769f80566b9f6f80c8c47e9327ab572b00b5b95c7883959',
  'report.json': 'af4e35e7958b2333c7cd6fd08e49fc55afc6bc47c635ce44db73569b48d79c8d',
  'error-review.json': '9daa4c569aaa8716f1473a85a124cda4037121c83e1c6b2302481e15cbac95f7',
};
for (const [name, expected] of Object.entries(frozen)) {
  assert.equal(
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, 'dist/data', name)))
      .digest('hex'),
    expected,
    `${name} must remain frozen`,
  );
}
console.log(
  JSON.stringify({
    policy_version: p.data.version,
    decision_validation: 'passed',
    legacy_history: 'preserved',
    frozen_assets: 'unchanged',
    status: 'passed',
  }),
);
