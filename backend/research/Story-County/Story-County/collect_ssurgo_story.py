"""
Collect SSURGO map-unit, component and horizon data for Story County, Iowa
(area symbol IA169) from the NRCS Soil Data Access (SDA) service.

This script does NOT estimate values. Missing values stay missing.
SSURGO values describe mapped soil map units at survey scale, not lab measurements of a field.
"""
import json, csv, datetime, pathlib, sys, urllib.request

SDA_URL = "https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest"
AREA = "IA169"
ROOT = pathlib.Path(__file__).resolve().parent

QUERIES = {
  "mapunit": f"""
    SELECT m.mukey, m.musym, m.muname, m.mukind,
           a.drclassdcd, a.drclasswettest, a.flodfreqdcd,
           a.aws0100wta, a.aws0150wta
    FROM legend l
      INNER JOIN mapunit m ON m.lkey = l.lkey
      LEFT  JOIN muaggatt a ON a.mukey = m.mukey
    WHERE l.areasymbol = '{AREA}'""",
  "component": f"""
    SELECT m.mukey, c.cokey, c.compname, c.comppct_r, c.drainagecl, c.majcompflag
    FROM legend l
      INNER JOIN mapunit m ON m.lkey = l.lkey
      INNER JOIN component c ON c.mukey = m.mukey
    WHERE l.areasymbol = '{AREA}'""",
  "horizon": f"""
    SELECT c.cokey, h.chkey, h.hzname, h.hzdept_r, h.hzdepb_r,
           h.sandtotal_r, h.silttotal_r, h.claytotal_r, h.om_r, h.ph1to1h2o_r,
           tg.texdesc, t.texcl
    FROM legend l
      INNER JOIN mapunit m ON m.lkey = l.lkey
      INNER JOIN component c ON c.mukey = m.mukey
      INNER JOIN chorizon h ON h.cokey = c.cokey
      LEFT  JOIN chtexturegrp tg ON tg.chkey = h.chkey AND tg.rvindicator = 'Yes'
      LEFT  JOIN chtexture t ON t.chtgkey = tg.chtgkey
    WHERE l.areasymbol = '{AREA}'""",
}

COLS = {
  "mapunit": ["mukey","musym","muname","mukind","drclassdcd","drclasswettest","flodfreqdcd","aws0100wta","aws0150wta"],
  "component": ["mukey","cokey","compname","comppct_r","drainagecl","majcompflag"],
  "horizon": ["cokey","chkey","hzname","hzdept_r","hzdepb_r","sandtotal_r","silttotal_r","claytotal_r","om_r","ph1to1h2o_r","texdesc","texcl"],
}

def post_query(sql):
    body = json.dumps({"query": sql, "format": "JSON"}).encode()
    req = urllib.request.Request(SDA_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())

def clean_value(v):
    """Empty, null or whitespace-only becomes None (missing). Never treated as favourable."""
    if v is None: return None
    s = str(v).strip()
    return s if s != "" else None

def write_csv(path, rows, fields):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
        for r in rows: w.writerow({k: clean_value(r.get(k)) for k in fields})

def to_dicts(table, cols):
    # Handles rows as dicts, or rows as lists in COLS order (with or without a header row).
    if not table: return []
    if isinstance(table[0], dict): return table
    rows = table
    if [str(x).strip().lower() for x in rows[0]] == [c.lower() for c in cols]:
        rows = rows[1:]
    return [dict(zip(cols, r)) for r in rows]

def main():
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    raw, tables = {}, {}
    for name, sql in QUERIES.items():
        resp = post_query(sql)
        raw[name] = {"sql": sql.strip(), "response": resp}
        tables[name] = resp.get("Table", [])
        print(f"{name}: {len(tables[name])} rows")
    (ROOT/"raw").mkdir(exist_ok=True)
    (ROOT/"raw"/f"ssurgo_IA169_raw_{stamp}.json").write_text(json.dumps(raw, indent=2))
    base = ROOT/"clean"
    write_csv(base/"ssurgo_IA169_mapunit.csv", to_dicts(tables["mapunit"], COLS["mapunit"]), COLS["mapunit"])
    write_csv(base/"ssurgo_IA169_component.csv", to_dicts(tables["component"], COLS["component"]), COLS["component"])
    write_csv(base/"ssurgo_IA169_horizon.csv", to_dicts(tables["horizon"], COLS["horizon"]), COLS["horizon"])
    print("clean files written to", base)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("SSURGO collection failed:", e, file=sys.stderr); sys.exit(1)