// WORLD's synthesis (Morise, Yokomori & Ozawa 2016, IEICE Trans Inf Syst E99-D:1877; github.com/mmorise/World, modified BSD
// licence, src/synthesis.cpp and the parts of common.cpp and matlabfunctions.cpp it calls), ported line by line to TypeScript:
// speech from a pitch track, a spectral envelope and an aperiodicity per frame. Each glottal pulse (one per period where
// voiced, at 500 Hz where not) adds a minimum-phase response of the envelope's periodic part and of its noise part filtered by
// the aperiodicity. The natural voice (pocket.ts) uses it to give the averaged person a body's pitch, tract and pace.

/** A radix-2 complex FFT in place (re, im of length n, a power of 2); sign −1 forward, +1 backward, unnormalised (FFTW's). */
export function fft(re: Float64Array, im: Float64Array, sign: 1 | -1): void {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { let t = re[i]!; re[i] = re[j]!; re[j] = t; t = im[i]!; im[i] = im[j]!; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const a = sign * 2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), half = len >> 1;
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < half; k++) {
                const p = i + k, q = p + half, tr = re[q]! * cr - im[q]! * ci, ti = re[q]! * ci + im[q]! * cr;
                re[q] = re[p]! - tr; im[q] = im[p]! - ti; re[p] = re[p]! + tr; im[p] = im[p]! + ti;
                const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
            }
        }
    }
}
/** A seeded standard normal draw (xorshift128 and Box–Muller), so a synthesis can be repeated. */
export function normalSource(seed = 88675123): () => number {
    let x = 123456789, y = 362436069, z = 521288629, w = seed >>> 0, spare: number | null = null;
    const u = () => { const t = x ^ (x << 11); x = y; y = z; z = w; w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) >>> 0; return (w + 1) / 4294967297; };
    return () => {
        if (spare !== null) { const s = spare; spare = null; return s; }
        const r = Math.sqrt(-2 * Math.log(u())), a = 2 * Math.PI * u(); spare = r * Math.sin(a); return r * Math.cos(a);
    };
}

/** The minimum-phase spectrum (bins 0..n/2, re and im) of a log amplitude spectrum (bins 0..n/2; GetMinimumPhaseSpectrum). */
function minimumPhase(logHalf: Float64Array, n: number, outRe: Float64Array, outIm: Float64Array): void {
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i <= n / 2; i++) re[i] = logHalf[i]!;
    for (let i = n / 2 + 1; i < n; i++) re[i] = logHalf[n - i]!;
    fft(re, im, -1);                                         // the cepstrum (WORLD's "inverse_fft": an r2c forward)
    im[0] = -im[0]!;
    for (let i = 1; i < n / 2; i++) { re[i] = re[i]! * 2; im[i] = -im[i]! * 2; }
    im[n / 2] = -im[n / 2]!;
    for (let i = n / 2 + 1; i < n; i++) { re[i] = 0; im[i] = 0; }
    fft(re, im, -1);
    for (let i = 0; i <= n / 2; i++) { const t = Math.exp(re[i]! / n); outRe[i] = t * Math.cos(im[i]! / n); outIm[i] = t * Math.sin(im[i]! / n); }
}
/** The real waveform of a half spectrum (bins 0..n/2), unnormalised (FFTW's c2r), shifted by half its length (fftshift). */
function realShifted(re: Float64Array, im: Float64Array, n: number, out: Float64Array): void {
    const R = new Float64Array(n), I = new Float64Array(n);
    for (let i = 0; i <= n / 2; i++) { R[i] = re[i]!; I[i] = im[i]!; }
    for (let i = n / 2 + 1; i < n; i++) { R[i] = re[n - i]!; I[i] = -im[n - i]!; }
    fft(R, I, 1);
    for (let i = 0; i < n / 2; i++) { out[i] = R[i + n / 2]!; out[i + n / 2] = R[i]!; }
}
const safeAp = (x: number) => Math.max(0.001, Math.min(0.999999999999, x));

/** WORLD Synthesis(): f0 (Hz, 0 unvoiced) per frame, the envelope and the aperiodicity per frame (bins 0..fftSize/2), the frame
 * period (ms), the rate (Hz) and the output's length in samples. */
