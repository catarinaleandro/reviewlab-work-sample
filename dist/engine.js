/* Faithful inference for exported scikit-learn TF-IDF + logistic regression. */
(function (root) {
  'use strict';
  function escapeRE(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function createEngine(bundle) {
    const learned = {};
    for (const [name, m] of Object.entries(bundle.models)) {
      learned[name] = {
        intercept: m.intercept,
        branches: m.branches.map((b) => ({ ...b, index: new Map(b.terms.map((t, i) => [t, i])) })),
      };
    }
    const rules = bundle.rules.map((r) => ({
      ...r,
      pattern: new RegExp('\\b(?:' + r.phrases.map(escapeRE).join('|') + ')\\b', 'gi'),
    }));
    // Match scikit-learn's word and character-within-word analyzers.
    // Only features present in the exported training vocabulary contribute.
    function grams(text, b) {
      const counts = new Map();
      const add = (g) => {
        if (b.index.has(g)) counts.set(g, (counts.get(g) || 0) + 1);
      };
      const lower = text.toLowerCase();
      if (b.kind === 'word') {
        const tokens = (lower.match(/[\p{L}\p{N}_]+/gu) || []).filter(
          (t) => Array.from(t).length >= 2,
        );
        for (let n = b.min_n; n <= b.max_n; n++)
          for (let i = 0; i <= tokens.length - n; i++) add(tokens.slice(i, i + n).join(' '));
      } else {
        const clean = lower.replace(/\s\s+/gu, ' ');
        for (const token of clean.trim().split(/\s+/u).filter(Boolean)) {
          const chars = Array.from(' ' + token + ' ');
          for (let n = b.min_n; n <= b.max_n; n++) {
            add(chars.slice(0, n).join(''));
            let offset = 0;
            while (offset + n < chars.length) {
              offset++;
              add(chars.slice(offset, offset + n).join(''));
            }
            if (offset === 0) break;
          }
        }
      }
      return counts;
    }
    // Normalize each TF-IDF branch independently before adding its coefficient
    // contributions to the logistic-regression intercept.
    function scoreModel(text, name, explain = false) {
      const model = learned[name];
      let z = model.intercept;
      const evidence = [];
      for (const b of model.branches) {
        let norm = 0;
        const weights = [];
        for (const [term, count] of grams(text, b)) {
          const i = b.index.get(term),
            weight = (1 + Math.log(count)) * b.idf[i];
          norm += weight * weight;
          weights.push([term, i, weight]);
        }
        norm = Math.sqrt(norm) || 1;
        for (const [term, i, w] of weights) {
          const contribution = (w / norm) * b.coef[i];
          z += contribution;
          if (explain && b.kind === 'word') evidence.push({ term, contribution });
        }
      }
      return {
        score: 1 / (1 + Math.exp(-z)),
        evidence: evidence
          .sort((a, b) => b.contribution - a.contribution)
          .filter((x) => x.contribution > 0)
          .slice(0, 6),
      };
    }
    function scoreRules(text) {
      let score = 0;
      const evidence = [];
      for (const r of rules) {
        r.pattern.lastIndex = 0;
        const terms = [...new Set((text.match(r.pattern) || []).map((x) => x.toLowerCase()))];
        score += terms.length * r.weight;
        if (terms.length) evidence.push({ name: r.name, terms, weight: r.weight });
      }
      return { score, evidence };
    }
    return {
      scoreModel,
      scoreRules,
      score(text) {
        return {
          word: scoreModel(text, 'word').score,
          word_char: scoreModel(text, 'word_char').score,
          rules: scoreRules(text).score,
        };
      },
    };
  }
  function parseCSV(text) {
    const rows = [];
    let row = [],
      field = '',
      quoted = false,
      afterQuote = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (c === '"') {
          quoted = false;
          afterQuote = true;
        } else field += c;
      } else if (c === '"') {
        if (field || afterQuote)
          throw new Error('Unexpected quote in CSV. Quote the entire field.');
        quoted = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
        afterQuote = false;
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
        field = '';
        afterQuote = false;
      } else {
        if (afterQuote && !/\s/.test(c))
          throw new Error('Unexpected characters after a quoted field.');
        if (!afterQuote) field += c;
      }
    }
    if (quoted) throw new Error('A quoted CSV field is not closed.');
    row.push(field);
    if (row.some((v) => v.trim())) rows.push(row);
    if (rows.length < 2) throw new Error('Add a header row and at least one comment.');
    const headers = rows.shift().map((h) => h.trim().toLowerCase());
    if (new Set(headers).size !== headers.length)
      throw new Error('CSV column names must be unique.');
    return rows.map((values, i) => {
      if (values.length !== headers.length)
        throw new Error(
          `CSV row ${i + 2} has ${values.length} fields; expected ${headers.length}.`,
        );
      return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
    });
  }
  // Stable IDs reproduce the offline evaluation when scores are tied.
  function rank(rows, key) {
    return [...rows].sort(
      (a, b) => b.scores[key] - a.scores[key] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  }
  function summarize(rows, key, fraction) {
    const k = Math.max(1, Math.ceil(rows.length * fraction)),
      selected = rank(rows, key).slice(0, k);
    const labelled = rows.every((r) => r.label === 0 || r.label === 1);
    if (!labelled) return { k, selected, labelled: false, n: rows.length };
    const p = rows.reduce((n, r) => n + r.label, 0),
      tp = selected.reduce((n, r) => n + r.label, 0),
      negative = rows.length - p;
    return {
      k,
      selected,
      labelled: true,
      n: rows.length,
      p,
      tp,
      fp: k - tp,
      fn: p - tp,
      precision: tp / k,
      recall: p ? tp / p : null,
      fpr: negative ? (k - tp) / negative : null,
    };
  }
  const api = { createEngine, parseCSV, rank, summarize };
  if (typeof module !== 'undefined') module.exports = api;
  else root.ReviewEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
