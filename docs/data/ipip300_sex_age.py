# Sex and age differences on the five domains of the IPIP-NEO-300 (Johnson 2014 data, 145,388 respondents). Item keys are
# inferred from the sign of each item's correlation with its facet score (the facet percentiles in the file are normed within
# sex and age, so they cannot give the differences themselves, but within each group they rise with the raw score).
import sys, json
import pandas as pd, numpy as np
df = pd.read_csv(sys.argv[1])
items = [f'i{k}' for k in range(1, 301)]
order = ['N', 'E', 'O', 'A', 'C']
facets = {
 'N': ['facet_anxiety', 'facet_anger', 'facet_depression', 'facet_self_consciousness', 'facet_immoderation', 'facet_vulnerability'],
 'E': ['facet_friendliness', 'facet_gregariousness', 'facet_assertiveness', 'facet_activity_level', 'facet_excitement_seeking', 'facet_cheerfulness'],
 'O': ['facet_imagination', 'facet_artistic_interests', 'facet_emotionality', 'facet_adventurousness', 'facet_intellect', 'facet_liberalism'],
 'A': ['facet_trust', 'facet_morality', 'facet_altruism', 'facet_cooperation', 'facet_modesty', 'facet_sympathy'],
 'C': ['facet_self_efficacy', 'facet_orderliness', 'facet_dutifulness', 'facet_achievement_striving', 'facet_self_discipline', 'facet_cautiousness'],
}
df = df[(df[items] >= 1).all(axis=1) & (df[items] <= 5).all(axis=1) & df['sex'].isin([1, 2]) & (df['age'] >= 18) & (df['age'] <= 90)]
dom = {}
keys = {}
for k, it in enumerate(items):
    pos = k % 30; d = order[pos % 5]; f = facets[d][pos // 5]
    r = np.corrcoef(df[it], df[f])[0, 1]
    keys[it] = (d, 1 if r > 0 else -1, round(float(r), 2))
for d in order:
    s = 0
    for it, (dd, sg, _) in keys.items():
        if dd == d: s = s + (df[it] if sg > 0 else 6 - df[it])
    dom[d] = s
# Goldberg's factor V (intellect) is closest to the NEO intellect facet (O5): its 10 items alone.
s = 0
for k, it in enumerate(items):
    if k % 30 == 22:  # position 23 in the 30-cycle: O5 = 5th O facet (O at pos%5==2, facet index pos//5==4)
        sg = keys[it][1]; s = s + (df[it] if sg > 0 else 6 - df[it])
dom['I'] = s
order = order + ['I']
S = pd.DataFrame(dom); S['sex'] = df['sex'].values; S['age'] = df['age'].values
z = (S[order] - S[order].mean()) / S[order].std()
z['sex'] = S['sex']; z['age'] = S['age']
out = {'n': int(len(z)), 'weak_keys': [k for k, v in keys.items() if abs(v[2]) < 0.2]}
m, f = z[z.sex == 1][order].mean(), z[z.sex == 2][order].mean()
out['female_minus_male_sd'] = {d: round(float(f[d] - m[d]), 3) for d in order}
bands = [(18, 24), (25, 34), (35, 44), (45, 54), (55, 64), (65, 90)]
# Age: band means within each sex, then the two sexes averaged with equal weight (the bands differ in their sex mix).
out['by_age'] = {f'{a}-{b}': {d: round(float(np.mean([z[(z.age >= a) & (z.age <= b) & (z.sex == sx)][d].mean() for sx in (1, 2)])), 3) for d in order} | {'n': int(((z.age >= a) & (z.age <= b)).sum())} for a, b in bands}
json.dump(out, open(sys.argv[2], 'w'), indent=1)
print(json.dumps(out, indent=1)[:2500])
