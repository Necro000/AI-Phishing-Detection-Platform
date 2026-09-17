#!/usr/bin/env python3
"""
train_model.py — Day 1, Track B
Offline, one-time training script. NOT run in production.

Dataset: PhiUSIIL Phishing URL Dataset
Source: UCI ML Repository
URL: https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset
Citation: Prasad Patil, Bhanu, et al. (2023). PhiUSIIL Phishing URL (Website) Dataset.
          UCI Machine Learning Repository. https://doi.org/10.24432/C5GW2T

Outputs:
  - lib/ml/weights.json  (committed static artifact, used by infer.ts at runtime)

Architecture.md §7: logistic regression over a small hand-picked feature set.
Feature set MUST match features.ts exactly — write Python first, port to TS.
"""

import re
import math
import json
import os
import hashlib
import urllib.parse
import urllib.request
import zipfile
import io
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# ─────────────────────────────────────────────────────────────────────────────
# 0. Paths
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
WEIGHTS_OUT = REPO_ROOT / "lib" / "ml" / "weights.json"
DATA_DIR = SCRIPT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Suspicious keywords (must match categories.ts / emailRules defaults)
# ─────────────────────────────────────────────────────────────────────────────
SUSPICIOUS_KEYWORDS = [
    "verify", "account", "suspended", "password", "credentials",
    "login", "signin", "secure", "update", "confirm",
    "banking", "paypal", "amazon", "apple", "microsoft",
    "prize", "winner", "free", "urgent", "alert",
    "limited", "expire", "immediately", "click", "validate",
    "unusual", "activity", "security", "notification", "member",
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. Feature extraction
#    CRITICAL: This function must be ported IDENTICALLY to lib/ml/features.ts
#    Feature order is frozen once weights.json is committed.
# ─────────────────────────────────────────────────────────────────────────────

def extract_features(url: str) -> list[float] | None:
    """
    Extract the 7-feature vector for a URL.
    Returns None if the URL is unparsable (caller should skip/mark as null).

    Feature vector (index order is frozen — matches features.ts):
      0: url_length          — total character count (normalized by /100)
      1: subdomain_count     — number of dots in the host minus 1 (clamped 0–10)
      2: has_ip_host         — 1.0 if host is an IPv4 literal, 0.0 otherwise
      3: has_at_symbol       — 1.0 if '@' appears in the URL, 0.0 otherwise
      4: has_https           — 1.0 if scheme is https, 0.0 otherwise
      5: suspicious_kw_count — count of suspicious keywords in lowercased URL (clamped 0–10)
      6: domain_entropy      — Shannon entropy of the hostname string (0–log2(26) ≈ 4.7)
    """
    url = url.strip()
    if not url:
        return None

    # Normalize: add https:// if no scheme (Edge-Cases.md: no protocol given)
    if not url.startswith(("http://", "https://", "ftp://")):
        url = "https://" + url

    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.hostname or ""
        if not host:
            return None
    except Exception:
        return None

    # Feature 0: URL length, normalized
    url_length = len(url) / 100.0

    # Feature 1: subdomain count
    # host parts: "a.b.c.com" → 4 dots? No: "a.b.c.com".split('.') = ['a','b','c','com'] → len=4
    # subdomains = parts - 2 (TLD + domain), clamped to [0, 10]
    host_parts = host.split(".")
    subdomain_count = max(0, len(host_parts) - 2)
    subdomain_count = min(subdomain_count, 10)

    # Feature 2: IP-literal host
    ip_pattern = re.compile(
        r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$"
    )
    has_ip_host = 0.0
    m = ip_pattern.match(host)
    if m and all(0 <= int(g) <= 255 for g in m.groups()):
        has_ip_host = 1.0

    # Feature 3: @ symbol in URL
    has_at_symbol = 1.0 if "@" in url else 0.0

    # Feature 4: HTTPS
    has_https = 1.0 if parsed.scheme == "https" else 0.0

    # Feature 5: suspicious keyword count
    url_lower = url.lower()
    kw_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)
    suspicious_kw_count = min(kw_count, 10)

    # Feature 6: Shannon entropy of hostname
    if host:
        freq: dict[str, int] = {}
        for c in host:
            freq[c] = freq.get(c, 0) + 1
        entropy = -sum((f / len(host)) * math.log2(f / len(host)) for f in freq.values() if f > 0)
    else:
        entropy = 0.0

    return [
        url_length,
        float(subdomain_count),
        has_ip_host,
        has_at_symbol,
        has_https,
        float(suspicious_kw_count),
        entropy,
    ]

