"""Download the exact public encoder checkpoint; never upload comments or labels."""

import argparse, hashlib, json, os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--cache", type=Path, required=True)
    args = parser.parse_args()
    plan = json.loads((Path(__file__).parent / "context-experiment.json").read_text())[
        "base_model"
    ]
    os.environ.update(
        HF_HOME=str(args.cache.resolve()),
        HF_HUB_DISABLE_TELEMETRY="1",
        HF_HUB_DISABLE_IMPLICIT_TOKEN="1",
        HF_HUB_DISABLE_XET="1",
        DO_NOT_TRACK="1",
    )
    import truststore

    truststore.inject_into_ssl()
    from huggingface_hub import snapshot_download

    snapshot_download(
        repo_id=plan["id"],
        revision=plan["revision"],
        local_dir=str(args.output),
        token=False,
        allow_patterns=["*.json", "*.txt", "model.safetensors"],
        max_workers=2,
    )
    files = {
        str(p.relative_to(args.output)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in args.output.rglob("*")
        if p.is_file()
        and ".cache" not in p.parts
        and p.name != "reviewlab-checkpoint.json"
    }
    manifest = {"id": plan["id"], "revision": plan["revision"], "sha256": files}
    (args.output / "reviewlab-checkpoint.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(
        json.dumps(
            {
                "checkpoint": plan["id"],
                "revision": plan["revision"],
                "verified_files": len(files),
            }
        )
    )


if __name__ == "__main__":
    main()
