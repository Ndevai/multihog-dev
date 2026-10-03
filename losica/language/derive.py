"""Derive Komuheft and Tegofarela forms from Proto-Losica roots.

Every step cites the rule it implements. Steps marked READING or CHOICE fill a
gap the language documents leave open; they are listed in GAPS.
"""
MULTI = ['kʷ', 'gʷ', 'kʼ', 'ts', 'tʃ']
VOW = set('aeiouɑɛɔɨʉ')


def seg(w):
    out, i = [], 0
    while i < len(w):
        for m in MULTI:
            if w.startswith(m, i):
                out.append(m); i += len(m); break
        else:
            out.append(w[i]); i += 1
    return out


def is_v(x):
    return bool(x) and x[0] in VOW


# ---------------- Komuheft ----------------
K_CODA = {'p', 't', 'k', 'g', 'm', 'n', 'ŋ', 'r'}


def komuheft(root):
    s, log = seg(root), []
    step = lambda n: log.append((n, ''.join(s).replace('G', 'g')))
    if len(s) >= 2 and s[-2] == 'kʷ' and s[-1] == 'o':
        s[-1] = 'e'; step('*kʷo# > *kʷe#')
    if any(s[i] == 'kʷ' and s[i + 1] == 'e' for i in range(len(s) - 1)):
        s = ['tʃ' if (x == 'kʷ' and i + 1 < len(s) and s[i + 1] == 'e') else x for i, x in enumerate(s)]
        step('*kʷe > *tʃe')
    assert not any(s[i] == 'ts' and i + 1 < len(s) and s[i + 1] == 'i' for i in range(len(s))), '*tsi undefined'
    if 'ts' in s:
        s = [x for x in s if x != 'ts']; step('*ts > *s > *h > 0')
    if 'tʃ' in s:
        s = ['ʃ' if x == 'tʃ' else x for x in s]; step('*tʃ > ʃ')
    new = [{'n': 'ɲ', 'l': 'ʎ'}[x] if x in ('n', 'l') and i + 1 < len(s) and s[i + 1] in ('i', 'j') else x
           for i, x in enumerate(s)]
    if new != s:
        s = new; step('*n, *l > ɲ, ʎ / _i, _j')
    new = []
    for i, x in enumerate(s):
        between = i > 0 and is_v(s[i - 1]) and i + 1 < len(s) and is_v(s[i + 1])
        new.append({'p': 'f', 't': 'θ', 'kʷ': 'hʷ'}.get(x, ('G' if between else 'h') if x == 'k' else x))
    if new != s:
        s = new; step('*p *t *k *kʷ > f θ h(~g / V_V) hʷ')
    new = [{'b': 'p', 'd': 't', 'g': 'k', 'gʷ': 'kʷ'}.get(x, x) for x in s]
    if new != s:
        s = new; step('*b *d *g *gʷ > p t k kʷ')
    s = ['g' if x == 'G' else x for x in s]
    if 'kʼ' in s:
        s = ['k' if x == 'kʼ' else x for x in s]; step('*kʼ > k')
    if 'β' in s:
        s = ['u' if x == 'β' else x for x in s]; step('*β > *v > u')
    # merge k/h + w in onset
    i, out = 0, []
    while i < len(s):
        if s[i] in ('k', 'h') and i + 2 < len(s) and s[i + 1] == 'w' and is_v(s[i + 2]):
            out.append(s[i] + 'ʷ'); i += 2
        else:
            out.append(s[i]); i += 1
    if out != s:
        s = out; step('kw, hw > kʷ, hʷ')
    # coda processes: a consonant is coda if followed by C or #
    new = []
    for i, x in enumerate(s):
        coda = not is_v(x) and (i + 1 == len(s) or not is_v(s[i + 1]))
        if coda and x == 'h':
            continue
        if coda and x in ('kʷ', 'hʷ', 'l'):
            new.append('w'); continue
        new.append(x)
    if new != s:
        s = new; step('coda: h > 0; kʷ hʷ l > w')
    new = []
    for i, x in enumerate(s):
        new.append(x)
        if not is_v(x) and x not in ('j', 'w'):
            nxt = s[i + 1] if i + 1 < len(s) else '#'
            coda = nxt == '#' or not is_v(nxt)
            if coda and x not in K_CODA and nxt not in ('j', 'w'):
                new.append('i')
    if new != s:
        s = new; step('epenthesis Ø > i / illegal coda')
    return ''.join(s), log


