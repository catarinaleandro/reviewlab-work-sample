import requests, pathlib, concurrent.futures, hashlib, json

ROOT = pathlib.Path(__file__).resolve().parents[2] / "data"
ROOT.mkdir(exist_ok=True)
record = pathlib.Path(__file__).resolve().parents[1] / "dist" / "data" / "report.json"
if record.exists():
    revision = json.loads(record.read_text())["source"]["revision"]
else:
    meta = requests.get(
        "https://huggingface.co/api/datasets/google/civil_comments", timeout=30
    ).json()
    revision = meta["sha"]
files = requests.get(
    f"https://huggingface.co/api/datasets/google/civil_comments/tree/{revision}/data",
    timeout=30,
).json()


def fetch(f):
    path = ROOT / pathlib.Path(f["path"]).name
    if not path.exists() or path.stat().st_size != f["size"]:
        url = f"https://huggingface.co/datasets/google/civil_comments/resolve/{revision}/{f['path']}"
        with requests.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            with path.open("wb") as out:
                for chunk in r.iter_content(1024 * 1024):
                    out.write(chunk)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    print(f"Downloaded {path.name}: {path.stat().st_size:,} bytes", flush=True)
    return {"file": path.name, "sha256": digest, "bytes": path.stat().st_size}


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
    records = list(ex.map(fetch, files))
(ROOT / "source.json").write_text(
    json.dumps(
        {"dataset": "google/civil_comments", "revision": revision, "files": records},
        indent=2,
    )
)
