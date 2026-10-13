// When a thing first exists in this world: the earliest dated invention it matches (Wikipedia's timeline and the Wikidata
// export), moved by the world book's changes (a person gone, an invention made earlier). Used to refuse anachronisms in code:
// a Claim or a Transfer of a thing not yet invented at the story's date.
import { INVENTIONS } from './data/inventions.js';
import { WD_INVENTIONS } from './data/wikidata-inventions.js';
import { GAPS } from './data/inventions.js';
import type { Entry } from './world.js';
import type { Rng } from './types.js';
import { READ, earliestYear } from './things.js';
import { resolveLanguage } from './languages.js';

const STOP = new Set(['a', 'an', 'the', 'of', 'first', 'early', 'modern', 'new', 'his', 'her', 'their', 'some']);
const words = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/)
    .filter(w => w && !STOP.has(w)).map(w => w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

/** A dated invention matches an item when every word of the item is in its name and the name has at most 2 more words. */
function matches(item: string, label: string): boolean {
    const a = words(item), b = words(label);
    return a.length > 0 && b.length <= a.length + 2 && a.every(w => b.includes(w));
}

export interface Change { what: string; year: number; new_year?: number; never?: boolean }

/** The year `item` first exists in this world, the invention it matched, or null when it matches none. */
export function firstYear(item: string, book: Entry[] = []): { year: number; label: string } | null {
    for (const e of book) for (const c of e.changes ?? []) if (matches(item, c.what) || matches(c.what, item)) {
        return c.never ? { year: Infinity, label: c.what } : { year: c.new_year ?? c.year, label: c.what };
    }
    // A thing the question model linked this turn: its own year, or the dated invention its name matches.
    const read = READ.find(r => matches(item, r.phrase) || matches(r.phrase, item) || matches(item, r.label));
    if (read?.year != null) return { year: read.year, label: read.label };
    if (read) item = read.label;
    let best: { year: number; label: string } | null = null;
    // Earliest year; at the same year the shorter name (the plainer match).
    for (const [y, label] of [...INVENTIONS, ...WD_INVENTIONS]) if (matches(item, label) && (!best || y < best.year || y === best.year && words(label).length < words(best.label).length)) best = { year: y, label };
    // Not linked this turn: the things list by exact name, when every thing that name can mean is dated.
    return best ?? earliestYear(item);
}

/** '' when `item` can exist at `year`; else the reason, for the tool result. */
export function anachronism(item: string, year: number | null, book: Entry[] = []): string {
    if (year == null) return '';
    const f = firstYear(item, book);
    if (!f || f.year <= year) return '';
    return f.year === Infinity ? `nobody has made ${f.label} in this world` : `${f.label} is first made in ${f.year}, after the story's year ${year}`;
}

/**
 * An invention made earlier than in real history, by an inventor ahead of the field. How far ahead a first inventor was:
 * the gaps between the first two discoverers of listed multiples (median 1 year, 90 % within 25). The chosen lead holds
 * with the share of gaps at least that long; otherwise the invention comes at real year − a gap drawn from those shorter.
 */
export function earlier(real: number, wanted: number, rng: Rng): { year: number; share: number } {
    const lead = real - wanted;
    if (lead <= 0) return { year: real, share: 1 };
    const share = GAPS.filter(g => g >= lead).length / GAPS.length;
    if (rng() < share) return { year: wanted, share };
    const shorter = GAPS.filter(g => g < lead);
    return { year: real - (shorter.length ? shorter[Math.floor(rng() * shorter.length)] : 0), share };
}

/**
 * One check for whether something can exist in the story's year: a thing (inventions, Wikidata items, world-book changes),
 * a language or its stage, or a world-book addition (a creature, people or institution before its `since`). Returns why
 * not, or ''. Claim, Transfer and Communicate all ask here, so anything given a year later is checked the same way.
 */
export function cannotExist(name: string, year: number | null, book: Entry[] = [], as: 'thing' | 'language' | 'being'): string {
    if (year === null || !name) return '';
    if (as === 'thing') return anachronism(name, year, book);
    if (as === 'language') return resolveLanguage(name, year, book).refused ?? '';
    const k = name.trim().toLowerCase();
    const e = book.find(x => x.since != null && (x.what.toLowerCase().includes(k) || k.includes(x.what.toLowerCase().replace(/s$/, '')) || x.species?.toLowerCase() === k));
    return e && year < e.since! ? `${e.what} exist in this world only since ${e.since}, not in ${year}` : '';
}

// Adoption by country (CHAT, Comin & Hobijn 2009, NBER w15319; 161 countries, 27 technologies as the story names them).
// A thing invented somewhere is not in use everywhere: IF the country's series records the years before the story's year and
// its first year of use is later → THEN having or using it there is rare (Claim needs its path). Years the series does not
// cover decide nothing.
type Chat = Record<string, { words: string[]; countries: Record<string, [number, number | null]> }>;
let CHAT: Chat | null = null, chatLoading: Promise<void> | null = null;
export function loadChat(): Promise<void> {
    chatLoading ??= fetch(new URL('../../rules/chat.json', import.meta.url)).then(r => r.json()).then(d => { CHAT = d; })
        .catch(e => { console.warn('[Rules engine] CHAT not loaded:', e); chatLoading = null; });
    return chatLoading;
}
// WMO station countries (the scene setting) named as CHAT names them.
const CHAT_NAME: Record<string, string> = { 'united states of america': 'United States', 'russian federation': 'Russia', 'republic of korea': 'South Korea',
    'viet nam': 'Vietnam', 'iran (islamic republic of)': 'Iran', 'syrian arab republic': 'Syria', "lao people's democratic republic": 'Laos',
    'united republic of tanzania': 'Tanzania', 'venezuela, bolivarian republic of': 'Venezuala', czechia: 'Czech Republic' };
/** The country and first year of use when `item` was not yet in use in `country` in `year`, by CHAT; else null. */
export function notYetIn(item: string, year: number | null, country: string | null | undefined): { country: string; first: number | null } | null {
    if (!CHAT || year === null || !country) return null;
    const k = item.trim().toLowerCase().replace(/^(a|an|the) /, '').replace(/s$/, ''), c = CHAT_NAME[country.toLowerCase()] ?? country;
    for (const t of Object.values(CHAT)) {
        if (!t.words.some(w => w === k || k.endsWith(` ${w}`))) continue;
        const v = t.countries[c];
        if (v && v[0] <= year && (v[1] === null || v[1] > year)) return { country: c, first: v[1] };
    }
    return null;
}
