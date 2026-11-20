import { dietMinimum, bassShare, townWords } from './seed.js';
import { def, k } from './constants.js';
export const MURDER_PER_100K = 1.0;
/** Deaths (or opened graves) a year per 100,000 people that the living find. */
export function seenPer100k(law, share, deaths) {
    const diet = law?.diet;
    if (!diet)
        return deaths;
    if (diet.prey === 'K')
        return deaths;
    if (diet.prey === 'R')
        return share * 1e5 * dietMinimum(diet, law.mass ?? 70, !!law?.body?.includes('NO_HEAT')).bodiesYear;
    return 0;
}
def({ id: 'stageRun', value: 0.5, unit: 'times ordinary murder: a run of killings is noticed', status: 'assumed', src: 'half again the murders a town expects stands out [ASSUMED]', range: [0.25, 1], file: 'society.ts' });
def({ id: 'stagePanic', value: 5, unit: 'times ordinary murder: a panic', status: 'assumed', src: 'five times the murders a town expects [ASSUMED]', range: [2, 10], file: 'society.ts' });
def({ id: 'stageEmergency', value: 100, unit: 'times ordinary murder: an emergency', status: 'assumed', src: 'a twentieth of all deaths (1,890 per 100,000 in 1881) [ASSUMED]', range: [30, 300], file: 'society.ts' });
def({ id: 'stageCollapse', value: 1000, unit: 'times ordinary murder: collapse', status: 'assumed', src: 'half of all deaths (1,890 per 100,000 in 1881) [ASSUMED]', range: [300, 3000], file: 'society.ts' });
def({ id: 'nameKnownMin', value: 0.1, unit: 'share who know a name before the deaths are put on the kind', status: 'assumed', src: 'a tale a tenth know is not yet the town\'s [ASSUMED]', range: [0.05, 0.2], file: 'society.ts' });
export const stageOf = (times) => times < k('stageRun') ? 'unnoticed' : times < k('stagePanic') ? 'a run of killings' : times < k('stageEmergency') ? 'a panic' : times < k('stageCollapse') ? 'an emergency' : 'collapse';
/** How the country lives with the kind in `year`: the stage, what people believe, and the lines that say so. */
export function societyOf(p, year) {
    const seen = seenPer100k(p.law, p.share, p.deaths), times = seen / MURDER_PER_100K, stage = stageOf(times);
    const believe = Math.max(0, ...p.names.map(n => n.year <= year ? bassShare(year - n.year) : 0));
    const first = p.names[0]?.name, name = first && first.length <= 30 ? `"${first}"` : 'them';
    const kills = p.law?.diet?.prey === 'R' ? 'opened graves' : 'deaths';
    const lines = [];
    lines.push(stage === 'unnoticed'
        ? `What they leave is lost among ordinary ${kills === 'deaths' ? 'deaths' : 'disturbances of the dead'}: ${num(seen)} a year in 100,000 people, beside about ${MURDER_PER_100K} murder.`
        : `${cap(kills)} the living find: ${num(seen)} a year in 100,000 people, ${times < 1.5 ? 'about as many as' : `${num(times)} times`} the ordinary murders.`);
    const BLAME = { 'unnoticed': 'know them only as a tale', 'a run of killings': 'know the tale; a few lay the deaths at their door, and the papers, doctors and clergy mock it', 'a panic': 'know the tale, and many now blame them; the papers print both the fear and the scorn', 'an emergency': 'know the tale, and most blame them', 'collapse': 'know the tale, and no one doubts it' };
    lines.push(believe < k('nameKnownMin') ? `Few have a name for them: the ${kills} are put down to murder, accident or disease.` : `${pct(believe)} have heard ${name === 'them' ? 'of them' : `them called ${name}`}: they ${BLAME[stage]}.`);
    // What England and Wales had in 1881, and what history shows such a stage brings [history, as commonly dated].
    const BY = {
        // As the year has them (section 118): the county police allowed from 1839 and required from 1856; the newspaper stamp
        // duty gone in 1855, the paper duty in 1861; London's Medical Officers of Health from 1855, every district's from 1872.
        'unnoticed': year < 1856 ? 'Coroners hold inquests on sudden deaths and return the usual verdicts; the borough police, and the county forces some counties have formed (allowed since 1839, required only from 1856), look for ordinary killers.'
            : 'Coroners hold inquests on sudden deaths and return the usual verdicts; the county police (compulsory since 1856) look for ordinary killers.',
        'a run of killings': `The police and coroners treat them as murders; ${year < 1855 ? 'the papers, still dear under the stamp duty (it goes in 1855),' : year < 1861 ? 'the daily papers (cheap since the stamp duty went in 1855)' : 'the daily papers (cheap since the stamp and paper duties went, 1855 and 1861)'} run the series, as five murders in Whitechapel in 1888 filled them for months and raised a citizens' vigilance committee.`,
        'a panic': 'Families watch their dead and some dig them up, as New England families did for consumption from 1784 to the 1890s; parishes and the Home Office are pressed, as the Habsburg army surgeons were sent to report on the Serbian villages in 1732.',
        'an emergency': year < 1872 ? 'The state acts: special constables, curfews, inquiries in Parliament; Medical Officers of Health, where a town has one (London\'s districts since 1855; every district only from the Public Health Acts of 1872 and 1875), count the dead.'
            : 'The state acts: special constables, curfews, inquiries in Parliament; Medical Officers of Health (in every district since the Public Health Acts of 1872 and 1875) count the dead.',
        'collapse': 'Ordinary life fails: the dead outrun the burials and the officers who would count them; whoever can, leaves.',
    };
    lines.push(BY[stage]);
    // Fiction's patterns where the kind is real and known (marked as fiction's).
    const fiction = stage === 'unnoticed' ? 'In fiction, a kind this rare keeps its own secret (Vampire: the Masquerade\'s one in 100,000).'
        : stage === 'a panic' || stage === 'an emergency' ? 'In fiction, a known kind at this pitch brings an office to hunt it (Tokyo Ghoul\'s CCG, Hellsing\'s Crown agency) and hunters paid by the head (The Witcher).'
            : stage === 'a run of killings' ? 'In fiction, a kind the state comes to know of is hunted and studied in secret (Ajin\'s commission) and hated in public.'
                : 'In fiction, the kind outgrows its food: the living are farmed and the starving kind degenerates (Daybreakers).';
    return { year, seen, times, stage, believe, lines, fiction };
}
/** The player's character's town (town.ts): its size, what is found there a year, and how much since the story began. */
export function townLine(t, who) {
    const found = t.people * t.seen / 1e5, what = t.how === 'grave' ? 'graves found opened' : 'bodies found';
    return `${who} lives in ${townWords(t.people)}: ${found >= 0.05 ? `about ${num(found)} ${what} there a year` : 'in most years nothing of theirs is found there'}${t.killed ? `, ${t.killed} since the story began` : ''}.`;
}
/** The narrator's [SOCIETY] block; with the player's character's town, a line for it. */
export const societyBlock = (s, town) => `[SOCIETY]\nHow the country lives with them in ${s.year} (${s.stage}). ${s.lines.join(' ')}${` ${s.fiction} (a pattern from fiction, not history: use it only as the story's people would.)`}${town ? `\n${townLine(town, "The player's character")}` : ''}\n[/SOCIETY]`;
const num = (x) => x >= 100 ? Math.round(x).toLocaleString('en-GB') : x >= 1 ? String(Math.round(x * 10) / 10) : String(Number(x.toPrecision(2)));
const pct = (x) => `${Math.round(x * 100)} %`;
const cap = (t) => `${t[0].toUpperCase()}${t.slice(1)}`;