def k_syllables(form):
    s = seg(form.replace('hʷ', 'H').replace('kʷ', 'K'))
    s = [{'H': 'hʷ', 'K': 'kʷ'}.get(x, x) for x in s]
    nuclei = [i for i, x in enumerate(s) if x in 'aeiou' and not (
        x in 'iu' and ((i > 0 and s[i - 1] in 'aeiou') or (i + 1 < len(s) and s[i + 1] in 'aeiou')) and False)]
    return s, nuclei


def komuheft_surface(form):
    s, nuc = k_syllables(form)
    stress = nuc[-2] if len(nuc) >= 2 else nuc[-1]
    out = []
    for i, x in enumerate(s):
        if i in nuc and i != stress:
            final = i == nuc[-1]
            x = {'a': 'ə', 'e': 'i', 'o': 'u'}.get(x, x)
        if x == 'hʷ' and i == 0:
            x = 'w'
        if x in ('p', 't', 'k') and i + 1 == stress:
            x += 'ʰ'
        if x == 'g' and 0 < i < len(s) - 1 and s[i - 1] in 'aeiou' and s[i + 1] in 'aeiou':
            x = 'ɣ'
        if x == 'r' and i == len(s) - 1:
            x = '(ɾ)'
        elif x == 'r':
            x = 'ɾ' if i + 1 < len(s) and s[i + 1] in 'aeiou' else 'ɹ'
        out.append(x)
    j = stress
    if j - 1 >= 0 and s[j - 1] not in 'aeiou':
        j -= 1
        if s[j] in ('j', 'w') and j - 1 >= 0 and s[j - 1] not in 'aeiou':
            j -= 1
    out[j] = 'ˈ' + out[j]
    # move stress mark before the onset of the stressed syllable
    txt = ''.join(out)
    return txt


# ---------------- Tegofarela ----------------
def tegofarela(root):
    s, log = seg(root), []
    mora = {}  # index -> extra retained mora count
    step = lambda n: log.append((n, render_t(s, mora)))
    if 'kʷ' in s:
        s = ['p' if x == 'kʷ' else x for x in s]; step('*kʷ > *fʷ > *f > p')
    if 'kʼ' in s:
        s = ['ʔ' if x == 'kʼ' else x for x in s]; step('*kʼ > ʔ')
    if 'ts' in s:
        s = ['h' if x == 'ts' else x for x in s]; step('*ts > *s > h')
    new = ['ɰ' if x == 'g' and 0 < i < len(s) - 1 and is_v(s[i - 1]) and is_v(s[i + 1]) else x
           for i, x in enumerate(s)]
    if new != s:
        s = new; step('*g > ɰ / V_V')
    new = ['ʋ' if x == 'gʷ' and i + 1 < len(s) and is_v(s[i + 1]) else x for i, x in enumerate(s)]
    if new != s:
        s = new; step('*gʷ > *vʷ > ʋ / _V   [READING-T1]')
    assert 'gʷ' not in s, '*gʷ outside prevocalic position: reflex undefined'
    assert 'u' not in s, 'Proto *u: Tegofarela reflex undefined'
    # vowels
    vidx = [i for i, x in enumerate(s) if x in 'aeio']
    new = list(s)
    for k, i in enumerate(vidx):
        nxt = s[vidx[k + 1]] if k + 1 < len(vidx) else None
        if s[i] == 'a':
            new[i] = 'ɑ'
        elif s[i] == 'e':
            new[i] = 'ɛ' if nxt == 'a' else 'e'
        elif s[i] == 'o':
            new[i] = 'ɔ' if nxt == 'a' else 'o'
    s = new; step('*a > ɑ̟; *e *o > ɛ ɔ / _C₀a, else e̞ o̞   [READING-T2]')
    if s[-1] in ('β', 't', 'k') and is_v(s[-2]):
        s = s[:-1]; mora[len(s) - 1] = mora.get(len(s) - 1, 0) + 1
        step('final *β *t *k > 0 + retained mora')
    i = 1
    while i < len(s) - 1:
        if s[i] == 'r' and is_v(s[i - 1]) and is_v(s[i + 1]):
            del s[i]
            # shift mora keys
            mora = {(k if k < i else k - 1): v for k, v in mora.items()}
            mora[i - 1] = mora.get(i - 1, 0) + 1
            step('*r > 0 / V_V (simple form) + retained mora   [READING-T3]')
        else:
            i += 1
    if 'r' in s:
        s = ['ɾ' if x == 'r' else x for x in s]
    return s, mora, log


