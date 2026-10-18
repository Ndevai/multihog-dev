# Recife Portuguese as variable rules: each word is a set of variants with probabilities; distance = expected Levenshtein.
import csv,math,itertools,statistics as st
exec(open('lev.py').read().split("L=['ES'")[0])
lg=lambda p: math.log(p/(1-p)); il=lambda x: 1/(1+math.exp(-x))
def varb(inp,*w): return il(lg(inp)+sum(lg(x) for x in w))
# Pretonic mid vowels, NURC-Recife 1970s, 600 tokens, GoldVarb weights (Caligrama, "Uma breve incursão pela fala culta recifense")
AL={'st':{'low':.72,'mid':.56,'diph':.41,'high':.31},'pp':{'lab':.62,'alv':.45,'vel':.37,'pal':.11},'fm':{'lat':.61,'vib':.62,'stop':.48,'fric':.48,'clus':.41,'nas':.12}}
AR={'st':{'high':.75,'diph':.76,'mid':.44,'low':.16},'pp':{'pal':.97,'vel':.46,'alv':.47,'lab':.42}}
PL={'st':{'low':.69,'diph':.44,'mid':.43,'high':.40},'pm':{'clus':.75,'none':.70,'nas':.54,'fric':.51,'vowel':.47,'stop':.39,'lat':.36}}
PR={'st':{'high':.76,'diph':.75,'mid':.55,'low':.15},'pm':{'vowel':.75,'stop':.72,'nas':.47,'fric':.45,'none':.29,'clus':.06},'fm':{'fric':.77,'stop':.66,'nas':.61,'vib':.34,'lat':.29,'clus':.16}}
g=lambda t,k,v: t[k].get(v,.5) if v else .5
def pretonic(v,st_,pp,pm,fm):
    if v=='e': lo=varb(.49,g(AL,'st',st_),g(AL,'pp',pp),g(AL,'fm',fm)); hi=varb(.28,g(AR,'st',st_),g(AR,'pp',pp)); out=('E','i','e')
    else: lo=varb(.46,g(PL,'st',st_),g(PL,'pm',pm)); hi=varb(.27,g(PR,'st',st_),g(PR,'pm',pm),g(PR,'fm',fm)); out=('O','u','o')
    s=lo+hi
    if s>1: lo,hi=lo/s,hi/s
    return [(out[0],lo),(out[1],hi),(out[2],1-lo-hi)]
PAL=0.5                      # t, d before i affricated [ASSUMED: no Recife rate found; the user: "sometimes"]
VERB_R=(357,364); NONVERB_R=(84,125); MID_R=(32,299)   # deletion counts, ALiB Recife (Revista da Abralin)
R=lambda n,d:[('',n/d),('h',1-n/d)]
# word: template with slots; slot specs
W={
 'small':('p{0}k3nu',[('e','mid','lab','stop','stop')]),'seed':('s{0}m3n{P}',[('e','mid','alv','fric','nas')]),
 'eat':('k{0}me{V}',[('o','mid','vel','stop','nas')]),'drink':('b{0}be{V}',[('e','mid','lab','stop','stop')]),
 'bite':('m{0}{M}de{V}',[('o','mid','lab','nas','vib')]),'sleep':('d{0}{M}mi{V}',[('o','high','alv','stop','vib')]),
 'die':('m{0}he{V}',[('o','mid','lab','nas','vib')]),'heart':('k{0}rasAw',[('o','diph','vel','stop','vib')]),
 'red':('v{0}{M}meLu',[('e','mid','lab','fric','vib')]),'neck':('p{0}Skosu',[('e','mid','lab','stop','fric')]),
 'round':('h{0}dQndu',[('e','mid','vel','fric','stop')]),'star':('{0}Strela',[('e','mid',None,'none','fric')]),
 'grease':('g{0}{M}dura',[('o','high','vel','stop','vib')]),'knee':('Z{0}eLu',[('o','mid','pal','fric',None)]),
 'ear':('{0}reLa',[('o','mid',None,'none','vib')]),'you':('v{0}se',[('o','mid','lab','fric','fric')]),
 'person':('p{0}soa',[('e','mid','lab','stop','fric')]),
 'woman':('muLE{N}',[]),'flesh':('ka{M}ni',[]),'tree':('a{M}vori',[]),'green':('ve{M}{P}',[]),
 'tooth':('d3n{P}',[]),'hot':('k3n{P}',[]),'big':('grAn{Pd}',[]),'night':('noj{P}',[]),'this':('eS{P}',[]),
 'see':('ve{V}',[]),'hear':('ovi{V}',[]),'know':('sabe{V}',[]),'kill':('mata{V}',[]),'swim':('nada{V}',[]),'fly':('voa{V}',[]),
 'walk':('Anda{V}',[]),'come':('vi{V}',[]),'give':('da{V}',[]),'say':('dize{V}',[]),'burn':('kejma{V}',[]),
 'we':('nOjs',[]),'many':('mUITUIs',[]),'two':('dojs',[]),'root':('hais',[]),'nose':('naris',[]),'smoke':('fumasa',[]),
}
def variants(concept,base):
    if concept not in W: return [(base,1.0)]
    t,slots=W[concept]; opts=[]
    for s in slots: opts.append(pretonic(*s))
    keys=[]
    if '{V}' in t: keys.append(('V',[('',VERB_R[0]/VERB_R[1]),('h',1-VERB_R[0]/VERB_R[1])]))
    if '{N}' in t: keys.append(('N',R(*NONVERB_R)))
    if '{M}' in t: keys.append(('M',[('',MID_R[0]/MID_R[1]),('h',1-MID_R[0]/MID_R[1])]))
    if '{P}' in t: keys.append(('P',[('Ci',PAL),('ti',1-PAL)]))
    if '{Pd}' in t: keys.append(('Pd',[('7i',PAL),('di',1-PAL)]))
    out=[]
    for combo in itertools.product(*opts,*[k[1] for k in keys]):
        vs=combo[:len(opts)]; ks=combo[len(opts):]
        w=t; p=1
        for i,(seg,pr) in enumerate(vs): w=w.replace('{%d}'%i,seg); p*=pr
        for (name,_),(seg,pr) in zip(keys,ks): w=w.replace('{'+name+'}',seg); p*=pr
        out.append((w,p))
    return out
rows=list(csv.DictReader(open('swadesh_recife.tsv'),delimiter='\t'))
E=[]; show={}
for r in rows:
    vs=variants(r['concept'],r['RE']); E.append(sum(p*lev(r['ES'],w) for w,p in vs))
    show[r['concept']]=sorted(vs,key=lambda x:-x[1])[:3]
d=st.mean(E); dEP=st.mean(lev(r['ES'],r['EP']) for r in rows)
print('E[distance] Spanish–Recife',round(d,3),' Spanish listener',round(35.7-119.06*(d-dEP),1),' Recife listener',round(62.0-119.06*(d-dEP),1))
for c in ['small','sleep','eat','seed','round','star','heart']: print(c,[(w,round(p,2)) for w,p in show[c]])
