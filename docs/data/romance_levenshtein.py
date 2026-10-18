import csv,itertools,statistics as st
rows=list(csv.DictReader(open('swadesh.tsv'),delimiter='\t'))
V=set('aeiouEO@6y29AIUQ3 1'.replace(' ',''))
def lev(a,b):
    # Levenshtein with costs 1; alignment length = steps of the optimal path (Heeringa 2004 normalisation)
    n,m=len(a),len(b); D=[[(0,0)]*(m+1) for _ in range(n+1)]
    for i in range(1,n+1): D[i][0]=(i,i)
    for j in range(1,m+1): D[0][j]=(j,j)
    for i in range(1,n+1):
        for j in range(1,m+1):
            s=0 if a[i-1]==b[j-1] else 1
            D[i][j]=min((D[i-1][j-1][0]+s,D[i-1][j-1][1]+1),(D[i-1][j][0]+1,D[i-1][j][1]+1),(D[i][j-1][0]+1,D[i][j-1][1]+1))
    c,l=D[n][m]; return c/l
L=['ES','EP','BP','IT','FR','RO']
dist={}
for x,y in itertools.combinations(L,2):
    dist[(x,y)]=dist[(y,x)]=st.mean(lev(r[x],r[y]) for r in rows)
print(len(rows),'concepts')
for x,y in itertools.combinations(L,2): print(x,y,round(dist[(x,y)],3))
import json; json.dump({f'{a}-{b}':v for (a,b),v in dist.items()},open('dist.json','w'))