export function synthesize(f0: ArrayLike<number>, sp: ArrayLike<number>[], ap: ArrayLike<number>[], fftSize: number, framePeriodMs: number, fs: number, yLength: number, seed = 1): Float32Array {
    const n = fftSize, half = n / 2, frames = f0.length, fp = framePeriodMs / 1000, randn = normalSource(seed), y = new Float64Array(yLength);
    // The time base: f0 and voicing linear between frames, pulses where the accumulated phase passes 2π.
    const lowest = fs / n + 1, cf0 = new Float64Array(frames + 1), cvuv = new Float64Array(frames + 1), ct = new Float64Array(frames + 1);
    for (let i = 0; i < frames; i++) { ct[i] = i * fp; cf0[i] = f0[i]! < lowest ? 0 : f0[i]!; cvuv[i] = cf0[i] === 0 ? 0 : 1; }
    ct[frames] = frames * fp; cf0[frames] = cf0[frames - 1]! * 2 - cf0[frames - 2]!; cvuv[frames] = cvuv[frames - 1]! * 2 - cvuv[frames - 2]!;
    const lin = (arr: Float64Array, t: number) => { const k = Math.min(frames - 1, Math.max(0, Math.floor(t / fp))); const s = (t - ct[k]!) / fp; return arr[k]! + s * (arr[k + 1]! - arr[k]!); };
    const vuv = new Uint8Array(yLength), pulses: number[] = [], shifts: number[] = [];
    let total = 0, prevWrap = 0;
    for (let i = 0; i < yLength; i++) {
        const t = i / fs, v = lin(cvuv, t) > 0.5 ? 1 : 0, f = v ? lin(cf0, t) : 500;
        vuv[i] = v; total += 2 * Math.PI * f / fs; const wrap = total % (2 * Math.PI);
        if (i > 0 && Math.abs(wrap - prevWrap) > Math.PI) {
            const y1 = prevWrap - 2 * Math.PI, y2 = wrap; pulses.push(i - 1); shifts.push((-y1 / (y2 - y1)) / fs);
        }
        prevWrap = wrap;
    }
    // The DC remover (GetDCRemover).
    const dc = new Float64Array(n); let dcSum = 0;
    for (let i = 0; i < half; i++) { dc[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 1) / (1 + n)); dc[n - i - 1] = dc[i]!; dcSum += dc[i]! * 2; }
    for (let i = 0; i < half; i++) { dc[i] = dc[i]! / dcSum; dc[n - i - 1] = dc[i]!; }
    const env = new Float64Array(half + 1), apr = new Float64Array(half + 1), logH = new Float64Array(half + 1), mr = new Float64Array(half + 1), mi = new Float64Array(half + 1);
    const per = new Float64Array(n), aper = new Float64Array(n), nr = new Float64Array(n), ni = new Float64Array(n), sr = new Float64Array(half + 1), si = new Float64Array(half + 1);
    for (let p = 0; p < pulses.length; p++) {
        const idx = pulses[p]!, t = idx / fs, noiseSize = pulses[Math.min(pulses.length - 1, p + 1)]! - idx, v = vuv[idx]!;
        // The envelope and the aperiodicity at the pulse (GetSpectralEnvelope, GetAperiodicRatio).
        const lo = Math.min(frames - 1, Math.floor(t / fp)), hi = Math.min(frames - 1, Math.ceil(t / fp)), w = t / fp - lo;
        for (let i = 0; i <= half; i++) {
            if (lo === hi) { env[i] = Math.abs(sp[lo]![i]!); apr[i] = safeAp(ap[lo]![i]!) ** 2; }
            else { env[i] = (1 - w) * Math.abs(sp[lo]![i]!) + w * Math.abs(sp[hi]![i]!); apr[i] = ((1 - w) * safeAp(ap[lo]![i]!) + w * safeAp(ap[hi]![i]!)) ** 2; }
        }
        // The periodic response (GetPeriodicResponse).
        per.fill(0);
        if (v > 0.5 && apr[0]! <= 0.999) {
            for (let i = 0; i <= half; i++) logH[i] = Math.log(env[i]! * (1 - apr[i]!) + 1e-12) / 2;
            minimumPhase(logH, n, mr, mi);
            const c = 2 * Math.PI * shifts[p]! * fs / n;
            for (let i = 0; i <= half; i++) { const r2 = Math.cos(c * i), i2 = Math.sqrt(1 - r2 * r2); sr[i] = mr[i]! * r2 + mi[i]! * i2; si[i] = mi[i]! * r2 - mr[i]! * i2; }
            realShifted(sr, si, n, per);
            let d = 0; for (let i = half; i < n; i++) d += per[i]!;
            for (let i = 0; i < half; i++) per[i] = -d * dc[i]!;
            for (let i = half; i < n; i++) per[i] = per[i]! - d * dc[i]!;
        }
        // The aperiodic response (GetAperiodicResponse): noise of the pulse's length, its mean taken out, filtered.
        nr.fill(0); ni.fill(0); let mean = 0;
        for (let i = 0; i < noiseSize; i++) { nr[i] = randn(); mean += nr[i]!; }
        mean /= Math.max(1, noiseSize); for (let i = 0; i < noiseSize; i++) nr[i] = nr[i]! - mean;
        fft(nr, ni, -1);
        for (let i = 0; i <= half; i++) logH[i] = Math.log(v !== 0 ? env[i]! * apr[i]! : env[i]!) / 2;
        minimumPhase(logH, n, mr, mi);
        for (let i = 0; i <= half; i++) { sr[i] = mr[i]! * nr[i]! - mi[i]! * ni[i]!; si[i] = mr[i]! * ni[i]! + mi[i]! * nr[i]!; }
        realShifted(sr, si, n, aper);
        const sq = Math.sqrt(noiseSize), offset = idx - half + 1;
        for (let j = Math.max(0, -offset); j < Math.min(n, yLength - offset); j++) y[j + offset] = y[j + offset]! + (per[j]! * sq + aper[j]!) / n;
    }
    return Float32Array.from(y);
}
