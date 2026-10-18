# Feature-weighted LDND between ASJP word lists (Wichmann et al. 2010 LDND, with segment costs from articulatory features).
import csv,collections,sys,itertools,json,statistics as st
sys.path.insert(0,'.')
from feat import vec
S='/tmp/claude-0/-home-claude/1bd7bcb3-68ff-5931-8d4a-6ef781b50745/scratchpad/asjp/cldf/'
langs={r['ID']:r for r in csv.DictReader(open(S+'languages.csv'))}
lists=collections.defaultdict(dict)
for r in csv.DictReader(open(S+'forms.csv')):
    segs=[s for s in r['Segments'].split() if s!='+' and vec(s) is not None]
    if segs and r['Parameter_ID'] not in lists[r['Language_ID']]: lists[r['Language_ID']][r['Parameter_ID']]=segs
V={}
def sub(a,b):
    if a==b: return 0.0
    k=(a,b)
    if k not in V:
        x,y=vec(a),vec(b); V[k]=sum(abs(p-q) for p,q in zip(x,y))/(2*len(x))*2   # 0..2 scale halved below
        V[k]=min(1.0,V[k])
    return V[k]
def ld(a,b):
    n,m=len(a),len(b); D=list(range(m+1))
    for i in range(1,n+1):
        prev,D[0]=D[0],i
        for j in range(1,m+1):
            cur=min(D[j]+1,D[j-1]+1,prev+sub(a[i-1],b[j-1])); prev,D[j]=D[j],cur
    return D[m]/max(n,m)
def ldnd(A,B):
    common=[c for c in A if c in B]
    if len(common)<20: return None
    same=st.mean(ld(A[c],B[c]) for c in common)
    diff=st.mean(ld(A[c],B[d]) for c,d in itertools.permutations(common,2))
    return same/diff
