import json,csv,math,statistics as st
D=json.load(open('asjp.json')); F=D['features']
def sub(a,b):
    if a==b: return 0.0
    x,y=F[a],F[b]; return min(1.0,sum(abs(p-q) for p,q in zip(x,y))/len(x))
def ld(a,b):
    n,m=len(a),len(b); R=list(range(m+1))
    for i in range(1,n+1):
        prev,R[0]=R[0],i
        for j in range(1,m+1):
            cur=min(R[j]+1,R[j-1]+1,prev+sub(a[i-1],b[j-1])); prev,R[j]=R[j],cur
    return R[m]/max(n,m)
def ldn(x,y):
    A=D['lists'][x][1].split('|'); B=D['lists'][y][1].split('|')
    v=[ld(a,b) for a,b in zip(A,B) if a and b]; return st.mean(v) if len(v)>=20 else None
N={'danish':'danish','dutch':'dutch','german':'german','swedish':'swedish','french':'french','italian':'italian','portuguese':'portuguese','romanian':'romanian','spanish':'spanish','bulgarian':'bulgarian','croatian':'croatian standard','czech':'czech','polish':'polish','slovak':'slovak','slovene':'slovenian','english':'english'}
print([ (k,v in D['lists']) for k,v in N.items() if v not in D['lists']])
G=list(csv.DictReader(open('/home/claude/rules-standalone/docs/data/gooskens2018_minimal_exposure_cloze.csv')))
P=[]
for r in G:
    if r['language_heard']=='English' or not r['cloze_pct_minimal_exposure']: continue
    l,h=N[r['listener_language'].lower()],N[r['language_heard'].lower()]
    s=float(r['cloze_pct_minimal_exposure']); P.append((math.log(ldn(l,h)),math.log(s/(100-s)),s))
def fit(Q):
    xs=[q[0] for q in Q]; ys=[q[1] for q in Q]; mx,my=st.mean(xs),st.mean(ys); b=sum((x-mx)*(y-my) for x,y in zip(xs,ys))/sum((x-mx)**2 for x in xs); return my-b*mx,b
a,b=fit(P); pr=lambda a,b,x:100/(1+math.exp(-(a+b*x)))
loo=[abs(pr(*fit(P[:i]+P[i+1:]),P[i][0])-P[i][2]) for i in range(len(P))]
print('a %.3f b %.3f r %.2f LOO MAE %.1f median %.1f'%(a,b,st.correlation([p[0] for p in P],[p[1] for p in P]),st.mean(loo),st.median(loo)))
for x,y in [('spanish','catalan'),('spanish','galician'),('russian','ukrainian'),('hindi','urdu'),('english','scots'),('spanish','portuguese'),('czech','slovak')]:
    if x in D['lists'] and y in D['lists']: d=ldn(x,y); print(x,y,round(d,3),round(pr(a,b,math.log(d)),1), D['lists'][x][0], D['lists'][y][0])
