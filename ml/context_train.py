"""Explicit B/C training, with separate software smoke mode and no automatic release.

Dataset JSON: {"rows": [{"id", "comment", "caption", "parent", "group_id",
"family_id", "split", "human_decision", "reviewer", "label_status",
"policy_version", "source_kind"}]}. Splits are assigned upstream by group.
"""
import argparse, hashlib, json, os, re, time
from pathlib import Path
from collections import Counter

HERE = Path(__file__).resolve().parent
PLAN = json.loads((HERE / "context-experiment.json").read_text())
DECISIONS = {"No violation": 0, "Violation": 1}

def validate_rows(rows):
    """Validate labels and leakage before importing a model or starting training."""
    if not rows:
        raise ValueError("No rows supplied")
    ids, groups, families, duplicates = set(), {}, {}, {}
    for row in rows:
        required = ("id", "comment", "group_id", "family_id", "split", "human_decision", "reviewer", "label_status", "policy_version", "source_kind")
        if any(not isinstance(row.get(k), str) or not row[k].strip() for k in required):
            raise ValueError("Every row requires non-empty metadata, a comment and reviewer attribution")
        if row["id"] in ids:
            raise ValueError("Duplicate row ID: " + row["id"])
        ids.add(row["id"])
        if row["split"] not in {"train", "validation", "regression"}:
            raise ValueError("Training accepts only train/validation/regression; keep locked test data in a separate file")
        if row["label_status"] != "human_confirmed" or row["policy_version"] != PLAN["policy_version"]:
            raise ValueError("Unconfirmed labels or mismatched policy version")
        if row["source_kind"] not in {"real", "synthetic"}:
            raise ValueError("Source kind must be real or synthetic")
        if row["source_kind"] != "real" and row["split"] != "regression":
            raise ValueError("Synthetic cases belong in the separate regression set")
        if row["human_decision"] not in {*DECISIONS, "Escalate", "Policy review"}:
            raise ValueError("Unknown reviewer decision")
        for name in ("caption", "parent"):
            if row.get(name) is not None and not isinstance(row[name], str):
                raise ValueError("Context fields must be strings or null")
        normalized = " ".join(re.findall(r"\w+", row["comment"].lower()))
        for registry, key in ((groups, row["group_id"]), (families, row["family_id"]), (duplicates, normalized)):
            prior = registry.setdefault(key, row["split"])
            if prior != row["split"]:
                raise ValueError("Conversation, family or normalized duplicate spans splits")
    counts = {split: Counter(r["human_decision"] for r in rows if r["split"] == split and r["human_decision"] in DECISIONS) for split in ("train", "validation")}
    for split, minimum in (("train", 8), ("validation", 2)):
        if any(counts[split][label] < minimum for label in DECISIONS):
            raise ValueError(f"{split} requires both classes (at least {minimum} each as a software floor, not evidence of adequate sample size)")
    return counts

def serialize(row, arm, tokenizer, limit=512):
    """Preserve the comment; bound context and record discarded tokens."""
    if arm not in {"B", "C"}:
        raise ValueError("Choose B or C")
    comment = row["comment"].strip()
    caption = (row.get("caption") or "").strip()
    parent = (row.get("parent") or "").strip()
    count = lambda text: len(tokenizer.encode(text, add_special_tokens=True))
    if arm == "B":
        text = "COMMENT:\n" + comment
        if count(text) > limit:
            raise ValueError("Full comment exceeds token limit; manual handling required")
        return text, {"tokens": count(text), "context_truncated": False, "caption_missing": not caption, "parent_missing": not parent}
    cap_ids = tokenizer.encode(caption, add_special_tokens=False)
    par_ids = tokenizer.encode(parent, add_special_tokens=False)
    original = (len(cap_ids), len(par_ids))
    render = lambda: "COMMENT:\n" + comment + "\nCAPTION:\n" + (tokenizer.decode(cap_ids) if cap_ids else "[missing or omitted]") + "\nPARENT REPLY:\n" + (tokenizer.decode(par_ids) if par_ids else "[missing or omitted]")
    # Bound to the final tokenizer count, including field headers and markers.
    while count(render()) > limit:
        if not cap_ids and not par_ids:
            raise ValueError("Full comment plus field markers exceeds token limit; manual handling required")
        target = cap_ids if len(cap_ids) >= len(par_ids) else par_ids
        del target[-min(16, len(target)):]
    text = render()
    return text, {"tokens": count(text), "context_truncated": original != (len(cap_ids), len(par_ids)), "caption_missing": not caption, "parent_missing": not parent}

def threshold_for_recall(labels, scores, target):
    if not 0 < target <= 1:
        raise ValueError("Recall target must be in (0,1]")
    positives = sum(labels)
    if not positives:
        raise ValueError("Cannot select a recall threshold without violations")
    candidates = sorted(set(float(x) for x in scores), reverse=True)
    return next(t for t in candidates if sum(y for y,s in zip(labels,scores) if s >= t) / positives >= target)

def metrics(labels, scores, cutoff):
    tp = sum(y == 1 and s >= cutoff for y,s in zip(labels,scores))
    fp = sum(y == 0 and s >= cutoff for y,s in zip(labels,scores))
    p, n = sum(labels), len(labels)-sum(labels)
    return {"n":len(labels),"positives":p,"negatives":n,"tp":tp,"fp":fp,"fn":p-tp,"tn":n-fp,"precision":tp/(tp+fp) if tp+fp else None,"recall":tp/p if p else None,"fpr":fp/n if n else None,"review_rate":(tp+fp)/len(labels) if labels else None}

