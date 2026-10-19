export const SICK_SITUATIONS = ['a sea crossing', 'waking after surgery under general anaesthesia'];
/** Share who vomit at sea: under 15 by age; otherwise by sex, else overall. */
function seaShare(a) {
    if (a.age != null && a.age < 15)
        return 0.120;
    return a.sex === 'male' ? 0.050 : a.sex === 'female' ? 0.088 : 0.070;
}
// Of those who did not vomit, the share who felt unwell: (21.3 + 4.3 + 4.1 − 7.0) / (100 − 7.0), taking every passenger who
// vomited as one who felt unwell [ASSUMED from Table III's close agreement of the two].
const UNWELL_NOT_VOMITING = (21.3 + 4.3 + 4.1 - 7.0) / 93.0;
const APFEL = [0.10, 0.21, 0.39, 0.61, 0.79];
/** The outcome in words: who vomits, who feels sick, who is fine. */
export function sickness(who, a, rng) {
    const u = rng();
    if (a.situation === 'a sea crossing') {
        const v = seaShare(a);
        if (u < v)
            return `${who} is seasick and vomits during the crossing.`;
        return (u - v) / (1 - v) < UNWELL_NOT_VOMITING ? `${who} feels seasick during the crossing and keeps the food down.` : `${who} stays well during the crossing.`;
    }
    const n = [a.sex === 'female', !!a.motion_sickness_before, a.smoker === false, !!a.opioids].filter(Boolean).length;
    return u < APFEL[n] ? `${who} is sick with nausea or vomiting within a day of the operation.` : `${who} wakes from the operation without nausea.`;
}
