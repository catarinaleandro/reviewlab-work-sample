"""Reproduce the preregistered ReviewLab benchmark and export browser inference weights."""

import sys, os, json, re, math, hashlib, time, platform
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "python-packages"))
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
import sklearn
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    precision_recall_curve,
    brier_score_loss,
)
import joblib

DATA = Path(os.environ.get("REVIEWLAB_DATA", ROOT.parent / "data"))
OUT = ROOT / "dist" / "data"
OUT.mkdir(parents=True, exist_ok=True)
PROTO = json.loads((ROOT / "ml/protocol.json").read_text())
RULES = json.loads((ROOT / "ml/rules.json").read_text())
PATTERNS = [
    re.compile(r"\b(?:" + "|".join(re.escape(p) for p in r["phrases"]) + r")\b", re.I)
    for r in RULES
]


def normalize(t):
    return " ".join(re.findall(r"\w+", t.lower()))


def rule_score(t):
    return sum(
        r["weight"] * len(set(m.group(0).lower() for m in p.finditer(t)))
        for r, p in zip(RULES, PATTERNS)
    )


def hash_id(s):
    return hashlib.sha256(s.encode()).hexdigest()


def write(name, value):
    (OUT / name).write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    )


def sample_split(split, n, seed):
    files = sorted(DATA.glob(split + "-*.parquet"))
    counts = [pq.ParquetFile(f).metadata.num_rows for f in files]
    total = sum(counts)
    chosen = np.sort(
        np.random.default_rng(seed).choice(total, min(n, total), replace=False)
    )
    frames = []
    offset = 0
    for path in files:
        for batch in pq.ParquetFile(path).iter_batches(batch_size=30000):
            take = (
                chosen[(chosen >= offset) & (chosen < offset + batch.num_rows)] - offset
            )
            if len(take):
                frame = batch.take(take).to_pandas()
                frame["id"] = [hash_id(f"{split}:{offset + int(i)}") for i in take]
                frames.append(frame)
            offset += batch.num_rows
    return pd.concat(frames, ignore_index=True), total


def rank(scores, ids):
    return np.lexsort((np.asarray(ids), -np.asarray(scores)))


def metrics(y, scores, ids, fraction=0.1):
    k = max(1, math.ceil(len(y) * fraction))
    selected = rank(scores, ids)[:k]
    tp = int(y[selected].sum())
    p = int(y.sum())
    negatives = len(y) - p
    return {
        "capacity": fraction,
        "k": k,
        "tp": tp,
        "fp": k - tp,
        "fn": p - tp,
        "tn": negatives - k + tp,
        "precision": tp / k,
        "recall": tp / p if p else None,
        "fpr": (k - tp) / negatives if negatives else None,
    }


def threshold_metrics(y, scores, threshold):
    mask = scores >= threshold
    tp = int(y[mask].sum())
    fp = int(mask.sum()) - tp
    p = int(y.sum())
    return {
        "threshold": float(threshold),
        "reviewed": int(mask.sum()),
        "review_rate": float(mask.mean()),
        "tp": tp,
        "fp": fp,
        "fn": p - tp,
        "precision": tp / int(mask.sum()) if mask.sum() else None,
        "recall": tp / p if p else None,
    }


def feature_export(vectorizer, coefficients, kind):
    return {
        "kind": kind,
        "min_n": int(vectorizer.ngram_range[0]),
        "max_n": int(vectorizer.ngram_range[1]),
        "terms": vectorizer.get_feature_names_out().tolist(),
        "idf": vectorizer.idf_.tolist(),
        "coef": coefficients.tolist(),
    }


