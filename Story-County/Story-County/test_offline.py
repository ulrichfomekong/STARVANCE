"""Offline tests: no network. Checks parsing, missing-value handling and no silent favourable defaults."""
import importlib.util, pathlib
here = pathlib.Path(__file__).resolve().parent
def load(name):
    spec = importlib.util.spec_from_file_location(name, here/f"{name}.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

ssurgo = load("collect_ssurgo_story")
power = load("collect_nasa_power")

t = [["mukey","drclassdcd"],["1","Poorly drained"],["2",""],["3",None]]
rows = ssurgo.to_dicts(t)
assert rows[0]["drclassdcd"] == "Poorly drained"
assert ssurgo.clean_value(rows[1]["drclassdcd"]) is None, "empty must be missing"
assert ssurgo.clean_value(rows[2]["drclassdcd"]) is None, "null must be missing"
assert ssurgo.clean_value("   Very poorly drained  ") == "Very poorly drained", "whitespace trimmed"

resp = {"properties":{"parameter":{
  "PRECTOTCORR":{"20200101":1.2,"20200102":-999.0},
  "T2M_MAX":{"20200101":5.0,"20200102":6.0},
  "T2M_MIN":{"20200101":-1.0,"20200102":0.0},
  "T2M":{"20200101":2.0,"20200102":3.0}}}}
rows = power.to_rows(resp)
assert rows[1]["PRECTOTCORR"] is None, "fill value must become missing, not zero"
assert rows[0]["date"] == "2020-01-01"
print("all offline tests passed")