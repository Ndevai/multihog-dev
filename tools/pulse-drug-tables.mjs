// Precomputes Pulse drug runs for the extension (rules/pulse/drugs/<job>.json): StandardMale, one bolus at minute 0, then
// the values at the end of each minute. Usage: node tools/pulse-drug-tables.mjs <outDir> <minutes> Drug:Route:mg ...
// Route: IV (intravenous) or IM (intramuscular). Runs on the WebAssembly build in rules/pulse, so any machine with Node runs it.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../rules/pulse');
const { default: Pulse } = await import(path.join(DIR, 'pulse.mjs'));
const [out, minutesArg, ...jobs] = process.argv.slice(2);
const MIN = Number(minutesArg);
fs.mkdirSync(out, { recursive: true });
const M = await Pulse();
for (const f of fs.readFileSync(path.join(DIR, 'files.txt'), 'utf8').split('\n').filter(Boolean)) {
    const rel = f.replace(/^\.\//, ''), p = `/pulse/${rel}`;
    M.FS.mkdirTree(path.dirname(p)); M.FS.writeFile(p, fs.readFileSync(path.join(DIR, 'data', rel)));
}
M._PulseInitialize();
const str = s => M.stringToNewUTF8(s);
const REQ = [['HeartRate', '1/min'], ['MeanArterialPressure', 'mmHg'], ['SystolicArterialPressure', 'mmHg'], ['DiastolicArterialPressure', 'mmHg'],
    ['RespirationRate', '1/min'], ['OxygenSaturation', ''], ['TidalVolume', 'mL'], ['SedationLevel', ''], ['NeuromuscularBlockLevel', ''],
    ['ArterialCarbonDioxidePressure', 'mmHg']];
const req = JSON.stringify({ DataRequest: REQ.map(([p, u]) => ({ Category: 'Physiology', PropertyName: p, ...(u ? { Unit: u } : {}) })) });
const zlib = await import('node:zlib');
const state = zlib.gunzipSync(fs.readFileSync(path.join(DIR, 'states/StandardMale@0s.json.gz'))).toString();
for (const job of jobs) {
    const [drug, route, mg] = job.split(':'), file = path.join(out, `${drug}_${route}_${mg}.json`);
    if (fs.existsSync(file)) continue;
    const e = M._Allocate(0, str('/pulse'));
    if (!M._SerializeFromString(e, str(state), str(req), 0)) { console.log(job, 'state failed'); continue; }
    const act = { AnyAction: [{ PatientAction: { SubstanceBolus: { Substance: drug, AdministrationRoute: route === 'IV' ? 'Intravenous' : 'Intramuscular',
        Concentration: { ScalarMassPerVolume: { Value: Number(mg), Unit: 'mg/mL' } }, Dose: { ScalarVolume: { Value: 1, Unit: 'mL' } } } } }] };
    if (!M._ProcessActions(e, str(JSON.stringify(act)), 0)) { console.log(job, 'action failed'); continue; }
    const rows = [], t0 = Date.now();
    for (let m = 0; m < MIN; m++) {
        if (!M._AdvanceTimeS(e, 60)) break;
        const p = M._PullData(e) / 8; rows.push(Array.from(M.HEAPF64.subarray(p + 1, p + 1 + REQ.length)).map(x => Math.round(x * 1000) / 1000));
    }
    M._Deallocate(e);
    fs.writeFileSync(file, JSON.stringify(rows));
    console.log(job, rows.length, 'min', ((Date.now() - t0) / 1000).toFixed(0) + ' s', JSON.stringify(rows[Math.min(4, rows.length - 1)]));
}
