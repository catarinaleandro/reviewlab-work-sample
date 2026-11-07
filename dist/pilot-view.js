'use strict';
let pilotMode = 'threshold';
function renderPilot() {
  const p = ReviewPilot,
    threshold = pilotMode === 'threshold',
    s = threshold ? p.fixed_threshold : p.fixed_capacity.methods.word_char;
  const cases = p.cases.filter((c) => s.selected_ids.includes(c.id));
  const score = (c) => c.score.toFixed(3);
  $('#content').innerHTML =
    hero(
      'TIKTOK PILOT · HUMAN LABELS',
      'What did the model overflag?',
      '100 comments reviewed by Catarina. Every final decision was No violation under our scoped rubric.',
      'Single-reviewer calibration',
    ) +
    `<section class="panel panel-pad pilot-controls"><div><div class="eyebrow">TWO DIFFERENT OPERATING MODES</div><h2>Choose the question.</h2></div><div class="pilot-toggle" role="group" aria-label="Pilot evaluation mode"><button class="button ${threshold ? 'primary' : ''}" id="pilot-threshold" aria-pressed="${threshold}">Frozen score cutoff</button><button class="button ${!threshold ? 'primary' : ''}" id="pilot-capacity" aria-pressed="${!threshold}">Fixed top-10 queue</button></div><p class="body-copy">${threshold ? `Flag when the selected model’s score is at least <strong>${p.fixed_threshold.value.toFixed(3)}</strong>. This cutoff came from Civil Comments validation and was not tuned on these comments.` : 'Select the ten highest-ranked comments, even when scores are low. Queue membership is a review allocation, not a prediction that a comment violates policy.'}</p></section>
    <div class="metrics">
      ${metric(threshold ? 'Comments flagged' : 'Comments selected', num(s.flagged), `${pct(s.review_rate, 0)} of the 100-comment sample`, false, '▤')}
      ${metric('False positives', num(s.fp), `${pct(s.false_positive_rate, 0)} of human-labelled non-violations`, true, '↗')}
      ${metric('Review precision', pct(s.precision, 0), `${s.tp} confirmed violations / ${s.flagged} ${threshold ? 'flags' : 'selected reviews'}`, false, '◎')}
      ${metric('Violation recall', 'Not measurable', 'No violation-labelled examples in this batch', false, '—')}
    </div>
    <section class="panel panel-pad pilot-result"><div class="panel-head"><h2>${s.fp} unnecessary ${threshold ? 'flags' : 'review selections'} in this sample</h2><span class="badge-neutral">${s.tn} non-violations ${threshold ? 'unflagged' : 'outside the queue'}</span></div><div class="pilot-bar" role="img" aria-label="${s.fp} non-violations selected and ${s.tn} non-violations unselected out of 100"><span style="width:${s.flagged}%"></span></div><p class="body-copy">A false positive here means a comment ${threshold ? 'above the frozen cutoff' : 'inside the review queue'} that you labelled No violation. These are disagreements with our TikTok-aligned rubric; the model was trained to predict general Civil Comments toxicity.</p><div class="insight">There are <strong>zero positive labels</strong>. A missed-violation count of zero does not establish that the model detects violations. Recall stays unavailable.</div></section>
    <div class="panel-head pilot-section-head"><div><div class="eyebrow">SELECTED MODEL · WORD + CHARACTER TF-IDF</div><h2>${threshold ? 'The five cutoff false positives' : 'The ten queue false positives'}</h2></div><span class="badge-neutral">Human decision: No violation</span></div>
    <p class="help-text pilot-explanation">Summaries below are paraphrases of the archived comments. Word contributions are observed model evidence; the contextual explanations are interpretations. Character features and other contributions also affect the full score.</p>
    <div class="section-grid pilot-cases">${cases.map((c) => `<article class="panel panel-pad"><div class="panel-head"><span class="eyebrow">${esc(c.id)} · RANK ${c.rank}</span><span class="score">${score(c)}</span></div><h3>${esc(c.summary)}</h3><p class="help-text">Caption context: ${esc(c.context)}</p><p class="body-copy"><strong>Review interpretation:</strong> ${esc(c.interpretation)}</p><div class="evidence-list">${c.positive_word_features.map((f) => `<span class="evidence-chip">${esc(f.term)} · +${f.contribution.toFixed(3)}</span>`).join('')}</div><p class="help-text">Positive word contributions to the model’s logit, not violation probabilities.</p><span class="policy-label ${c.above_frozen_cutoff ? 'violation' : 'context'}">${c.above_frozen_cutoff ? 'Above the frozen cutoff' : 'Queue only · below the cutoff'}</span></article>`).join('')}</div>
    <section class="panel pilot-comparison"><div class="queue-header"><h2>Equal workload: ten reviews each</h2><span class="badge-neutral">Fixed 10% capacity</span></div><div class="table-wrap"><table><thead><tr><th>Approach</th><th>Selected</th><th>False positives</th><th>Precision</th><th>Recall</th></tr></thead><tbody>${[
      'word_char',
      'word',
      'rules',
    ]
      .map((key) => {
        const m = p.fixed_capacity.methods[key];
        return `<tr><td><strong>${names[key]}</strong></td><td>${m.flagged}</td><td>${m.fp}</td><td>${pct(m.precision, 0)}</td><td>Not measurable</td></tr>`;
      })
      .join(
        '',
      )}</tbody></table></div><p class="experiment-note">All 100 rule scores are zero. The rules’ top ten are chosen entirely by the deterministic tie-break. Requiring any rule match would flag zero comments, but that uses a different workload. This all-negative batch cannot establish a model winner.</p></section>
    <div class="section-grid"><section class="panel panel-pad"><div class="eyebrow">LABEL AND DATA PROVENANCE</div><h2>What this result is based on</h2><div class="body-copy"><p><strong>100 reviewed · 100 No violation · 0 unresolved.</strong> ${esc(p.provenance.review_method)}</p><p>${p.provenance.videos} videos across ${p.provenance.source_topics} source topics. ${esc(p.provenance.sampling)}</p><p>${esc(p.provenance.model_input)} The archive was collected ${esc(p.provenance.collection_period)}.</p><p>Model: ${esc(p.model_id)}. Policy: ${esc(p.policy_version)}. Evaluated ${esc(p.evaluated_on)}.</p></div><div class="resource-links"><a href="${esc(p.provenance.source_url)}" target="_blank" rel="noopener">Crawlora dataset and provenance ↗</a><a href="#policy">Review rubric ↗</a></div></section>
    <section class="panel panel-pad"><div class="eyebrow">PRODUCT IMPLICATION</div><h2>Test context sensitivity next.</h2><div class="body-copy"><p>Profanity used as praise, literal tool/pest language and frustration about an object produced policy false positives. Investigate these patterns on fresh development examples before changing the model.</p><p>The model and cutoff remain frozen. Independent second review, broader sampling and evaluation with confirmed violations remain future work.</p><p>This is a calibration result from a narrow, single-reviewer sample. It is separate from the held-out Civil Comments benchmark.</p></div><div class="actions-row"><a class="button soft" href="#models">Compare the next model choices →</a><a href="#experiments">Original benchmark ↗</a></div></section></div>
    <div class="actions-row"><button class="button primary" id="download-pilot">Download pilot results ↓</button></div>`;
  $('#pilot-threshold').onclick = () => {
    pilotMode = 'threshold';
    renderPilot();
  };
  $('#pilot-capacity').onclick = () => {
    pilotMode = 'capacity';
    renderPilot();
  };
  $('#download-pilot').onclick = () =>
    download(
      'reviewlab-tiktok-human-evaluation.json',
      JSON.stringify(p, null, 2),
      'application/json',
    );
}
