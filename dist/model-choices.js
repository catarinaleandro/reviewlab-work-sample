'use strict';

let inspectedModel = 'C';

function renderModels() {
  const plan = ReviewModelPlan;
  const run = ReviewContextRun;
  const comparison = run.validation_comparison;
  const current = plan.arms.find((arm) => arm.id === inspectedModel);
  const currentResult = comparison[current.id];
  const base = run.baseline_on_40;
  const cases = {
    A: 'At the live cutoff, the model missed a reply attacking someone’s face and a comment targeting religion and national origin.',
    B: 'The sewing-machine comment crossed the review cutoff. A comment quoting an insult directed at its author also crossed the cutoff.',
    C: 'The sewing-machine comment fell below the review cutoff when the model had the caption. The comment quoting an insult directed at its author still crossed the cutoff.',
  };
  // A measures Civil Comments toxicity. B and C share the TikTok training rows.
  const names = { A: 'Toxicity baseline', B: 'Comment only', C: 'Comment with context' };
  const cards = plan.arms
    .map(
      (arm) => `
    <article class="panel panel-pad model-card">
      <div class="panel-head"><span class="model-letter">${arm.id}</span><span class="badge-neutral">${arm.id === 'A' ? 'Live reference' : 'Trained offline'}</span></div>
      <h2>${names[arm.id]}</h2><p class="model-model">${esc(arm.model)}</p>
      <dl><dt>Input</dt><dd>${esc(arm.input)}</dd><dt>Training labels</dt><dd>${arm.id === 'A' ? 'Civil Comments toxicity' : 'Human-reviewed TikTok policy labels'}</dd></dl>
      <button class="button ${arm.id === inspectedModel ? 'primary' : ''} inspect-model" data-model="${arm.id}" aria-pressed="${arm.id === inspectedModel}">Inspect ${arm.id} · ${names[arm.id]}</button>
    </article>`,
    )
    .join('');
  const rows = plan.arms
    .map((arm) => {
      const result = comparison[arm.id];
      const metrics = result.validation;
      return `<tr><th scope="row">${arm.id} · ${names[arm.id]}</th>
      <td>${metrics.tp} / ${metrics.positives}</td><td>${metrics.fp} / ${metrics.negatives}</td>
      <td>${result.first_review_label === 'V' ? 'Violation' : 'Harmless'}</td>
      <td>${result.prior_100_false_flags_at_validation_cutoff} / 100</td></tr>`;
    })
    .join('');
  $('#content').innerHTML =
    hero(
      'TIKTOK MODEL EXPERIMENT',
      'Does context improve review?',
      'On ten validation comments, adding the caption and parent reply reduced false flags from four to one. Both models caught the two labelled violations.',
    ) +
    `
    <section class="panel panel-pad">
      <h2>Model comparison</h2>
      <p class="body-copy">We trained B and C on the same 26 comments, including eight violations. We reserved ten comments from different creators for validation. For each model, we chose the highest cutoff that caught both validation violations.</p>
      <div class="table-wrap"><table aria-label="Model comparison on validation and earlier pilot comments">
        <thead><tr><th scope="col">Model</th><th scope="col">Violations caught</th><th scope="col">False flags</th><th scope="col">First review slot</th><th scope="col">False flags on earlier pilot</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="body-copy">The first review slot represents a 10% budget on these ten comments. The final column applies the same validation cutoffs to the earlier 100 harmless comments. C cleared all five original false positives and flagged four other comments.</p>
      <div class="insight"><strong>Decision</strong> · Keep A in the live queue. Both validation violations concerned physical harm, and both helped determine the cutoffs. Later blind tests are summarized below.</div>
    </section>
    <section class="panel panel-pad"><h2>How the live model handled the new batch</h2>
      <p class="body-copy">The 40 comments included 26 harmless comments, ten violations, two cases needing context and two for policy review. At the existing cutoff of ${base.live_cutoff.toFixed(3)}, A caught ${base.resolved.tp} of ten violations and flagged ${base.resolved.fp} harmless comments. Three unresolved cases also crossed that cutoff.</p>
      <p class="body-copy">With four review slots, A selected three harmless comments and one policy-review case. Keyword rules selected two harmless comments and two policy-review cases. We deliberately sampled challenging language, so these counts describe this batch.</p>
    </section>
    <div class="model-cards">${cards}</div>
    <section class="panel panel-pad model-details" aria-live="polite">
      <h2>${current.id} · ${names[current.id]}</h2><p class="body-copy">${cases[current.id]}</p>
      <p class="body-copy">Validation cutoff ${currentResult.validation_cutoff.toFixed(3)}. Precision was ${currentResult.validation.tp} of ${currentResult.validation.tp + currentResult.validation.fp} flagged comments. The first review slot caught ${currentResult.top1_violations_caught} of two violations.</p>
      <details class="model-spec"><summary>Model and input settings</summary><div class="body-copy"><p>${esc(current.model)}. Input includes ${esc(current.input.toLowerCase())}.</p>
      ${current.id === 'A' ? '<p>The deployed cutoff was selected on the original Civil Comments validation set.</p>' : `<p>${esc(plan.training.framework)} · one epoch · seed 42 · batch size eight · ten pair-generation iterations. Both models started from the same BGE-small checkpoint.</p><p>Checkpoint revision <code>${esc(plan.base_model.revision)}</code>. The 512-token input preserves the comment and shortens context first.</p>`}</div></details>
    </section>
    <section class="panel panel-pad"><h2>What happened on fresh comments</h2>
      <p class="body-copy">In the first blind batch of 40, C raised six alerts. Five were false positives. It caught the sole labelled violation, which ranked fifth in a group of 16 with two review slots. One comment needed more context.</p>
      <p class="body-copy">A proposed rule gave one existing alert priority for possible physical harm. It improved the original replay. Across two subsequent 40-comment batches, the original and revised queues selected exactly the same cases at the fixed budgets. <a href="work-sample.html#decisions">See what it would take to advance each change</a> and <a href="work-sample.html#limitations">read the limitations</a>.</p>
      <div class="resource-links">${plan.sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a>`).join('')}</div>
    </section>
    <div class="actions-row"><button id="download-model-results" class="button primary">Download comparison</button><button id="download-model-plan" class="button">Download original experiment plan</button><a href="#pilot" class="button">Earlier pilot results</a></div>`;
  $$('.inspect-model').forEach((button) => {
    button.onclick = () => {
      inspectedModel = button.dataset.model;
      renderModels();
    };
  });
  $('#download-model-results').onclick = () =>
    download('reviewlab-context-results.json', JSON.stringify(run, null, 2), 'application/json');
  $('#download-model-plan').onclick = () =>
    download(
      'reviewlab-original-context-plan.json',
      JSON.stringify(plan, null, 2),
      'application/json',
    );
}
