"""
12-year rotation comparison for one Story County map unit (DRAFT, demo only).

Scenarios (same field, same 12-year horizon):
  baseline   corn - soybeans (repeating)
  scenario_A corn - soybeans - alfalfa (establishment) - alfalfa (full stand)
  scenario_B corn - oats (grain) - soybeans

Notes come only from verified rules in decision_rules.json (R01, R03, R05, R14).
Missing drainage gives "insufficient evidence". Nothing is scored or predicted.
Usage:  py rotation_compare.py 411315
"""
import sys
from field_profile import rows, val, weather_summary

SCHEDULE = {
    "baseline":   ["corn","soybeans"],
    "scenario_A": ["corn","soybeans","alfalfa establish","alfalfa full stand"],
    "scenario_B": ["corn","oats (grain)","soybeans"],
}
YEARS = 12

def crop_for(scn, year):
    seq = SCHEDULE[scn]
    return seq[(year - 1) % len(seq)]

def notes(scn, year, prev_crop, drainage):
    n = []
    if scn == "scenario_A" and crop_for(scn, year) == "alfalfa establish":
        if drainage in ("poorly drained", "very poorly drained"):
            n.append("alfalfa drainage concern (R14): check field, use a well-drained site")
        elif drainage == "":
            n.append("insufficient evidence for alfalfa drainage")
        n.append("termination plan needed before corn (R03)")
    if scn == "scenario_A" and prev_crop == "alfalfa full stand" and crop_for(scn, year) == "corn":
        n.append("first corn after alfalfa: potentially lower N response (R01); no numeric credit")
    if crop_for(scn, year) == "corn" and prev_crop == "soybeans":
        n.append("corn after soybean: lower N response expected (R05)")
    return "; ".join(n)

def compare(mukey):
    mu = [r for r in rows("ssurgo_IA169_mapunit.csv") if r["mukey"] == mukey]
    if not mu:
        return f"Map unit {mukey} not found."
    mu = mu[0]
    drainage = (mu["drclassdcd"] or "").strip().lower()
    lines = [f"DRAFT 12-year comparison - map unit {mukey}: {mu['muname']}",
             f"Dominant drainage: {val(mu['drclassdcd'])}",
             "Demo only: map-unit data, not field-measured. No yield or profit is predicted.",
             ""]
    for scn in SCHEDULE:
        lines.append(f"== {scn} ==")
        for y in range(1, YEARS + 1):
            crop = crop_for(scn, y)
            prev_label = SCHEDULE[scn][(y - 2) % len(SCHEDULE[scn])] if y > 1 else None
            n = notes(scn, y, prev_label, drainage)
            lines.append(f"  Year {y:2d}: {crop:20s} {n}")
        lines.append("")
    lines.append(weather_summary())
    return "\n".join(lines)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py rotation_compare.py <mukey>"); sys.exit(1)
    print(compare(sys.argv[1]))