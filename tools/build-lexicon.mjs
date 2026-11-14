// Builds src/rules/data/lexicon.ts from the Hunspell en_US and en_GB dictionaries derived from SCOWL (Kevin Atkinson,
// wordlist.sourceforge.net; npm packages dictionary-en 4.0.0 and dictionary-en-gb 3.0.0): every stem written in lower case
// (common words; names and abbreviations are written with capitals there and stay out). Usage:
// node tools/build-lexicon.mjs <path to en_US index.dic> <path to en_GB index.dic>
import fs from 'node:fs';
const words = new Set();
for (const f of process.argv.slice(2)) for (const line of fs.readFileSync(f, 'utf8').split('\n').slice(1)) {
    const w = line.split('/')[0].trim();
    if (/^[a-z][a-z'-]*$/.test(w)) words.add(w);
}
const list = [...words].sort();
fs.writeFileSync(new URL('../src/rules/data/lexicon.ts', import.meta.url), `// Common English words (stems written in lower case in the Hunspell en_US and en_GB dictionaries derived from SCOWL), built
// by tools/build-lexicon.mjs (${list.length} words). Source: SCOWL, Copyright 2000-2018 Kevin Atkinson, wordlist.sourceforge.net;
// licence and credits in docs/data/scowl-license.txt.
export const LEXICON = ${JSON.stringify(list.join(' '))};
`);
console.log(`${list.length} words`);