def render_t(s, mora):
    out = []
    for i, x in enumerate(s):
        x = {'e': 'e̞', 'o': 'o̞', 'ɑ': 'ɑ̟', 'r': 'ɾ'}.get(x, x)
        out.append(x + ('ː' if mora.get(i) else ''))
    return ''.join(out)


def t_stress(s, mora):
    nuc = [i for i, x in enumerate(s) if is_v(x)]
    weights = [1 + mora.get(i, 0) for i in nuc]
    total = sum(weights)
    if total <= 2:
        return 0
    # flatten moras -> syllable index
    flat = [k for k, w in enumerate(weights) for _ in range(w)]
    if len(weights) >= 2 and weights[-1] == 2 and weights[-2] == 2:
        return len(weights) - 3 if len(weights) >= 3 else 0
    return flat[-3]


ORTHO = {'ɑ': 'a', 'e': 'e', 'ɛ': 'ɛ', 'o': 'o', 'ɔ': 'ɔ', 'i': 'i', 'ɨ': 'y', 'ʉ': 'u', 'ɰ': 'wg', 'ʋ': 'v',
         'ʔ': "'", 'ɲ': 'nj', 'ʎ': 'lj', 'ŋ': 'ng', 'ɕ': 'sj', 'ɾ': 'r', 'ɥ': 'wj'}


def t_ortho(s, mora):
    out = []
    for i, x in enumerate(s):
        o = ORTHO.get(x, x)
        out.append(o * 2 if (is_v(x) and mora.get(i)) else o)
    return ''.join(out)


ROOTS = [
    ('WEAVE', 'ambient field of magical energy', 'kʷarema'),
    ('CONDUIT', 'energy-carrying channel in the soul', 'tsonek'),
    ('NEXUS', 'knot of fused conduits', 'gʷadin'),
    ('SOUL', 'the bearer of conduits', 'amiwo'),
    ('ENERGY', 'refined spiritual energy (PE)', 'bekʼat'),
    ('PURITY', 'efficiency of the conduit network', 'ilena'),
    ('PATTERN', 'the structure a spell holds', 'dokʷo'),
    ('PRACTICE', 'repeated casting that widens conduits', 'pagerak'),
    ('CORE', 'condensed energy inside a beast', 'kʼoβ'),
    ('LAW', 'a governing regularity of the world', 'tatir'),
]

if __name__ == '__main__':
    for gloss, defin, root in ROOTS:
        k, klog = komuheft(root)
        ts, mora, tlog = tegofarela(root)
        st = t_stress(ts, mora)
        print(f'\n## {gloss} — {defin}\nProto-Losica *{root}')
        print('Komuheft:')
        for n, f in klog:
            print(f'   {f:14} {n}')
        print(f'   => /{k}/  surface [{komuheft_surface(k)}]')
        print('Tegofarela:')
        for n, f in tlog:
            print(f'   {f:14} {n}')
        print(f'   => /{render_t(ts, mora)}/  ⟨{t_ortho(ts, mora)}⟩  stress on syllable {st + 1}')
