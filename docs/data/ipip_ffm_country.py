# Country means of the five IPIP Big-Five Factor Markers (Goldberg 1992) in the Open-Psychometrics IPIP-FFM data (2016-2018).
import sys, json
import pandas as pd, numpy as np
path = sys.argv[1]; out = sys.argv[2]
cols = [f'{f}{i}' for f in ['EXT', 'EST', 'AGR', 'CSN', 'OPN'] for i in range(1, 11)]
df = pd.read_csv(path, sep='\t', usecols=cols + ['IPC', 'country'], low_memory=False)
n0 = len(df)
for c in cols: df[c] = pd.to_numeric(df[c], errors='coerce')
df = df[(df['IPC'] == 1) & df[cols].notna().all(axis=1) & (df[cols] >= 1).all(axis=1) & (df[cols] <= 5).all(axis=1)]
df = df[df['country'].notna() & (df['country'] != 'NONE')]
# Keys from the item wording (ipip.ori.org Big-Five Factor Markers): + agrees with the factor's high pole, - reversed.
# EST items are worded for neuroticism; the factor here is emotional stability, so every EST sign is flipped.
key = {
 'EXT': [1, -1, 1, -1, 1, -1, 1, -1, 1, -1],
 'EST': [-1, 1, -1, 1, -1, -1, -1, -1, -1, -1],
 'AGR': [-1, 1, -1, 1, -1, 1, -1, 1, 1, 1],
 'CSN': [1, -1, 1, -1, 1, -1, 1, -1, 1, 1],
 'OPN': [1, -1, 1, -1, 1, -1, 1, 1, 1, 1],
}
score = {}
for f, ks in key.items():
    s = 0
    for i, k in enumerate(ks, 1):
        v = df[f'{f}{i}']
        s = s + (v if k > 0 else 6 - v)
    score[f] = s / 10
S = pd.DataFrame(score); S['country'] = df['country'].values
mu = S[list(key)].mean(); sd = S[list(key)].std()
g = S.groupby('country')
n = g.size()
keep = n[n >= 1000].index
res = {}
for c in keep:
    m = g.get_group(c)[list(key)]
    res[c] = {'n': int(len(m)), **{f: [round(float((m[f].mean() - mu[f]) / sd[f]), 3), round(float(m[f].std() / sd[f]), 3)] for f in key}}
# Cronbach alpha per factor, as a check of the keys
alpha = {}
for f, ks in key.items():
    items = pd.DataFrame({i: (df[f'{f}{i}'] if k > 0 else 6 - df[f'{f}{i}']) for i, k in enumerate(ks, 1)})
    kk = items.shape[1]; alpha[f] = round(float(kk / (kk - 1) * (1 - items.var().sum() / items.sum(axis=1).var())), 3)
json.dump({'rows_read': n0, 'rows_kept': int(len(S)), 'countries': len(res), 'pooled_mean': {f: round(float(mu[f]), 3) for f in key}, 'pooled_sd': {f: round(float(sd[f]), 3) for f in key}, 'alpha': alpha, 'by_country': res}, open(out, 'w'), indent=0)
print('rows', n0, 'kept', len(S), 'countries', len(res), 'alpha', alpha)