FEATURE_NAMES = [
    "url_length",
    "subdomain_count",
    "has_ip_host",
    "has_at_symbol",
    "has_https",
    "suspicious_kw_count",
    "domain_entropy",
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. Dataset loading
#    PhiUSIIL dataset — CSV with columns: URL, label (0=legit, 1=phishing)
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset() -> pd.DataFrame:
    """
    Download and cache the PhiUSIIL dataset from UCI ML Repository.
    Falls back to a locally cached copy if network is unavailable.
    """
    local_csv = DATA_DIR / "phiusiil_dataset.csv"

    if local_csv.exists():
        print(f"[dataset] Using cached file: {local_csv}")
        df = pd.read_csv(local_csv)
        return df

    print("[dataset] Downloading PhiUSIIL Phishing URL Dataset from UCI ML Repository...")
    # UCI dataset download URL (direct CSV link)
    # The dataset has ~235k rows, ~88MB compressed
    dataset_url = "https://archive.ics.uci.edu/static/public/967/phiusiil+phishing+url+dataset.zip"

    try:
        req = urllib.request.Request(
            dataset_url,
            headers={"User-Agent": "Mozilla/5.0 (research/educational download)"}
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
        print(f"[dataset] Downloaded {len(data) / 1e6:.1f} MB")

        with zipfile.ZipFile(io.BytesIO(data)) as z:
            # Find the CSV inside the zip
            csv_names = [n for n in z.namelist() if n.endswith(".csv")]
            if not csv_names:
                raise ValueError(f"No CSV found in zip. Files: {z.namelist()}")
            print(f"[dataset] Extracting: {csv_names[0]}")
            with z.open(csv_names[0]) as f:
                df = pd.read_csv(f)

        df.to_csv(local_csv, index=False)
        print(f"[dataset] Cached to {local_csv}")
        return df

    except Exception as e:
        raise RuntimeError(
            f"Failed to download dataset: {e}\n"
            f"Please manually download from:\n"
            f"  https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset\n"
            f"and save the CSV to: {local_csv}"
        ) from e


def prepare_data(df: pd.DataFrame):
    """
    Find the URL and label columns, extract features, return X, y arrays.
    """
    # Normalize column names (dataset uses different casings in different versions)
    df.columns = [c.strip() for c in df.columns]
    print(f"[data] Columns: {list(df.columns)[:10]}")
    print(f"[data] Shape: {df.shape}")

    # Find URL column
    url_col = None
    for candidate in ["URL", "url", "Url", "PHISHING_URL", "website"]:
        if candidate in df.columns:
            url_col = candidate
            break
    if url_col is None:
        raise ValueError(f"Cannot find URL column. Available: {list(df.columns)}")

    # Find label column (0=legit, 1=phishing)
    label_col = None
    for candidate in ["label", "Label", "phishing", "Phishing", "class", "Class", "target"]:
        if candidate in df.columns:
            label_col = candidate
            break
    if label_col is None:
        raise ValueError(f"Cannot find label column. Available: {list(df.columns)}")

    print(f"[data] URL column: '{url_col}', Label column: '{label_col}'")

    urls = df[url_col].astype(str).tolist()
    labels = df[label_col].astype(int).tolist()

    print(f"[data] Label distribution: {dict(zip(*np.unique(labels, return_counts=True)))}")

    # Extract features — skip rows where extraction returns None
    X, y = [], []
    skipped = 0
    for url, label in zip(urls, labels):
        feats = extract_features(url)
        if feats is None:
            skipped += 1
            continue
        X.append(feats)
        y.append(label)

    if skipped > 0:
        print(f"[data] Skipped {skipped} unparsable URLs")

    print(f"[data] Usable samples: {len(X)}")
    return np.array(X), np.array(y)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Train + evaluate
# ─────────────────────────────────────────────────────────────────────────────

def train_and_evaluate(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[train] Train: {len(X_train)} | Test: {len(X_test)}")

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)

    print("\n" + "=" * 60)
    print("MEASURED METRICS (held-out 20% split)")
    print("=" * 60)
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  Train size: {len(X_train)}")
    print(f"  Test size:  {len(X_test)}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"]))
    print("=" * 60)

    return model, scaler, {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Save weights.json
#    Format understood by lib/ml/infer.ts — do not change without updating infer.ts
# ─────────────────────────────────────────────────────────────────────────────

def save_weights(model, scaler, metrics: dict):
    WEIGHTS_OUT.parent.mkdir(parents=True, exist_ok=True)

    weights_data = {
        "_meta": {
            "description": "Logistic regression weights for phishing URL detection",
            "dataset": "PhiUSIIL Phishing URL Dataset, UCI ML Repository",
            "dataset_url": "https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset",
            "feature_names": FEATURE_NAMES,
            "feature_count": len(FEATURE_NAMES),
            "metrics": metrics,
            "trained_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "note": "ML contributes up to 25 points in scoring.ts — capped by design (Architecture.md §5)"
        },
        # Logistic regression: intercept + coefficients
        "intercept": float(model.intercept_[0]),
        "coefficients": [float(c) for c in model.coef_[0]],
        # Scaler params — must apply before computing dot product
        "scaler_mean": [float(m) for m in scaler.mean_],
        "scaler_std": [float(s) for s in scaler.scale_],
    }

    with open(WEIGHTS_OUT, "w") as f:
        json.dump(weights_data, f, indent=2)

    print(f"\n[weights] Saved to: {WEIGHTS_OUT}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. Verification: side-by-side test URLs
#    These will be used to confirm features.ts produces identical vectors.
# ─────────────────────────────────────────────────────────────────────────────

TEST_URLS = [
    "https://www.google.com",
    "http://192.168.1.1/login",
    "https://paypal-secure-verify-account.evil.com/update/credentials",
    "https://amazon.com/dp/B09XS3JXMR",
    "http://xn--pypal-4ve.com/signin",  # punycode homograph
]

def print_test_vectors():
    print("\n" + "=" * 60)
    print("FEATURE VECTORS FOR SIDE-BY-SIDE TS VERIFICATION")
    print("=" * 60)
    print(f"{'URL':<55} {'Features'}")
    print("-" * 120)
    for url in TEST_URLS:
        feats = extract_features(url)
        print(f"{url[:55]:<55} {feats}")
    print("=" * 60)
    print("Port extract_features() identically to lib/ml/features.ts")
    print("Run: npx ts-node lib/ml/features.ts (or add a test) to confirm match")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Main
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("AI Phishing Detection — Model Training (Day 1, Track B)")
    print("=" * 60)

    df = load_dataset()
    X, y = prepare_data(df)
    model, scaler, metrics = train_and_evaluate(X, y)
    save_weights(model, scaler, metrics)
    print_test_vectors()

    print("\n[OK] Training complete. weights.json written.")
    print("[OK] Next: port extract_features() to lib/ml/features.ts")
    print("[OK] Then verify TS feature vectors match Python output above.")
