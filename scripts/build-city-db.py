#!/usr/bin/env python3
"""Build a compact, sharded local city search database from GeoNames cities500."""
import csv, io, json, os, re, shutil, unicodedata, urllib.request, zipfile
from collections import defaultdict
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
CITIES_URL = "https://download.geonames.org/export/dump/cities500.zip"
TMP = os.path.join(ROOT, ".city-db-tmp")

def norm(s):
    s = unicodedata.normalize("NFKC", str(s or "")).strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = s.translate(str.maketrans({"ي":"ی","ى":"ی","ك":"ک","ۀ":"ه","ة":"ه","ؤ":"و","إ":"ا","أ":"ا","آ":"ا"}))
    s = re.sub(r"[\u064B-\u065F\u0670\u200c\u200d]", "", s)
    s = re.sub(r"[^\w\s\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0900-\u097f\u0980-\u09ff\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]+", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()

def bucket(s):
    s = norm(s).replace(" ", "")
    if not s: return "empty"
    return "_".join(f"{ord(c):04x}" for c in s[:2])

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent":"SALAT-TIME city database builder"})
    with urllib.request.urlopen(req, timeout=180) as r, open(path, "wb") as f:
        shutil.copyfileobj(r, f)

def main():
    os.makedirs(TMP, exist_ok=True); os.makedirs(DATA, exist_ok=True)
    zip_path = os.path.join(TMP, "cities500.zip")
    download(CITIES_URL, zip_path)
    shards = defaultdict(dict); total = 0
    with zipfile.ZipFile(zip_path) as z:
        txt = next(n for n in z.namelist() if n.endswith(".txt"))
        with z.open(txt) as raw:
            reader = csv.reader(io.TextIOWrapper(raw, encoding="utf-8"), delimiter="\t")
            for row in reader:
                if len(row) < 19: continue
                try: gid, lat, lon, pop = int(row[0]), float(row[4]), float(row[5]), int(row[14] or 0)
                except (ValueError, TypeError): continue
                aliases=[]
                for value in [row[1], row[2]] + row[3].split(","):
                    value=value.strip()
                    if value and value not in aliases: aliases.append(value)
                if not aliases: continue
                record={"id":gid,"name":row[1],"ascii":row[2],"countryCode":row[8].lower(),"lat":lat,"lon":lon,"timezone":row[17],"population":pop,"aliases":aliases[:80]}
                for key in {bucket(a) for a in aliases}: shards[key][str(gid)] = record
                total += 1
    out_dir=os.path.join(DATA,"cities")
    if os.path.isdir(out_dir): shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for key, records in shards.items():
        values=sorted(records.values(), key=lambda x:(-x["population"],x["name"]))
        with open(os.path.join(out_dir,key+".json"),"w",encoding="utf-8") as f:
            json.dump(values,f,ensure_ascii=False,separators=(",",":"))
    manifest={"source":"GeoNames cities500","updated":datetime.now(timezone.utc).isoformat(),"cityCount":total,"shards":len(shards),"threshold":"population > 500 or administrative seats down to PPLA4"}
    with open(os.path.join(DATA,"city-manifest.json"),"w",encoding="utf-8") as f: json.dump(manifest,f,ensure_ascii=False,indent=2)
    with open(os.path.join(DATA,"GEONAMES-ATTRIBUTION.txt"),"w",encoding="utf-8") as f:
        f.write("SALAT TIME uses GeoNames geographical data (cities500), licensed under CC BY 4.0.\nSource: https://www.geonames.org/\nThe database is downloaded and rebuilt daily by GitHub Actions.\n")
    shutil.rmtree(TMP,ignore_errors=True)
    print(f"Built {total} city records across {len(shards)} search shards")

if __name__ == "__main__": main()
