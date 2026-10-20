// Builds src/rules/data/verbnet.ts from VerbNet 3.4 (Kipper-Schuler 2005; github.com/cu-clear/verbnet, verbnet3.4/): each
// member verb with the classes it belongs to (a subclass member counts under its file's class). Multi-word members keep
// their underscore ("give_up"). Usage: node tools/build-verbnet.mjs <path to verbnet3.4>
import fs from 'node:fs';
const dir = process.argv[2];
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.xml')).sort()) {
    const cls = f.replace(/\.xml$/, '');
    for (const m of fs.readFileSync(`${dir}/${f}`, 'utf8').matchAll(/<MEMBER [^>]*name="([^"]+)"/g)) {
        const v = m[1].toLowerCase();
        (out[v] ??= []).includes(cls) || out[v].push(cls);
    }
}
const keys = Object.keys(out).sort();
fs.writeFileSync(new URL('../src/rules/data/verbnet.ts', import.meta.url), `// VerbNet 3.4 member verbs and their classes, built by tools/build-verbnet.mjs (${keys.length} verbs). Source: VerbNet 3.4,
// University of Colorado (Kipper-Schuler 2005; Palmer et al.), github.com/cu-clear/verbnet.
export const VERBNET: Record<string, string[]> = ${JSON.stringify(Object.fromEntries(keys.map(k => [k, out[k]])))};
`);
console.log(`${keys.length} verbs, ${Object.values(out).reduce((s, x) => s + x.length, 0)} verb-class pairs`);
