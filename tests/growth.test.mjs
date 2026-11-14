// Growth (src/rules/growth.ts, body-size.ts): the share of adult height at an age from Preece & Baines's Model 1 and the
// person's timing; the peak height velocity it implies; the male puberty window; WHO's references; BodySize under 19.
const G = await import('../src/rules/growth.js');
const B = await import('../src/rules/body-size.js');
let miss = 0, n = 0;
const ok = (c, m, got = '') => { n++; if (!c) { miss++; console.log(`MISS ${m}${got ? `: ${got}` : ''}`); } };
const near = (a, b, d) => Math.abs(a - b) <= d;

// G1: the curve: at θ the share is hθ ÷ h1 (boys 162.9 ÷ 174.6, girls 152.7 ÷ 163.4); its mean curve peaks in velocity at
// 14.19 and 11.90 years, as the children's own peaks average 14.17 and 11.87 (Preece & Baines 1978, Tables 11 and 12); a
// timing draw of +1 moves a boy's peak by about θ's SD (0.93 years); WHO's median shape below 5 joins it at 5.
{
  const b = G.aphvOf(true), g = G.aphvOf(false), late = G.aphvOf(true, 1);
  ok(near(G.heightShare(true, 14.6), 162.9 / 174.6, 1e-12) && near(G.heightShare(false, 12.49), 152.7 / 163.4, 1e-12) && near(b, 14.17, 0.05) && near(g, 11.87, 0.05)
      && near(late - b, 0.93, 0.02) && near(G.heightShare(true, 4.9999), G.heightShare(true, 5), 1e-4) && G.heightShare(true, 25) > 0.9999 && G.heightShare(false, 2) < G.heightShare(false, 4),
      'the growth curve and its timing', JSON.stringify([b, g, late, G.heightShare(true, 4.9999), G.heightShare(true, 5)]));
}
// G2: the male voice change runs from 2 years before the boy's own peak height velocity to 1 year after, linearly; none for
// girls. WHO's reference: BMI 16.44 for a boy of 10 at z 0; height 137.8 cm.
{
  const p = G.aphvOf(true);
  ok(G.malePuberty(true, p - 2.01) === 0 && near(G.malePuberty(true, p - 0.5), 0.5, 1e-9) && G.malePuberty(true, p + 1.01) === 1 && G.malePuberty(false, 14) === 0
      && near(G.whoAt('bmi', true, 10), 16.44, 0.01) && near(G.whoAt('hgt', true, 10), 137.8, 0.1) && G.whoAt('bmi', false, 15, 1) > G.whoAt('bmi', false, 15),
      'the puberty window and the WHO references', '');
}
// G3: BodySize under 19: a US boy of 10 is his adult height's share at 10 (77.6 % of 181 cm here), his BMI the WHO
// reference's at his z; at 19 the adult draw.
{
  let i = 0; const g = () => [0.5, -0.3][i++ % 2];
  const kid = B.bodySize('United States', 'male', 2000, 2010, g, 0, 0); i = 0;
  const man = B.bodySize('United States', 'male', 2000, 2019, g, 0, 0);
  ok(near(kid.heightCm / man.heightCm, G.heightShare(true, 10), 1e-9) && near(kid.massKg / (kid.heightCm / 100) ** 2, G.whoAt('bmi', true, 10, -0.3), 1e-9) && !man.notes.some(x => /growing/.test(x)),
      'a growing body', JSON.stringify([kid, man]));
}
console.log(`growth: ${n - miss} of ${n}`); process.exitCode = miss ? 1 : 0;