def main():
    start = time.time()
    seen = set()
    frames = {}
    audit = {}
    for i, (split, n) in enumerate(PROTO["sample_plan"].items()):
        frame, total = sample_split(split, n, 42 + i)
        before = len(frame)
        keep = []
        for t in frame.text:
            key = normalize(str(t))
            keep.append(bool(key) and key not in seen)
            if key:
                seen.add(key)
        frame = frame.loc[keep].reset_index(drop=True)
        frame["label"] = (frame.toxicity >= 0.5).astype(int)
        frames[split] = frame
        audit[split] = {
            "source_rows": total,
            "sampled": before,
            "retained": len(frame),
            "removed_empty_or_duplicate": before - len(frame),
            "positive": int(frame.label.sum()),
            "prevalence": float(frame.label.mean()),
            "sha256_of_ids": hash_id("|".join(frame.id)),
        }
        print(split, audit[split], flush=True)
    train, val, test = frames["train"], frames["validation"], frames["test"]
    word = TfidfVectorizer(
        ngram_range=(1, 2), max_features=30000, min_df=2, sublinear_tf=True
    )
    char = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        max_features=30000,
        min_df=3,
        sublinear_tf=True,
    )
    print("Fitting training vocabulary", flush=True)
    wt = word.fit_transform(train.text)
    wv = word.transform(val.text)
    ct = char.fit_transform(train.text)
    cv = char.transform(val.text)
    print("Training word and character models", flush=True)
    models = {}
    val_scores = {}
    validation = {}
    for name, xt, xv in [
        ("word", wt, wv),
        ("word_char", hstack([wt, ct]).tocsr(), hstack([wv, cv]).tocsr()),
    ]:
        m = LogisticRegression(C=2, solver="liblinear", max_iter=1000, random_state=42)
        m.fit(xt, train.label)
        s = m.predict_proba(xv)[:, 1]
        models[name] = m
        val_scores[name] = s
        validation[name] = {
            "at_10": metrics(val.label.to_numpy(), s, val.id),
            "average_precision": float(average_precision_score(val.label, s)),
        }
        print("Validation", name, validation[name], flush=True)
    selected = max(
        models,
        key=lambda name: (
            validation[name]["at_10"]["recall"],
            validation[name]["average_precision"],
        ),
    )
    threshold = float(
        val_scores[selected][
            rank(val_scores[selected], val.id)[math.ceil(len(val) * 0.1) - 1]
        ]
    )
    selection = {
        "selected_model": selected,
        "selection_set": "validation",
        "validation": validation,
        "threshold": threshold,
    }
    write("selection.json", selection)
    print("Selection frozen:", selection, flush=True)
    # Only after freezing model choice do we score the held-out test split.
    wtest = word.transform(test.text)
    ctest = char.transform(test.text)
    y = test.label.to_numpy()
    ids = test.id.to_numpy()
    scores = {
        "random": np.array(
            [int(hash_id("random:" + i)[:12], 16) / 16**12 for i in ids]
        ),
        "rules": np.array([rule_score(t) for t in test.text], dtype=float),
    }
    latency = {}
    for name, xt in [("word", wtest), ("word_char", hstack([wtest, ctest]).tocsr())]:
        tick = time.perf_counter()
        scores[name] = models[name].predict_proba(xt)[:, 1]
        latency[name] = {
            "prediction_ms_per_1000_excludes_vectorization": (
                time.perf_counter() - tick
            )
            * 1000
            * 1000
            / len(test)
        }
    report = {
        "title": "ReviewLab · Phase 1 benchmark",
        "date": "2026-11-06",
        "protocol": PROTO,
        "source": json.loads((DATA / "source.json").read_text()),
        "audit": audit,
        "selection": selection,
        "models": {},
        "runtime": {
            "python": platform.python_version(),
            "sklearn": sklearn.__version__,
            "numpy": np.__version__,
        },
        "limitations": [
            "This is a sampled Civil Comments benchmark, not TikTok evaluation.",
            "The mirror lacks thread/video identifiers. Official splits and normalized deduplication reduce but do not eliminate leakage.",
            "No full fuzzy near-duplicate audit has been completed.",
            "Scores are model estimates, not calibrated violation probabilities or severity measures.",
            "Threat counts may be too small to assess safety reliably.",
            "Identity-term slices are lexical diagnostics, not demographic or fairness certification.",
            "No independent human relabelling, reviewer usability study, or measured operational benefit has been completed.",
            "Feedback is stored on this browser only and is never automatically used for training.",
        ],
    }
    for name, s in scores.items():
        precision, recall, _ = precision_recall_curve(y, s)
        ix = np.unique(
            np.linspace(0, len(precision) - 1, min(100, len(precision))).astype(int)
        )
        report["models"][name] = {
            "average_precision": float(average_precision_score(y, s)),
            "capacity": [metrics(y, s, ids, c) for c in [0.05, 0.1, 0.2]],
            "curve": [
                {"recall": float(recall[i]), "precision": float(precision[i])}
                for i in ix
            ],
        }
    report["threshold_evaluation"] = threshold_metrics(y, scores[selected], threshold)
    report["latency"] = latency
    # Paired bootstrap: shared resampled rows and a fresh top-k selection per resample.
    rng = np.random.default_rng(4200)
    deltas = []
    for _ in range(500):
        ix = rng.integers(0, len(y), len(y))
        yy = y[ix]
        a = metrics(yy, scores[selected][ix], ids[ix])["recall"]
        b = metrics(yy, scores["rules"][ix], ids[ix])["recall"]
        if a is not None and b is not None:
            deltas.append(a - b)
    ci = np.quantile(deltas, [0.025, 0.975]).tolist()
    a = report["models"][selected]["capacity"][1]
    b = report["models"]["rules"]["capacity"][1]
    report["comparison"] = {
        "recall_difference": a["recall"] - b["recall"],
        "recall_difference_ci95": ci,
        "additional_toxic_captured": a["tp"] - b["tp"],
        "relative_capture_lift": a["tp"] / b["tp"] - 1 if b["tp"] else None,
        "statistical_target_met": bool(
            b["tp"] and a["tp"] / b["tp"] >= 1.1 and ci[0] > 0
        ),
        "pilot_ready": False,
    }
    # Diagnostics use the same global review queue; denominators are explicit.
    masks = {
        "Identity-term mentions": test.text.str.contains(
            r"\b(?:gay|lesbian|transgender|muslim|jewish|christian|black|white|women|men)\b",
            case=False,
            regex=True,
        ).to_numpy(),
        "Very short comments (≤ 5 words)": test.text.map(
            lambda t: len(t.split()) <= 5
        ).to_numpy(),
        "Quoted text markers": test.text.str.contains('["“”]').to_numpy(),
        "Mixed annotator ratings (0.3–0.7)": (
            (test.toxicity >= 0.3) & (test.toxicity <= 0.7)
        ).to_numpy(),
    }
    report["slices"] = []
    for title, mask in masks.items():
        row = {
            "name": title,
            "n": int(mask.sum()),
            "positive": int(y[mask].sum()),
            "negative": int((1 - y[mask]).sum()),
            "models": {},
        }
        for name in ["rules", selected]:
            chosen = np.zeros(len(y), dtype=bool)
            chosen[rank(scores[name], ids)[: math.ceil(len(y) * 0.1)]] = True
            pos = mask & (y == 1)
            neg = mask & (y == 0)
            row["models"][name] = {
                "recall": float(chosen[pos].mean()) if pos.sum() else None,
                "fpr": float(chosen[neg].mean()) if neg.sum() else None,
            }
        report["slices"].append(row)
    report["categories"] = []
    for field in ["threat", "insult", "identity_attack", "severe_toxicity"]:
        mask = (test[field] >= 0.5).to_numpy()
        row = {"category": field, "positive": int(mask.sum()), "capture": {}}
        for name in ["rules", selected]:
            chosen = np.zeros(len(y), dtype=bool)
            chosen[rank(scores[name], ids)[: math.ceil(len(y) * 0.1)]] = True
            row["capture"][name] = {
                "caught": int((chosen & mask).sum()),
                "recall": float(chosen[mask].mean()) if mask.sum() else None,
            }
        report["categories"].append(row)
    report["runtime"]["total_seconds"] = round(time.time() - start, 1)
    write("report.json", report)
    # Export both learned models, retaining full precision for inference parity.
    learned = {}
    for name, m in models.items():
        branches = [feature_export(word, m.coef_[0, : wt.shape[1]], "word")]
        if name == "word_char":
            branches.append(feature_export(char, m.coef_[0, wt.shape[1] :], "char_wb"))
        learned[name] = {"intercept": float(m.intercept_[0]), "branches": branches}
    write(
        "model.json",
        {
            "version": "civil-60k-v1",
            "selected": selected,
            "threshold": threshold,
            "rules": RULES,
            "models": learned,
        },
    )
    rows = []
    for i, row in test.iterrows():
        rows.append(
            {
                "id": row.id,
                "text": row.text,
                "toxicity": float(row.toxicity),
                "label": int(row.label),
                "threat": float(row.threat),
                "insult": float(row.insult),
                "identity_attack": float(row.identity_attack),
                "scores": {name: float(s[i]) for name, s in scores.items()},
            }
        )
    write("benchmark.json", rows)
    reference_ix = np.random.default_rng(9).choice(len(rows), 100, replace=False)
    reference = [
        {"text": rows[i]["text"], "scores": rows[i]["scores"]} for i in reference_ix
    ]
    edge = [
        "İstanbul is beautiful",
        "ß １２ é café_99",
        "bad\t\n    word",
        "a",
        "",
        "🙂😅 That was sick!!!",
        "fuuuuuck",
        "don’t say that",
        'This is a quote: "you idiot".',
    ]
    for t in edge:
        ww = word.transform([t])
        cc = char.transform([t])
        reference.append(
            {
                "text": t,
                "scores": {
                    "word": float(models["word"].predict_proba(ww)[0, 1]),
                    "word_char": float(
                        models["word_char"].predict_proba(hstack([ww, cc]).tocsr())[
                            0, 1
                        ]
                    ),
                    "rules": rule_score(t),
                },
            }
        )
    (ROOT / "ml/parity_reference.json").write_text(
        json.dumps(reference, ensure_ascii=False)
    )
    joblib.dump(
        {"word": word, "char": char, "models": models, "selection": selection},
        ROOT / "ml/model.joblib",
    )
    for split, frame in frames.items():
        frame[["id", "text", "toxicity", "label"]].to_parquet(
            DATA / f"sampled-{split}.parquet", index=False
        )
    print(
        "Complete:",
        json.dumps(
            {
                "selected": selected,
                "comparison": report["comparison"],
                "test": audit["test"],
            }
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