def fixture_rows():
    # An unrelated, invented topic task verifies code execution only. These labels
    # are NOT moderation labels and this model cannot be used for policy scoring.
    groups = [
        (0, "The roses need watering.", "Garden care", "How are the flowers doing?"),
        (0, "The tomato plants are growing.", "Vegetable garden", "What are you planting?"),
        (0, "I planted new sunflower seeds.", "Growing flowers", "What did you do today?"),
        (0, "The soil is ready for the seeds.", "Spring gardening", "Is the bed ready?"),
        (1, "The guitar needs tuning.", "Music practice", "How is the instrument?"),
        (1, "I learned a new piano chord.", "Piano lesson", "What are you practicing?"),
        (1, "The drummer played a steady rhythm.", "Band rehearsal", "How did practice go?"),
        (1, "The violin melody sounds beautiful.", "Orchestra practice", "What are you listening to?")
    ]
    return [{"id":f"fixture-{i}","label":y,"comment":c,"caption":cap,"parent":par} for i,(y,c,cap,par) in enumerate(groups)]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data",type=Path)
    parser.add_argument("--base",type=Path,required=True,help="Local pinned checkpoint directory")
    parser.add_argument("--output",type=Path,required=True)
    parser.add_argument("--cache",type=Path,required=True)
    parser.add_argument("--smoke",action="store_true",help="Unrelated synthetic topic fixture; never a moderation model")
    args=parser.parse_args()
    if args.output.exists():
        parser.error("Use a new output directory to preserve experiment history")
    source_bytes = args.data.read_bytes() if args.data and not args.smoke else b"software-fixture-garden-music-v1"
    rows=fixture_rows() if args.smoke else json.loads(source_bytes)["rows"]
    if not args.smoke:
        validate_rows(rows)
    manifest=json.loads((args.base/"reviewlab-checkpoint.json").read_text())
    if manifest.get("revision") != PLAN["base_model"]["revision"] or manifest.get("id") != PLAN["base_model"]["id"]:
        raise ValueError("Base checkpoint does not match the pinned experiment")
    for relative,expected in manifest["sha256"].items():
        if hashlib.sha256((args.base/relative).read_bytes()).hexdigest()!=expected:
            raise ValueError("Base checkpoint file changed: "+relative)
    os.environ.update(HF_HOME=str(args.cache.resolve()),HF_HUB_OFFLINE="1",HF_HUB_DISABLE_TELEMETRY="1",DO_NOT_TRACK="1",TOKENIZERS_PARALLELISM="false")
    import numpy as np
    import torch
    from datasets import Dataset
    from setfit import SetFitModel, Trainer, TrainingArguments
    from sklearn.linear_model import LogisticRegression
    torch.set_num_threads(2)
    args.output.mkdir(parents=True)
    result={"experiment":PLAN["version"],"status":"SOFTWARE_FIXTURE_ONLY_NOT_MODERATION" if args.smoke else "TRAINED_CANDIDATES_NOT_EVALUATED_ON_LOCKED_TEST", "data_sha256":hashlib.sha256(source_bytes).hexdigest(),"base":manifest,"arms":{},"production_ready":False}
    for arm in ("B","C"):
        torch.manual_seed(42);np.random.seed(42)
        model=SetFitModel.from_pretrained(str(args.base),local_files_only=True,device="cpu")
        model.model_head=LogisticRegression(C=1,max_iter=1000,random_state=42)
        tokenizer=model.model_body.tokenizer
        # Reject mismatched input eligibility so B and C cannot use different cohorts.
        train=[r for r in rows if args.smoke or (r["split"]=="train" and r["human_decision"] in DECISIONS)]
        val=[] if args.smoke else [r for r in rows if r["split"]=="validation" and r["human_decision"] in DECISIONS]
        for row in train+val:
            for choice in ("B","C"): serialize(row,choice,tokenizer)
        encode=lambda group:[serialize(r,arm,tokenizer)[0] for r in group]
        label=lambda r:r["label"] if args.smoke else DECISIONS[r["human_decision"]]
        training=Dataset.from_dict({"text":encode(train),"label":[label(r) for r in train]})
        config=TrainingArguments(output_dir=str(args.output/arm/"checkpoints"),batch_size=8,num_epochs=1,num_iterations=2 if args.smoke else 10,max_steps=2 if args.smoke else -1,body_learning_rate=2e-5,seed=42,max_length=512,report_to="none",save_strategy="no",show_progress_bar=False,use_amp=False)
        started=time.perf_counter()
        Trainer(model=model,args=config,train_dataset=training).train()
        model.save_pretrained(str(args.output/arm/"model"))
        predicted=np.asarray(model.predict_proba(encode(train if args.smoke else val),as_numpy=True))
        assert predicted.shape==(len(train if args.smoke else val),2) and np.isfinite(predicted).all()
        record={"train_ids":[r["id"] for r in train],"validation_ids":[r["id"] for r in val],"training_seconds":time.perf_counter()-started,"input_audit":[{"id":r["id"],**serialize(r,arm,tokenizer)[1]} for r in train+val]}
        if args.smoke:
            record.update(prediction_shape=list(predicted.shape),finite_predictions=True,performance_claim=None)
        else:
            ys=[label(r) for r in val];scores=predicted[:,1].tolist()
            threshold=threshold_for_recall(ys,scores,PLAN["evaluation"]["target_recall"])
            record.update(threshold=threshold,validation_metrics=metrics(ys,scores,threshold),validation_scores=[{"id":r["id"],"label":y,"score":s} for r,y,s in zip(val,ys,scores)])
        result["arms"][arm]=record
        (args.output/"run.json").write_text(json.dumps(result,indent=2)+"\n")
    assert result["arms"]["B"]["train_ids"]==result["arms"]["C"]["train_ids"]
    print(json.dumps({"status":result["status"],"arms":list(result["arms"]),"output":str(args.output),"production_ready":False}))

if __name__=="__main__": main()
