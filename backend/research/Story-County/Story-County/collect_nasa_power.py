"""
Collect NASA POWER daily precipitation and temperature for one point.
NASA POWER is a gridded product (~0.5 degree cells). The point value is a grid
estimate, not a field or weather-station measurement.
Missing values (fill value -999) stay missing; they are never filled or zeroed.
"""
import json, csv, datetime, pathlib, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
PARAMS = "PRECTOTCORR,T2M_MAX,T2M_MIN,T2M"
FILL = -999.0

def fetch(lat, lon, start, end):
    url = ("https://power.larc.nasa.gov/api/temporal/daily/point"
           f"?parameters={PARAMS}&community=AG&longitude={lon}&latitude={lat}"
           f"&start={start}&end={end}&format=JSON")
    with urllib.request.urlopen(url, timeout=120) as r:
        return json.loads(r.read().decode())

def to_rows(resp):
    p = resp["properties"]["parameter"]
    dates = sorted(set(k for v in p.values() for k in v))
    rows = []
    for d in dates:
        row = {"date": f"{d[0:4]}-{d[4:6]}-{d[6:8]}"}
        for name in PARAMS.split(","):
            v = p.get(name, {}).get(d)
            row[name] = None if v is None or float(v) == FILL else float(v)
        rows.append(row)
    return rows

def main(lat=42.03, lon=-93.62, start="20200101", end="20241231"):
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    resp = fetch(lat, lon, start, end)
    (ROOT/"raw").mkdir(exist_ok=True)
    (ROOT/"raw"/f"power_{lat}_{lon}_raw_{stamp}.json").write_text(json.dumps(resp, indent=2))
    rows = to_rows(resp)
    (ROOT/"clean").mkdir(exist_ok=True)
    out = ROOT/"clean"/f"power_{lat}_{lon}_daily.csv"
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["date"] + PARAMS.split(","))
        w.writeheader(); w.writerows(rows)
    print(f"{len(rows)} days written to {out}")

if __name__ == "__main__":
    try: main()
    except Exception as e:
        print("POWER collection failed:", e, file=sys.stderr); sys.exit(1)