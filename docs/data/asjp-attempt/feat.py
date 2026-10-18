# Articulatory feature vector for each ASJP (IPA-converted) segment, from PanPhon's ipa_all.csv (24 features, +/-/0).
import csv,unicodedata
S='/tmp/claude-0/-home-claude/1bd7bcb3-68ff-5931-8d4a-6ef781b50745/scratchpad'
rows=list(csv.reader(open(S+'/panphon/panphon/data/ipa_all.csv')))
names=rows[0][1:]; F={r[0]:[{'+':1,'-':-1,'0':0}.get(x,0) for x in r[1:]] for r in rows[1:]}
def vec(seg):
    s=seg.replace('’','ʼ').replace('ⁿ','').replace('g','ɡ')     # prenasalisation dropped [ASSUMED]
    if s in F: return F[s]
    n=unicodedata.normalize('NFD',s)
    for cut in range(len(n),0,-1):
        if n[:cut] in F: 
            v=list(F[n[:cut]])
            if '̃' in n: v[names.index('nas')]=1          # combining tilde: nasal
            return v
    for ch in s:
        if ch in F: return F[ch]
    return None
