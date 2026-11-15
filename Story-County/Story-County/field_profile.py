"""
Field profile for one SSURGO map unit in Story County, from files in clean/.
Missing values are reported as "not recorded". Nothing is filled or assumed.
Map-unit and component values describe mapped soil at survey scale, not a field lab test.
Weather is a NASA POWER grid point near Ames, not a field measurement.

Usage:  py field_profile.py 411278
"""
import csv, sys, pathlib, statistics

CLEAN = pathlib.Path(__file__).resolve().parent / "clean"
NR = "not recorded"

def rows(name):
    with open(CLEAN / name, newline="") as f:
        return list(csv.DictReader(f))

def val(v):
    v = (v or "").strip()
    return v if v else NR

def profile(mukey):
    mu = [r for r in rows("ssurgo_IA169_mapunit.csv") if r["mukey"] == mukey]
    if not mu:
        return f"Map unit {mukey} not found in clean/ssurgo_IA169_mapunit.csv."
    mu = mu[0]
    comps = sorted([r for r in rows("ssurgo_IA169_component.csv") if r["mukey"] == mukey],
                   key=lambda r: float(r["comppct_r"] or 0), reverse=True)
    out = [f"Map unit {mukey}: {mu['muname']}",
           f"  Drainage (dominant):   {val(mu['drclassdcd'])}",
           f"  Drainage (wettest):    {val(mu['drclasswettest'])}",
           f"  Flooding frequency:    {val(mu['flodfreqdcd'])}",
           f"  Available water 0-100 cm: {val(mu['aws0100wta'])} cm (map-unit weighted average)",
           f"  Available water 0-150 cm: {val(mu['aws0150wta'])} cm"]
    if comps:
        dom = comps[0]
        out += [f"  Dominant component: {val(dom['compname'])} ({val(dom['comppct_r'])}%)",
                f"  Component drainage: {val(dom['drainagecl'])}"]
        surf = [h for h in rows("ssurgo_IA169_horizon.csv")
                if h["cokey"] == dom["cokey"] and h["hzdept_r"] == "0"]
        if surf:
            h = surf[0]
            out += [f"  Surface layer ({val(h['hzname'])}, 0-{val(h['hzdepb_r'])} cm):",
                    f"    Texture: {val(h['texdesc'])} / {val(h['texcl'])}",
                    f"    Clay / silt / sand (%): {val(h['claytotal_r'])} / {val(h['silttotal_r'])} / {val(h['sandtotal_r'])}",
                    f"    Organic matter (%): {val(h['om_r'])}",
                    f"    pH (1:1 water): {val(h['ph1to1h2o_r'])}"]
        else:
            out.append("  Surface layer: not recorded")
    out.append("  Other components in this map unit:")
    for c in comps[1:]:
        out.append(f"    {val(c['compname'])} {val(c['comppct_r'])}% ({val(c['drainagecl'])})")
    return "\n".join(out)

def flags(mukey):
    mu = [r for r in rows("ssurgo_IA169_mapunit.csv") if r["mukey"] == mukey]
    if not mu: return []
    d = (mu[0]["drclassdcd"] or "").strip().lower()
    f = []
    if d in ("poorly drained", "very poorly drained"):
        f.append("Alfalfa establishment: drainage is poorly drained. Show concern; do not declare unsuitable. Check the field and use a well-drained site (ISU alfalfa seeding guidance).")
    elif not d:
        f.append("Drainage not recorded: insufficient evidence for alfalfa drainage assessment.")
    f.append("Water: ET is not rainfall. Do not compare rainfall with crop water use to declare sufficiency.")
    return f

def weather_summary():
    try:
        w = rows("power_42.03_-93.62_daily.csv")
    except FileNotFoundError:
        return "Weather file not found."
    by_year = {}
    for r in w:
        y = r["date"][:4]
        by_year.setdefault(y, {"p": 0.0, "n": 0, "t": []})
        if r["PRECTOTCORR"]:
            by_year[y]["p"] += float(r["PRECTOTCORR"]); by_year[y]["n"] += 1
        if r["T2M"]: by_year[y]["t"].append(float(r["T2M"]))
    lines = ["Weather (NASA POWER grid point near Ames; not a field measurement):"]
    for y in sorted(by_year):
        d = by_year[y]
        mean_t = f"{statistics.mean(d['t']):.1f} C" if d["t"] else NR
        lines.append(f"  {y}: precipitation {d['p']:.0f} mm (from {d['n']} days), mean air temp {mean_t}")
    return "\n".join(lines)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py field_profile.py <mukey>"); sys.exit(1)
    mk = sys.argv[1]
    print(profile(mk)); print()
    for line in flags(mk): print("FLAG:", line)
    print(); print(weather_summary())