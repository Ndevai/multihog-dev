import sys,json,csv,math,statistics as st,itertools; sys.path.insert(0,'.')
import dist
from dist import lists, ldnd
pick=json.load(open('pick.json'))
G=list(csv.DictReader(open('/home/claude/rules-standalone/docs/data/gooskens2018_minimal_exposure_cloze.csv')))
def ldn(A,B):
    c=[k for k in A if k in B]; return st.mean(dist.ld(A[k],B[k]) for k in c)
binary=lambda a,b: 0.0 if a==b else 1.0
measures={}
for name,fn,subf in [('LDND feat',ldnd,None),('LDN feat',ldn,None),('LDND binary',ldnd,binary),('LDN binary',ldn,binary)]:
    old=dist.sub
    if subf: dist.sub=subf
    M={}
    for r in G:
        l,h=r['listener_language'].lower(),r['language_heard'].lower()
        if h=='english': continue
        k=tuple(sorted((l,h)))
        if k not in M: M[k]=fn(lists[pick[l]],lists[pick[h]])
    dist.sub=old; measures[name]=M
lg=lambda p: math.log(max(.5,p)/(100-min(99.5,p)))
def fitlin(xs,ys):
    mx,my=st.mean(xs),st.mean(ys); b=sum((x-mx)*(y-my) for x,y in zip(xs,ys))/sum((x-mx)**2 for x in xs); return my-b*mx,b
forms={'logit~d':(lambda d:d, lg, lambda v:100/(1+math.exp(-v))),'logit~log d':(lambda d:math.log(d), lg, lambda v:100/(1+math.exp(-v))),'score~d':(lambda d:d, lambda p:p, lambda v:v)}
for kind in ['min','all']:
    P0=[(r['listener_language'].lower(),r['language_heard'].lower(),float(r['cloze_pct_minimal_exposure'] if kind=='min' else r['cloze_pct_all_listeners'])) for r in G if r['language_heard']!='English' and (kind=='all' or r['cloze_pct_minimal_exposure'])]
    for mname,M in measures.items():
        for fname,(tx,ty,inv) in forms.items():
            P=[(tx(M[tuple(sorted((l,h)))]),ty(s),s) for l,h,s in P0]
            loo=[]
            for i in range(len(P)):
                a,b=fitlin([p[0] for j,p in enumerate(P) if j!=i],[p[1] for j,p in enumerate(P) if j!=i]); loo.append(abs(inv(a+b*P[i][0])-P[i][2]))
            r=st.correlation([p[0] for p in P],[p[1] for p in P])
            print(kind,mname,fname,'r=%.2f'%r,'LOO MAE %.1f'%st.mean(loo))
