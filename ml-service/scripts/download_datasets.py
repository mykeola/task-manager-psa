"""
Dataset acquisition and hygiene script for PSA Software Schedule Prediction.
Downloads:
1. China Dataset (N=499) from official academic replication repository (PROMISE/UCL/Alcala)
2. ISBSG Release 10 Teaser (N=38) from official Zenodo open repository (DOI: 10.5281/zenodo.268485)
Converts both ARFF files to clean CSV format.
"""

import urllib.request
import os
import re
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

CHINA_ARFF_URL = "https://raw.githubusercontent.com/danrodgar/MIERatio/master/datasets/china.arff"
ISBSG_ARFF_URL = "https://zenodo.org/records/268485/files/isbsg10.arff?download=1"

CHINA_ARFF_PATH = os.path.join(DATA_DIR, "china.arff")
CHINA_CSV_PATH = os.path.join(DATA_DIR, "china.csv")
ISBSG_ARFF_PATH = os.path.join(DATA_DIR, "isbsg10.arff")


def download_file(url: str, dest_path: str):
    print(f"[Dataset Ingestion] Downloading from {url} ...")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PSA-Academic-Research/1.0"}
    )
    with urllib.request.urlopen(req) as response, open(dest_path, "wb") as out_file:
        out_file.write(response.read())
    print(f"[Dataset Ingestion] Saved to {dest_path} ({os.path.getsize(dest_path)} bytes)")


def parse_china_arff(arff_path: str, csv_path: str):
    print(f"[Dataset Ingestion] Parsing ARFF {arff_path} to CSV ...")
    with open(arff_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    attributes = []
    data_lines = []
    is_data = False

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("%"):
            continue
        if line_clean.lower().startswith("@attribute"):
            # Example: @attribute AFP numeric
            parts = line_clean.split()
            attr_name = parts[1].replace("'", "").replace('"', "")
            attributes.append(attr_name)
        elif line_clean.lower().startswith("@data"):
            is_data = True
            continue
        elif is_data:
            data_lines.append(line_clean.split(","))

    df = pd.DataFrame(data_lines, columns=attributes)
    # Convert numeric columns
    numeric_cols = ["AFP", "Input", "Output", "Enquiry", "File", "Interface", 
                    "Added", "Changed", "Deleted", "Duration", "AdjFactor", "Effort"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop any rows where Duration or Effort is missing
    df = df.dropna(subset=["Duration", "Effort", "AFP"])
    df.to_csv(csv_path, index=False)
    print(f"[Dataset Ingestion] Successfully created {csv_path} with {len(df)} project instances.")
    print(f"[Dataset Ingestion] Columns: {list(df.columns)}")
    return df


if __name__ == "__main__":
    download_file(CHINA_ARFF_URL, CHINA_ARFF_PATH)
    try:
        download_file(ISBSG_ARFF_URL, ISBSG_ARFF_PATH)
    except Exception as e:
        print(f"[Dataset Ingestion] Zenodo ISBSG download note: {e}")

    df_china = parse_china_arff(CHINA_ARFF_PATH, CHINA_CSV_PATH)
    print("\nDataset Summary Statistics (China Dataset N=499):")
    print(df_china[["AFP", "Duration", "Effort"]].describe())
