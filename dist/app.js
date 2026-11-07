'use strict';
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const num = (n) => Number(n).toLocaleString('en-US'),
  pct = (n, d = 1) => (n === null || n === undefined ? '—' : (n * 100).toFixed(d) + '%');
const names = {
  word: 'Word TF-IDF',
  word_char: 'Word + character TF-IDF',
  rules: 'Keyword rules',
  random: 'Random selection',
};
let report,
  bundle,
  benchmark,
  errorReview,
  engine,
  rows = [],
  view = 'queue',
  model = 'word_char',
  capacity = 0.1,
  selectedId = null,
  page = 0,
  query = '',
  filter = 'all',
  showTruth = false,
  source = 'benchmark',
  sourceName = 'Civil Comments · held-out test';
let decisions = {};
try {
  decisions = JSON.parse(localStorage.getItem('reviewlab-decisions-v1') || '{}');
  if (!decisions || Array.isArray(decisions) || typeof decisions !== 'object') decisions = {};
} catch {}
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('hidden'), 4500);
}
function hero(eyebrow, title, subtitle, tag = '') {
  return `<div class="hero"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${tag ? `<div class="hero-tag"><span></span>${tag}</div>` : ''}</div>`;
}
function options(current) {
  return ['word_char', 'word', 'rules', 'random']
    .map((k) => `<option value="${k}" ${k === current ? 'selected' : ''}>${names[k]}</option>`)
    .join('');
}
function badge(r) {
  return showTruth && r.label !== null && r.label !== undefined
    ? `<span class="truth-tag ${r.label ? '' : 'clear'}">${r.label ? 'Toxic label' : 'Non-toxic label'}</span>`
    : '';
}
function scoreText(r) {
  return model === 'rules'
    ? `${r.scores[model]} rule points`
    : model === 'random'
      ? 'Random order'
      : r.scores[model].toFixed(3);
}
function scoreLabel() {
  return model === 'rules'
    ? 'Rule evidence'
    : model === 'random'
      ? 'Random baseline'
      : 'Model score';
}
function metric(label, value, sub, primary = false, icon = '↗') {
  return `<div class="metric ${primary ? 'primary' : ''}"><div class="metric-label">${label}<span class="metric-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-sub">${sub}</div></div>`;
}
function currentSummary() {
  return ReviewEngine.summarize(rows, model, capacity);
}
// Queue membership is determined at the chosen capacity before applying display filters.
function selectedItems() {
  let items = ReviewEngine.rank(rows, model),
    k = Math.max(1, Math.ceil(rows.length * capacity));
  items = filter === 'fn' ? items.slice(k).filter((r) => r.label === 1) : items.slice(0, k);
  if (filter === 'pending') items = items.filter((r) => !decisions[r.id]);
  if (filter === 'reviewed') items = items.filter((r) => decisions[r.id]);
  if (filter === 'fp') items = items.filter((r) => r.label === 0);
  if (query) items = items.filter((r) => r.text.toLowerCase().includes(query.toLowerCase()));
  return items;
}
function chart() {
  if (!rows.every((r) => r.label === 0 || r.label === 1))
    return '<div class="empty">Add human labels to measure capture.<br>Unlabelled comments can be ranked, but cannot establish accuracy.</div>';
  const fractions = [0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3];
  const toX = (c) => 40 + (c / 0.3) * 440,
    toY = (r) => 126 - r * 104;
  const series = (key) =>
    fractions.map((c) => ({ c, r: ReviewEngine.summarize(rows, key, c).recall ?? 0 }));
  const path = (points) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${toX(p.c).toFixed(1)},${toY(p.r).toFixed(1)}`).join(' ');
  const a = series(model),
    b = series('rules'),
    now = currentSummary();
  return `<svg class="chart" viewBox="0 0 510 158" role="img" aria-label="Toxic comment recall by review capacity, comparing the selected model with keyword rules">
    ${[0, 0.25, 0.5, 0.75, 1].map((n) => `<line class="grid" x1="40" y1="${toY(n)}" x2="480" y2="${toY(n)}"/><text x="29" y="${toY(n) + 3}" text-anchor="end">${n * 100}%</text>`).join('')}
    <path d="${path(a)} L480,126 L${toX(0.01)},126Z" fill="#edf4e5" opacity=".7"/><path d="${path(b)}" fill="none" stroke="#b1bf9e" stroke-width="2" stroke-dasharray="5 5"/>
    <path d="${path(a)}" fill="none" stroke="#33744f" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${toX(capacity)}" x2="${toX(capacity)}" y1="20" y2="126" stroke="#a7bf92" stroke-dasharray="3 4"/><circle cx="${toX(capacity)}" cy="${toY(now.recall ?? 0)}" r="4.5" fill="#37774d" stroke="white" stroke-width="2"/>
    ${[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((c) => `<text x="${toX(c)}" y="149" text-anchor="middle">${Math.round(c * 100)}%</text>`).join('')}</svg>`;
}
function renderQueue() {
  const s = currentSummary(),
    baseline = ReviewEngine.summarize(rows, 'rules', capacity),
    lift = s.labelled ? s.tp - baseline.tp : null;
  const labelled = rows.filter((r) => r.label === 0 || r.label === 1).length;
  const items = selectedItems();
  if (!selectedId || !items.some((r) => r.id === selectedId)) selectedId = items[0]?.id || null;
  $('#content').innerHTML =
    hero(
      'HUMAN REVIEW, BETTER PRIORITISED',
      'Make every review count.',
      'Explore the trade-off between review capacity and harmful content captured.',
      source === 'benchmark'
        ? 'Held-out benchmark · ' + num(rows.length) + ' comments'
        : 'Imported · ' + num(rows.length) + ' comments',
    ) +
    `<div class="metrics">
    ${metric('Comments to review', num(s.k), `${Math.round(capacity * 100)}% target · rounded up to whole comments`, false, '▤')}
    ${metric('Toxic comments captured', s.labelled ? pct(s.recall) : '—', s.labelled ? `<strong>${num(s.tp)} of ${num(s.p)} toxic-labelled comments</strong>` : `${num(labelled)} of ${num(rows.length)} rows have labels`, true)}
    ${metric('Review precision', s.labelled ? pct(s.precision) : '—', s.labelled ? `${num(s.tp)} useful reviews · ${num(s.fp)} false positives` : 'Human labels required to evaluate', false, '◎')}
    ${metric('Toxic comments missed', s.labelled ? num(s.fn) : '—', s.labelled ? 'Outside the selected review queue' : 'Unknown until independently labelled', false, '↘')}
  </div>
  <div class="overview"><section class="panel panel-pad"><div class="panel-head"><div><div class="panel-title">More capacity. More context.</div><div class="panel-sub">Toxic comment recall vs. share of comments reviewed</div></div><div class="legend"><span><i></i>Selected model</span><span><i class="baseline"></i>Rules</span></div></div>${chart()}<div class="chart-note">${source === 'benchmark' ? 'Measured on the held-out benchmark. Capacity exploration does not retrain the model.' : 'Measured only when every imported row has a human label.'}</div></section>
  <section class="panel panel-pad"><div class="panel-head"><div class="panel-title">Your review budget</div><span class="badge-neutral">Capacity mode</span></div><div class="capacity-top"><div class="capacity-value">${num(s.k)} <small>comments</small></div><span class="capacity-number">${Math.round(capacity * 100)}%</span></div><label class="hidden" for="capacity">Review capacity percentage</label><input id="capacity" type="range" min="5" max="30" step="1" value="${Math.round(capacity * 100)}"><div class="range-labels"><span>5% · limited capacity</span><span>30% · expanded review</span></div><div class="insight">${s.labelled ? `At this capacity, ${names[model]} captures <strong>${lift >= 0 ? num(lift) + ' more' : num(-lift) + ' fewer'} toxic-labelled comments</strong> than keyword rules.` : 'Change capacity to choose how many comments enter the queue. Accuracy stays unknown until labels are added.'}</div></section></div>
  <div class="notice"><span>ⓘ</span><span>${source === 'benchmark' ? 'Research comments may contain offensive language. Scores are not violation decisions.' : `Imported: ${esc(sourceName)}. Comments are processed in your browser.`}</span><label class="switch-label"><input id="truth-toggle" type="checkbox" ${showTruth ? 'checked' : ''}>Show reference labels</label></div>
  <div class="queue-layout"><section class="panel queue-panel"><div class="queue-header"><h2>Review queue <span class="count-chip">${num(s.k)}</span></h2><label><span class="hidden">Ranking model</span><select id="model-select" class="field-select">${options(model)}</select></label></div><div class="queue-tools"><input id="search" class="search" placeholder="Search comments…" aria-label="Search comments" value="${esc(query)}"><select id="queue-filter" class="field-select" aria-label="Filter review queue"><option value="all" ${filter === 'all' ? 'selected' : ''}>All queued</option><option value="pending" ${filter === 'pending' ? 'selected' : ''}>Pending review</option><option value="reviewed" ${filter === 'reviewed' ? 'selected' : ''}>Reviewed</option>${s.labelled ? `<option value="fp" ${filter === 'fp' ? 'selected' : ''}>False positives · audit</option><option value="fn" ${filter === 'fn' ? 'selected' : ''}>Missed toxic · audit</option>` : ''}</select></div><div id="queue-list"></div><div id="queue-pagination"></div></section><section id="detail" class="panel detail-panel" aria-label="Selected comment"></section></div>`;
  $('#capacity').onchange = (e) => {
    capacity = +e.target.value / 100;
    page = 0;
    renderQueue();
  };
  $('#model-select').onchange = (e) => {
    model = e.target.value;
    page = 0;
    selectedId = null;
    renderQueue();
  };
  $('#truth-toggle').onchange = (e) => {
    showTruth = e.target.checked;
    renderQueue();
  };
  $('#search').oninput = (e) => {
    query = e.target.value;
    page = 0;
    renderList();
  };
  $('#queue-filter').onchange = (e) => {
    filter = e.target.value;
    page = 0;
    selectedId = null;
    renderList();
    renderDetail();
  };
  renderList();
  renderDetail();
  updateNav();
}
function renderList() {
  const items = selectedItems(),
    total = items.length;
  page = Math.min(page, Math.max(0, Math.ceil(total / 20) - 1));
  if (!items.some((r) => r.id === selectedId)) {
    selectedId = items[0]?.id || null;
    renderDetail();
  }
  $('#queue-list').innerHTML =
    items
      .slice(page * 20, page * 20 + 20)
      .map(
        (r, i) =>
          `<button class="queue-row ${r.id === selectedId ? 'selected' : ''}" data-id="${esc(r.id)}" aria-label="Review comment ${page * 20 + i + 1}"><span class="row-top"><span class="row-rank">${String(page * 20 + i + 1).padStart(2, '0')}</span><span>${source === 'benchmark' ? 'CIVIL COMMENTS' : 'IMPORTED'} · ${r.id.slice(0, 7)}</span><span class="row-status">${decisions[r.id] ? '✓ Reviewed' : 'Pending'}</span><span class="score">${scoreText(r)}</span></span><span class="row-text">${esc(r.text)}</span><span class="row-foot">${badge(r)}<span>${decisions[r.id] ? esc(decisions[r.id].decision) : 'Awaiting human decision'}</span></span></button>`,
      )
      .join('') ||
    '<div class="empty">No comments match this filter.<br>Try a different search or review status.</div>';
  $('#queue-pagination').innerHTML =
    `<div class="queue-footer"><span>${total ? num(page * 20 + 1) + '–' + num(Math.min(total, (page + 1) * 20)) : '0'} of ${num(total)} ${filter === 'fn' ? 'missed comments' : 'comments'}</span><span><button id="prev-page" class="button" ${page === 0 ? 'disabled' : ''} aria-label="Previous page">←</button> <button id="next-page" class="button" ${(page + 1) * 20 >= total ? 'disabled' : ''} aria-label="Next page">→</button></span></div>`;
  $$('.queue-row').forEach(
    (b) =>
      (b.onclick = () => {
        selectedId = b.dataset.id;
        renderList();
        renderDetail();
      }),
  );
  $('#prev-page').onclick = () => {
    page--;
    renderList();
  };
  $('#next-page').onclick = () => {
    page++;
    renderList();
  };
}
function renderDetail() {
  const el = $('#detail');
  if (!el) return;
  const r = rows.find((x) => x.id === selectedId);
  if (!r) {
    el.innerHTML =
      '<div class="empty">Select a comment to review its evidence and record a decision.</div>';
    return;
  }
  let evidence = [],
    evidenceText = '';
  if (model === 'rules') {
    const s = engine.scoreRules(r.text);
    evidence = s.evidence.flatMap((x) => x.terms);
    evidenceText = 'Matched terms increase the rule score. Context can change their meaning.';
  } else if (model === 'random') {
    evidenceText = 'Random ordering is a comparison baseline and uses no content evidence.';
  } else {
    evidence = engine.scoreModel(r.text, model, true).evidence.map((x) => x.term);
    evidenceText =
      'Words pushing the score upward. These are model influences, not proof of a violation.';
  }
  const d = decisions[r.id],
    legacy = d && d.policy_version !== ReviewPolicy.data.version;
  const targets = [
    'Unknown',
    'Object or idea',
    'Private figure',
    'Public figure (adult, established)',
    'Person under 18',
    'Protected group',
  ];
  el.innerHTML = `<div class="detail-head"><h2>Review workspace</h2><a href="#policy" class="badge-neutral">Rubric v3 ↗</a></div><div class="detail-body"><div class="detail-meta">Comment · ${r.id.slice(0, 12)}</div>${r.caption ? `<div class="context-block">Associated caption (not scored): ${esc(r.caption)}</div>` : ''}<div class="detail-text">${esc(r.text)}</div>${showTruth && r.label !== null && r.label !== undefined ? `<div>${badge(r)} <span class="label-subtle">${r.toxicity !== null && r.toxicity !== undefined ? 'Annotator fraction: ' + pct(r.toxicity) : 'Imported reference label'}</span></div>` : ''}<div class="divider"></div><div class="panel-head"><span class="field-label" style="margin:0">${scoreLabel()}</span><span class="score">${scoreText(r)}</span></div><div class="evidence-list">${evidence.map((t) => `<span class="evidence-chip">${esc(t)}</span>`).join('') || '<span class="label-subtle">No positive word-level evidence to display.</span>'}</div><p class="help-text">${evidenceText} This toxicity model does not detect each policy category.</p><div class="divider"></div>${legacy ? `<div class="insight">Historical decision under ${esc(d.policy_version || 'an unversioned rubric')}. Select a v3 reason to re-review it. The original record will be kept.</div>` : ''}<label class="field-label" for="reason">Decision reason</label><select id="reason" class="detail-select"><option value="">Select a policy reason…</option>${ReviewPolicy.reasons.map((o) => `<option value="${o.id}" ${!legacy && d?.reason_id === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select><div id="reason-help" class="help-text"></div><label class="field-label" for="target-context">Target context</label><select id="target-context" class="detail-select">${targets.map((t) => `<option ${d?.target_context === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><label class="field-label" for="review-priority">Review priority</label><select id="review-priority" class="detail-select"><option value="routine">Routine</option><option value="urgent" ${d?.priority === 'urgent' ? 'selected' : ''}>Urgent safety concern</option></select><p class="help-text">Urgent is a recorded priority only; no safety team is contacted.</p><label class="field-label" for="review-note">Evidence / missing context <span class="label-subtle">(required for flags and escalations)</span></label><textarea id="review-note" class="notes" maxlength="2000" placeholder="Which act meets the rule, or what evidence is missing? Do not copy private personal details.">${esc(d?.note || '')}</textarea><div class="decision-buttons"><button class="button soft" data-decision="No violation">✓ No violation</button><button class="button danger" data-decision="Violation">Flag violation</button><button class="button" data-decision="Escalate">Needs context ↗</button><button class="button" data-decision="Policy review">Policy / specialist review ↗</button></div>${d ? `<div class="decision-saved" role="status">Saved: <strong>${esc(d.decision === 'Escalate' ? 'Needs context' : d.decision)}</strong> · ${new Date(d.timestamp).toLocaleString()}<br>Reason: ${esc(d.reason)}<br>${esc(d.policy_version || 'Unversioned')} · ${num(d.history?.length || 0)} earlier records retained</div>` : ''}<p class="help-text">Decisions stay in this browser. They do not remove content, change reference labels or retrain the model. Export includes earlier records and policy sources.</p></div>`;
  function showReason() {
    const reason = ReviewPolicy.reasons.find((x) => x.id === $('#reason').value),
      category = ReviewPolicy.data.categories.find((x) => x.id === reason?.category);
    $('#reason-help').innerHTML = reason
      ? `Matching action: <strong>${esc(reason.actions[0] === 'Escalate' ? 'Needs context' : reason.actions[0])}</strong>. ${category ? `<a href="${category.url}" target="_blank" rel="noopener">TikTok policy ↗</a>` : '<a href="#policy">Read the decision boundaries ↗</a>'}`
      : 'Start with the policy evidence, not the model score.';
  }
  $('#reason').onchange = showReason;
  showReason();
  $$('[data-decision]').forEach((b) => (b.onclick = () => saveDecision(b.dataset.decision, r)));
}
// Reviewer actions do not overwrite model scores or reference labels.
function saveDecision(decision, r) {
  const input = {
    id: r.id,
    decision,
    reason_id: $('#reason').value,
    note: $('#review-note').value,
    target_context: $('#target-context').value,
    priority: $('#review-priority').value,
    timestamp: new Date().toISOString(),
    source: sourceName,
    model,
    model_version: bundle.version,
    score: r.scores[model],
    capacity,
  };
  const error = ReviewPolicy.validateDecision(input);
  if (error) {
    toast(error);
    return;
  }
  decisions[r.id] = ReviewPolicy.buildDecision(input, decisions[r.id]);
  try {
    localStorage.setItem('reviewlab-decisions-v1', JSON.stringify(decisions));
    toast('Decision saved with its policy source and version.');
  } catch {
    toast('Saved for this session only. Browser storage is unavailable; export your decisions.');
  }
  renderList();
  renderDetail();
}
function renderPolicy() {
  $('#content').innerHTML =
    hero(
      'TIKTOK COMMUNITY GUIDELINES → HUMAN REVIEW',
      'Clear rules. Room for context.',
      'A source-linked guide to six policy areas, with examples and four review outcomes.',
      'Rubric v3 · 24 Sep 2026',
    ) +
    reviewPolicyHTML() +
    `<button class="button primary" id="download-policy">Download policy mapping ↓</button>`;
  $('#download-policy').onclick = () =>
    download(
      'reviewlab-rubric-v3.json',
      JSON.stringify({ policy: ReviewPolicy.data, reasons: ReviewPolicy.reasons }, null, 2),
      'application/json',
    );
}

function renderExperiments() {
  const selected = report.selection.selected_model,
    a = report.models[selected].capacity[1],
    b = report.models.rules.capacity[1],
    ci = report.comparison.recall_difference_ci95,
    identity = report.slices[0];
  $('#content').innerHTML =
    hero(
      'EVIDENCE BEFORE EXPANSION',
      'The experiment, in the open.',
      'A frozen model comparison. Same test comments, same review capacity, different rankings.',
      'Held-out evaluation',
    ) +
    `<div class="notice"><span>New: the 100-comment TikTok calibration is complete.</span><a href="#pilot">View human-label results →</a></div>` +
    `<div class="result-banner"><div><div class="eyebrow">BENCHMARK RESULT · 10% REVIEW CAPACITY</div><h2>${num(a.tp)} toxic-labelled comments captured. Rules captured ${num(b.tp)}.</h2><p>${num(a.k)} reviews for each approach. Selected on validation data before scoring the test set.</p></div><div class="large-stat">+${num(a.tp - b.tp)}<div class="panel-sub">additional toxic comments captured</div></div></div>
  <section class="panel" style="margin-bottom:20px"><div class="queue-header"><h2>Model comparison</h2><span class="badge-neutral">${num(report.audit.test.retained)} test comments</span></div><div class="table-wrap"><table><thead><tr><th>Approach</th><th>Recall @ 10%</th><th>Precision @ 10%</th><th>False positives</th><th>Missed toxic</th><th>Avg. precision</th></tr></thead><tbody>${[
    'random',
    'rules',
    'word',
    'word_char',
  ]
    .map((k) => {
      const m = report.models[k],
        c = m.capacity[1];
      return `<tr class="${k === selected ? 'winner' : ''}"><td><strong>${names[k]}</strong>${k === selected ? '<span class="pill">Selected</span>' : ''}</td><td>${pct(c.recall)}</td><td>${pct(c.precision)}</td><td>${num(c.fp)}</td><td>${num(c.fn)}</td><td>${m.average_precision.toFixed(3)}</td></tr>`;
    })
    .join(
      '',
    )}</tbody></table></div><p class="experiment-note">Average precision summarises the precision–recall curve. Random selection is one deterministic seeded baseline. Unreviewed comments are not declared safe.</p></section>
  <div class="section-grid"><section class="panel panel-pad"><div class="eyebrow">UNCERTAINTY</div><h2>How much did capture improve?</h2><div class="large-stat">+${((a.recall - b.recall) * 100).toFixed(1)} <span style="font-size:15px;letter-spacing:0">percentage points</span></div><p class="body-copy">95% paired bootstrap interval: <strong>+${(ci[0] * 100).toFixed(1)} to +${(ci[1] * 100).toFixed(1)} points</strong>. The model captured ${pct(report.comparison.relative_capture_lift)} more toxic-labelled comments than rules.</p><p class="help-text">500 row-level resamples, reranking each model within each resample. Unobserved thread correlations are not accounted for.</p></section>
  <section class="panel panel-pad"><div class="eyebrow">PRODUCT DECISION</div><h2>Continue offline. Hold a live pilot.</h2><p class="body-copy" style="margin-top:16px">The capture target passed, but a contextual guardrail needs investigation. Among non-toxic comments containing selected identity terms, the model queued <strong>${pct(identity.models[selected].fpr)}</strong> versus <strong>${pct(identity.models.rules.fpr)}</strong> for rules (${num(identity.negative)} reference-negative comments).</p><p class="severity-note">This lexical check is a diagnostic, not proof of demographic bias. Human context review and independent TikTok evaluation are still required.</p></section>
  <section class="panel full-width"><div class="queue-header"><h2>Performance at different capacities</h2><span class="badge-neutral">Selected model</span></div><div class="table-wrap"><table><thead><tr><th>Review capacity</th><th>Comments reviewed</th><th>Toxic captured</th><th>Recall</th><th>Precision</th><th>False positives</th></tr></thead><tbody>${report.models[selected].capacity.map((c) => `<tr><td>${pct(c.capacity, 0)}</td><td>${num(c.k)}</td><td>${num(c.tp)}</td><td>${pct(c.recall)}</td><td>${pct(c.precision)}</td><td>${num(c.fp)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><div class="queue-header"><h2>Serious categories</h2><span class="badge-neutral">10% capacity</span></div><div class="table-wrap"><table><thead><tr><th>Reference category</th><th>Positive count</th><th>Rules captured</th><th>Model captured</th></tr></thead><tbody>${report.categories.map((c) => `<tr><td>${c.category.replaceAll('_', ' ')}</td><td>${c.positive}</td><td>${c.positive ? c.capture.rules.caught + ' / ' + c.positive : '—'}</td><td>${c.positive ? c.capture[selected].caught + ' / ' + c.positive : '—'}</td></tr>`).join('')}</tbody></table></div><p class="experiment-note">Category labels also use an annotator fraction ≥ 0.5. Only 22 threats and no severe-toxicity positives appear in this sample; safety performance is not established.</p></section>
  <section class="panel panel-pad"><h2>A threshold is a different operating mode.</h2><p class="body-copy" style="margin-top:15px">The validation-set cutoff was frozen at <strong>${report.selection.threshold.toFixed(3)}</strong>. Applied unchanged to the test set, it selected <strong>${num(report.threshold_evaluation.reviewed)} comments (${pct(report.threshold_evaluation.review_rate)})</strong>, with ${pct(report.threshold_evaluation.recall)} recall and ${pct(report.threshold_evaluation.precision)} precision.</p><div class="insight">The queue uses a top-K budget. A fixed score threshold cannot guarantee the same review volume when incoming content changes.</div></section>
  <section class="panel full-width"><div class="queue-header"><h2>Contextual diagnostics</h2><span class="badge-neutral">Global top 10% queue</span></div><div class="table-wrap"><table><thead><tr><th>Slice</th><th>Rows / negative rows</th><th>Rules false-positive rate</th><th>Model false-positive rate</th><th>Model recall</th></tr></thead><tbody>${report.slices.map((s) => `<tr><td>${esc(s.name)}</td><td>${num(s.n)} / ${num(s.negative)}</td><td>${pct(s.models.rules.fpr)}</td><td>${pct(s.models[selected].fpr)}</td><td>${pct(s.models[selected].recall)}</td></tr>`).join('')}</tbody></table></div><p class="experiment-note">False-positive rate is the share of reference-negative comments in a slice that entered the global queue. Slices overlap. Identity terms do not establish an author's identity.</p></section></div>
  <div class="actions-row"><button id="download-report" class="button primary">Download evaluation JSON ↓</button><button id="download-errors" class="button">Download error-review sample ↓</button><button id="inspect-errors" class="button soft">Inspect false positives →</button></div>`;
  $('#download-report').onclick = () =>
    download('reviewlab-evaluation.json', JSON.stringify(report, null, 2), 'application/json');
  $('#download-errors').onclick = exportErrors;
  $('#inspect-errors').onclick = () => {
    restoreBenchmark();
    filter = 'fp';
    showTruth = true;
    navigate('queue');
  };
}
function renderImport() {
  $('#content').innerHTML =
    hero(
      'BRING YOUR OWN CONTENT',
      'From benchmark to real comments.',
      'Score new text with the trained model. Add independent human labels to measure transfer.',
      'Runs in your browser',
    ) +
    `<div class="section-grid"><section class="panel panel-pad"><div class="eyebrow">QUICK CHECK</div><h2>Try one comment</h2><p class="body-copy" style="margin:12px 0 18px">See the selected model’s score and the words that influence it.</p><label for="try-text" class="field-label">Comment text</label><textarea id="try-text" class="large" maxlength="20000" placeholder="Write or paste a comment here…"></textarea><div class="actions-row"><button id="score-text" class="button primary">Score comment ↗</button><button id="load-example" class="button">Try a context example</button></div><div id="prediction"></div><p class="help-text">A model score estimates the training label. It is not a calibrated probability of a policy violation or a measure of harm severity.</p></section>
  <section class="panel panel-pad"><div class="eyebrow">TIKTOK TRANSFER · CSV IMPORT</div><h2>Build a queue from your data</h2><p class="body-copy" style="margin-top:12px">Use comments you are permitted to analyse. Uploaded files are read locally; no comments are sent to an inference service.</p><div class="upload-zone"><div class="upload-icon">↥</div><h3>Choose a comments CSV</h3><p>Up to 5,000 comments · 5 MB<br>A <strong>text</strong>, <strong>comment</strong>, or <strong>comment_text</strong> column is required.</p><input id="csv-file" type="file" accept=".csv,text/csv" aria-label="Choose comments CSV"></div><div class="mini-code">text,label,caption<br>"Example comment",0,"Optional context"</div><p class="help-text">Optional: <strong>label</strong> (0 or 1), or <strong>toxicity</strong> (0 to 1, converted at 0.5). Labels must come from independent human annotation. Caption is displayed as context and is not scored.</p><div class="actions-row"><button id="import-csv" class="button primary">Import & score →</button><button id="download-template" class="button">Download template ↓</button></div><div id="import-status" class="file-status" role="status"></div></section>
  <section class="panel panel-pad"><h2>A useful TikTok transfer test</h2><div class="body-copy"><ol><li>Sample across videos and topics, without filtering only for offensive keywords.</li><li>Label 500–1,000 comments using the review rubric. Double-label an initial 100 and resolve disagreements.</li><li>Keep videos and threads together when creating development and final test sets.</li><li>Freeze the model and queue policy before evaluating the held-out TikTok sample.</li><li>Report transfer results separately from Civil Comments and from synthetic examples.</li></ol></div></section><section class="panel panel-pad"><h2>What happens after import?</h2><div class="body-copy"><p>The review queue switches to your comments. The same model ranks them and the capacity slider controls how many enter the queue.</p><p>When <strong>every row has a reference label</strong>, the queue shows measured recall, precision, and missed toxic comments. With incomplete labels, metrics are hidden.</p><p>The experiment lab remains the frozen Civil Comments benchmark. Imported content stays in memory; reload to clear it. Saved decisions contain IDs and notes and stay in this browser.</p></div><button id="restore-benchmark" class="button soft" style="margin-top:16px">Return to Civil Comments →</button></section></div>`;
  $('#load-example').onclick = () => {
    $('#try-text').value =
      'Please stop calling people idiots. We can disagree without insulting each other.';
  };
  $('#score-text').onclick = () => {
    const t = $('#try-text').value.trim();
    if (!t) {
      toast('Enter a comment to score.');
      return;
    }
    const r = engine.scoreModel(t, bundle.selected, true),
      rs = engine.scoreRules(t);
    $('#prediction').innerHTML =
      `<div class="prediction"><span class="field-label">${names[bundle.selected]} · score</span><strong>${r.score.toFixed(3)}</strong><p>Keyword baseline: ${rs.score} rule points. Neither score is a reviewer decision.</p><div class="evidence-list">${r.evidence.map((e) => `<span class="evidence-chip">${esc(e.term)}</span>`).join('') || '<span class="label-subtle">No positive word-level influences.</span>'}</div><p>Interpret the text in context before deciding whether it violates the rubric.</p></div>`;
  };
  $('#import-csv').onclick = importCSV;
  $('#download-template').onclick = () =>
    download(
      'reviewlab-import-template.csv',
      'text,label,caption\n"Thanks for explaining your point.",0,"Example context"\n"Everyone go leave abusive comments on her account.",1,"Synthetic practice example"\n',
      'text/csv',
    );
  $('#restore-benchmark').onclick = () => {
    restoreBenchmark();
    navigate('queue');
  };
}
async function importCSV() {
  const file = $('#csv-file').files[0],
    status = $('#import-status'),
    button = $('#import-csv');
  if (!file) {
    status.textContent = 'Choose a CSV file first.';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = 'This file exceeds 5 MB. Use a smaller sample.';
    return;
  }
  button.disabled = true;
  try {
    const parsed = ReviewEngine.parseCSV(await file.text());
    if (parsed.length > 5000) throw Error('Limit imports to 5,000 comments per batch.');
    const textCol = ['text', 'comment', 'comment_text'].find((c) => c in parsed[0]);
    if (!textCol) throw Error('Add a text, comment, or comment_text column.');
    const prepared = parsed.map((r, i) => {
      const t = r[textCol].trim();
      if (!t) throw Error(`Row ${i + 2}: comment text is empty.`);
      if (t.length > 20000) throw Error(`Row ${i + 2}: comment exceeds 20,000 characters.`);
      let label = null,
        toxicity = null;
      if (r.label?.trim()) {
        if (!['0', '1'].includes(r.label.trim()))
          throw Error(`Row ${i + 2}: label must be 0 or 1.`);
        label = Number(r.label.trim());
      }
      if (r.toxicity?.trim()) {
        toxicity = Number(r.toxicity);
        if (!Number.isFinite(toxicity) || toxicity < 0 || toxicity > 1)
          throw Error(`Row ${i + 2}: toxicity must be a number between 0 and 1.`);
        if (label !== null && label !== Number(toxicity >= 0.5))
          throw Error(`Row ${i + 2}: label conflicts with the toxicity fraction.`);
        label = Number(toxicity >= 0.5);
      }
      return { text: t, label, toxicity, caption: r.caption || '', index: i };
    });
    const imported = [];
    for (let i = 0; i < prepared.length; i++) {
      const r = prepared[i],
        bytes = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode('import:' + r.index + ':' + r.text),
        );
      const id = Array.from(new Uint8Array(bytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const scores = engine.score(r.text);
      scores.random = parseInt(id.slice(0, 12), 16) / 16 ** 12;
      imported.push({
        id,
        text: r.text,
        label: r.label,
        toxicity: r.toxicity,
        caption: r.caption,
        scores,
      });
      if (i % 25 === 0) {
        status.textContent = `Scoring ${num(i + 1)} of ${num(prepared.length)} comments…`;
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    rows = imported;
    source = 'import';
    sourceName = file.name;
    model = bundle.selected;
    page = 0;
    filter = 'all';
    query = '';
    selectedId = null;
    navigate('queue');
    toast(`${num(rows.length)} comments imported and scored locally.`);
  } catch (e) {
    status.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    button.disabled = false;
  }
}
function renderMethod() {
  const audit = report.audit;
  $('#content').innerHTML =
    hero(
      'METHODOLOGY',
      'How ReviewLab was evaluated',
      'The benchmark, annotation rubric and model evaluation behind the prototype.',
      'Phase 1',
    ) +
    `<div class="section-grid"><section class="panel panel-pad full-width"><div class="eyebrow">THE PRODUCT QUESTION</div><h2>Can we find more harmful content within the same human review budget?</h2><div class="body-copy"><p><strong>User:</strong> a content reviewer and moderation operations lead. <strong>Decision:</strong> which comments to inspect next. <strong>Scope:</strong> English text, review prioritisation, and explicit human decisions.</p><p>This prototype predicts a toxicity annotation, not TikTok policy enforcement. It does not remove content, ban users, or infer a person's identity. Items outside the queue remain unreviewed.</p></div></section>
  <section class="panel panel-pad"><div class="eyebrow">DATA CARD</div><h2>Human labels, separate from predictions.</h2><div class="body-copy"><p>Civil Comments contains public comments from news websites, with crowd-worker annotation fractions. The binary reference label is <strong>toxicity ≥ 0.5</strong>. A fraction of 0.8 means 80% of the annotators marked toxicity; it does not measure harm severity.</p><p>Uniform random samples retain natural class proportions. Official splits are preserved. Empty and punctuation/case/whitespace-normalised duplicate texts are removed within and across the sampled splits.</p></div><div class="split-stats"><div><strong>${num(audit.train.retained)}</strong><span>Training</span></div><div><strong>${num(audit.validation.retained)}</strong><span>Validation</span></div><div><strong>${num(audit.test.retained)}</strong><span>Test</span></div></div><p class="help-text">Test prevalence: ${pct(audit.test.prevalence)}. Source: google/civil_comments. CC0-1.0. Original text may contain abusive language. This mirror does not expose thread/video IDs.</p><div class="resource-links"><a href="https://huggingface.co/datasets/google/civil_comments" target="_blank" rel="noopener">Dataset card ↗</a><a href="https://www.tensorflow.org/datasets/catalog/civil_comments" target="_blank" rel="noopener">Annotation documentation ↗</a></div></section>
  <section class="panel panel-pad"><div class="eyebrow">EVALUATION CONTRACT</div><h2>Separate learning from judging.</h2><div class="step"><span class="step-number">01</span><div><h3>Train on training data only</h3><p>Word 1–2 grams and character 3–5 grams. TF-IDF vocabulary and weights fitted only on training comments. Logistic regression C=2; no class rebalancing.</p></div></div><div class="step"><span class="step-number">02</span><div><h3>Select on validation data</h3><p>Choose between word-only and word-plus-character models by recall at 10% review capacity, with average precision as the tie-breaker.</p></div></div><div class="step"><span class="step-number">03</span><div><h3>Evaluate once on the test sample</h3><p>Freeze selection and the validation cutoff. Compare all strategies at identical capacities, using label-independent ID ordering to resolve tied scores.</p></div></div><div class="step"><span class="step-number">04</span><div><h3>Make a product decision</h3><p>Measure capture and workload, inspect errors, and check contextual failure patterns before considering a pilot.</p></div></div></section>
  <section class="panel panel-pad"><div class="eyebrow">REVIEW RUBRIC · V3</div><h2>Decisions grounded in a policy.</h2><div class="body-copy"><p>The Policy guide maps six text-review areas to TikTok’s English (US) Community Guidelines, effective 24 September 2026. It distinguishes clear violations, no violation in scope, missing context and policy / specialist review.</p><p>Lower-severity hostility is not automatically a removal violation. Recommendation restrictions and public-interest exceptions require a separate assessment.</p><p>Saved decisions carry their policy source, version, target context, priority and edit history. This does not add trained category detectors or change the Civil Comments benchmark.</p></div><a class="button soft" href="#policy">Read the policy guide →</a></section>
  <section class="panel panel-pad"><div class="eyebrow">REMAINING VALIDATION</div><h2>A measured benchmark, not a launch verdict.</h2><div class="body-copy"><ul>${report.limitations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></section>
  <section class="panel panel-pad full-width"><div class="eyebrow">TWO-PHASE ROADMAP</div><h2>Prove the text workflow. Then test visual value.</h2><div class="body-copy"><p><strong>Phase 1 · implemented:</strong> reproducible sampled benchmark, keyword and TF-IDF/logistic comparisons, browser inference, review queue, capacity simulation, CSV import, decision logging, and measured diagnostics.</p><p><strong>Phase 1 · next evidence:</strong> manually review false positives and false negatives, double-label a 100-comment pilot, evaluate an independent TikTok sample, and run 3–5 reviewer usability sessions. Keep model changes off the frozen test sample.</p><p><strong>Phase 2 · planned:</strong> use genuinely paired images and captions for one supported policy category. ResNet50 can supply image features or candidate ImageNet tags; those scores are not probabilities of a violation. Train or validate a policy-specific decision layer with human labels.</p><p>Compare text-only, visual-only, and combined systems on the same held-out pairs at the same review capacity. Measure capture, contextual false positives, latency, and cost. Keep visual evidence, policy risk, and reviewer decisions as separate fields. Still images do not establish full-video understanding.</p></div><div class="resource-links"><a href="https://docs.pytorch.org/vision/main/models/generated/torchvision.models.resnet50.html" target="_blank" rel="noopener">ResNet50 reference ↗</a><a href="https://scikit-learn.org/stable/modules/classification_threshold.html" target="_blank" rel="noopener">Threshold selection ↗</a></div></section></div>
  <div class="actions-row"><button class="button primary" id="download-protocol">Download evaluation protocol ↓</button><button class="button" id="download-modelcard">Download model card ↓</button></div>`;
  $('#download-protocol').onclick = () =>
    download(
      'reviewlab-protocol.json',
      JSON.stringify(report.protocol, null, 2),
      'application/json',
    );
  $('#download-modelcard').onclick = () =>
    download(
      'reviewlab-model-card.json',
      JSON.stringify(
        {
          version: bundle.version,
          source: report.source,
          audit: report.audit,
          selection: report.selection,
          limitations: report.limitations,
          product_decision: 'Continue offline validation; hold live routing.',
        },
        null,
        2,
      ),
      'application/json',
    );
}
function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
function exportCSV(name, data, fields) {
  download(
    name,
    fields.map(csvCell).join(',') +
      '\n' +
      data.map((r) => fields.map((f) => csvCell(r[f])).join(',')).join('\n'),
    'text/csv',
  );
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportDecisions() {
  const data = Object.values(decisions).flatMap((d) => [
    ...(d.history || []).map((h) => ({ ...h, record_status: 'superseded' })),
    { ...d, record_status: 'current' },
  ]);
  if (!data.length) {
    toast('Record a reviewer decision first, then export it.');
    return;
  }
  exportCSV('reviewlab-decisions.csv', data, [
    'id',
    'record_status',
    'decision',
    'reason_id',
    'reason',
    'policy_category',
    'note',
    'target_context',
    'priority',
    'timestamp',
    'source',
    'model',
    'model_version',
    'policy_version',
    'source_policy_effective_date',
    'policy_verified_on',
    'policy_source_url',
    'score',
    'capacity',
  ]);
}
function exportErrors() {
  const s = ReviewEngine.summarize(benchmark, bundle.selected, 0.1),
    chosen = new Set(s.selected.map((r) => r.id));
  const fp = s.selected.filter((r) => !r.label).slice(0, 50),
    fn = ReviewEngine.rank(benchmark, bundle.selected)
      .filter((r) => !chosen.has(r.id) && r.label === 1)
      .slice(0, 50);
  const data = [
    ...fp.map((r) => ({ ...r, error_type: 'false_positive' })),
    ...fn.map((r) => ({ ...r, error_type: 'false_negative' })),
  ].map((r) => ({
    id: r.id,
    text: r.text,
    toxicity: r.toxicity,
    label: r.label,
    score: r.scores[bundle.selected],
    error_type: r.error_type,
    reviewer_decision: '',
    reason: '',
    notes: '',
  }));
  exportCSV('reviewlab-error-review.csv', data, [
    'id',
    'text',
    'toxicity',
    'label',
    'score',
    'error_type',
    'reviewer_decision',
    'reason',
    'notes',
  ]);
  toast('Exported a diagnostic sample of 50 false positives and 50 false negatives.');
}
function restoreBenchmark() {
  rows = benchmark;
  source = 'benchmark';
  sourceName = 'Civil Comments · held-out test';
  model = bundle.selected;
  capacity = 0.1;
  filter = 'all';
  query = '';
  page = 0;
  selectedId = null;
}
function renderErrors() {
  $('#content').innerHTML =
    hero(
      'QUALITATIVE ERROR REVIEW',
      'Read beyond the score.',
      'Six real test errors and their original v2 interpretations. Use the current guide for new decisions.',
      'Historical v2 audit',
    ) +
    `<section class="panel panel-pad" style="margin-bottom:22px"><h2>Three labels. Three different questions.</h2><div class="body-copy"><p><strong>Reference label:</strong> did at least half the annotators mark the comment toxic? <strong>Model score:</strong> how did the trained model rank it? <strong>Policy decision:</strong> does the comment violate our review rubric, given its target and context?</p><p>Here, a false positive is a reference-negative comment inside the 992-item queue; a false negative is a reference-positive comment outside it. The last included score was <strong>${errorReview.queue_cutoff.toFixed(3)}</strong>. Scores are not severity ratings or calibrated violation probabilities.</p></div><div class="insight">These six cases were deliberately selected to illustrate different failures. They do not estimate how common each failure is. The interpretations and proposed decisions are an assistant audit, not independent human ground truth.</div></section>
    <div class="section-grid">${errorReview.cases.map((c, i) => `<article class="panel panel-pad error-case"><div class="panel-head"><div class="eyebrow">CASE ${String(i + 1).padStart(2, '0')} · ${c.error_type.replace('_', ' ').toUpperCase()}</div><span class="badge-neutral">Rank ${num(c.rank)}</span></div><h2>${esc(c.title)}</h2><blockquote>${esc(c.text)}</blockquote><div class="case-stats"><span>Model score <strong>${c.model_score.toFixed(3)}</strong></span><span>Human toxicity votes <strong>${pct(c.toxicity)}</strong></span></div><div class="body-copy"><p><strong>What the features show:</strong> ${esc(c.observed)}</p><p><strong>Likely failure:</strong> ${esc(c.interpretation)}</p></div><div class="case-decision"><span class="eyebrow">HISTORICAL V2 PROPOSAL</span><h3>${esc(c.recommended_decision)}</h3><p>${esc(c.reason)}</p></div><div class="body-copy"><p><strong>Original v2 reasoning:</strong> ${esc(c.rubric_change)}</p></div><button class="button soft inspect-case" data-case="${i}">Make your own decision →</button></article>`).join('')}</div>
    <section class="panel panel-pad"><div class="eyebrow">CURRENT GUIDANCE · V3</div><h2>Re-review the policy decision, preserve the benchmark.</h2><div class="body-copy"><p>These six proposals were made under our broader v2 toxicity rubric. They are not current TikTok enforcement labels. In particular, an insulting remark may require a different assessment for an adult public figure or a lower-severity case.</p><p>Use the source-linked v3 policy guide for new reviews. Ambiguous sarcasm involving harm still needs context. Recording a new decision keeps the previous decision in its history and leaves the original dataset label unchanged.</p></div><div class="actions-row"><a class="button primary" href="#policy">Read the current policy guide →</a><button id="download-error-review" class="button">Download historical six-case audit ↓</button></div></section>`;
  $$('.inspect-case').forEach(
    (b) =>
      (b.onclick = () => {
        const c = errorReview.cases[+b.dataset.case];
        restoreBenchmark();
        filter = c.error_type === 'false_negative' ? 'fn' : 'fp';
        showTruth = true;
        selectedId = c.id;
        const items = selectedItems();
        page = Math.floor(items.findIndex((r) => r.id === c.id) / 20);
        navigate('queue');
      }),
  );
  $('#download-error-review').onclick = () =>
    download(
      'reviewlab-error-review.json',
      JSON.stringify(errorReview, null, 2),
      'application/json',
    );
}
function updateNav() {
  $('#nav-count').textContent = num(Math.ceil(rows.length * capacity));
  $$('[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
    b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false');
  });
  $('#breadcrumb-view').textContent = {
    queue: 'Review queue',
    experiments: 'Experiment lab',
    errors: 'Error review',
    import: 'Import & score',
    method: 'Methodology',
    policy: 'Policy guide',
    pilot: 'TikTok results',
    models: 'Model choices',
  }[view];
}
function navigate(next) {
  view = [
    'queue',
    'experiments',
    'errors',
    'import',
    'method',
    'policy',
    'pilot',
    'models',
  ].includes(next)
    ? next
    : 'queue';
  location.hash = view;
  updateNav();
  ({
    queue: renderQueue,
    experiments: renderExperiments,
    errors: renderErrors,
    import: renderImport,
    method: renderMethod,
    policy: renderPolicy,
    pilot: renderPilot,
    models: renderModels,
  })[view]();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
$$('[data-view]').forEach(
  (b) =>
    (b.onclick = () => {
      if (engine) navigate(b.dataset.view);
    }),
);
$('#export-button').onclick = exportDecisions;
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1) || 'queue';
  if (engine && next !== view) navigate(next);
});
Promise.all(
  ['report', 'model', 'benchmark', 'error-review'].map((n) =>
    fetch(`data/${n}.json`).then((r) => {
      if (!r.ok) throw Error(`Could not load ${n}: HTTP ${r.status}`);
      return r.json();
    }),
  ),
)
  .then(([r, m, b, er]) => {
    report = r;
    bundle = m;
    benchmark = b;
    errorReview = er;
    engine = ReviewEngine.createEngine(m);
    restoreBenchmark();
    navigate(location.hash.slice(1) || 'queue');
  })
  .catch((e) => {
    $('#content').innerHTML =
      `<div class="loading"><h1>The workspace could not load.</h1><p>${esc(e.message)}</p><button class="button primary" onclick="location.reload()">Try again</button></div>`;
  });
