// Quoted words: the pairs of quotation marks a line can quote speech in. English "…" and “…”; German „…“ with ‚…‘ inside, or
// »…« with ›…‹ inside, and Swiss «…» (Bier 2006, typokurz: Einige wichtige typografische Regeln, §2); «…» and ‹…› as in
// French, the single ones the Unicode names call quotation marks (U+2039, U+203A: single left- and right-pointing angle
// quotation mark). Single ‘…’ and '…' are left out, since the same signs are apostrophes ("I’ll", "the guards' door"). Every
// reader of the player's words takes quoted words alike (router, frame, intent, grammar, prosody): what is said in them is
// speech, not the player's acts.
export const QUOTED = /["“][^"”]*["”]|„[^"“”]*["“”]|‚[^‘’]*[‘’]|«[^«»]*»|»[^«»]*«|‹[^‹›]*›|›[^‹›]*‹/g;
/** A sign that opens quoted words. */
export const OPENS = /["“„‚«»‹›]/;
/** A sign that may close quoted words, as a character class for a pattern ("Run!« Tom nods": the next sentence starts past it). */
export const CLOSES = '["”“‘»«›‹]';
/** The first quoted words of two characters or more, without their marks. */
export const quotedWords = (text) => [...text.matchAll(QUOTED)].map(m => m[0].slice(1, -1)).find(q => q.length >= 2);
/** Whether position `at` is inside quoted words: after an opening sign that no closing sign before `at` closes. */
export const insideQuote = (text, at) => OPENS.test(text.slice(0, at).replace(QUOTED, ''));
