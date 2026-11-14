# Country shares from the World Values Survey wave 7 (2017-2022, v6.0), weighted by W_WEIGHT; negative codes (missing) left out.
import sys, json
import pandas as pd, numpy as np
just = ['Q177','Q178','Q179','Q180','Q181','Q182','Q183','Q184','Q185','Q186','Q187','Q188','Q189','Q190','Q191','Q192','Q193','Q194','Q195']
cols = ['B_COUNTRY_ALPHA', 'A_YEAR', 'W_WEIGHT', 'Q57', 'Q61', 'Q6'] + just
df = pd.read_csv(sys.argv[1], usecols=cols, low_memory=False)
out = {}
for c, g in df.groupby('B_COUNTRY_ALPHA'):
    w = g['W_WEIGHT'].astype(float)
    def share(col, ok):
        v = g[col]; m = v > 0
        return round(float((w[m] * ok(v[m])).sum() / w[m].sum()), 3) if m.sum() >= 200 else None
    r = {'n': int(len(g)), 'year': int(g['A_YEAR'].mode().iloc[0]),
         'trust_most': share('Q57', lambda v: v == 1),
         'trust_first_meeting': share('Q61', lambda v: v <= 2),
         'religion_important': share('Q6', lambda v: v <= 2)}
    r['never'] = {q: share(q, lambda v: v == 1) for q in just}
    out[c] = r
json.dump(out, open(sys.argv[2], 'w'), indent=0)
print(len(out), 'countries')
for c in ['USA', 'GBR', 'DEU', 'BRA', 'NGA', 'JPN', 'EGY', 'SWE' if 'SWE' in out else 'NLD']:
    if c in out: print(c, out[c]['year'], out[c]['trust_most'], out[c]['trust_first_meeting'], out[c]['religion_important'], out[c]['never']['Q179'], out[c]['never']['Q191'], out[c]['never']['Q182'])
