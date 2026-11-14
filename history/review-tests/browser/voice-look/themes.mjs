// SillyTavern's shipped themes as tests/ui.test.mjs lists them: name, text, chat tint, user message tint (over black).
export const THEMES = { dark: [['Azure', 'rgba(171, 198, 223, 1)', 'rgba(23, 23, 23, 0)', 'rgba(0, 28, 174, 0.2)'], ['Cappuccino', 'rgba(235, 235, 235, 1)', 'rgba(50, 45, 50, 0.75)', 'rgba(34, 30, 32, 0.75)'],
    ['Celestial Macaron', 'rgba(229, 175, 162, 1)', 'rgba(18, 26, 40, 0.9)', 'rgba(51, 67, 90, 0.7)'], ['Dark Lite', 'rgba(220, 220, 210, 1)', 'rgba(23, 23, 23, 1)', 'rgba(30, 30, 30, 0.9)'],
    ['Dark V 1.0', 'rgba(207, 207, 197, 1)', 'rgba(29, 33, 40, 0.9)', 'rgba(29, 33, 40, 0.9)']], light: [['light', 'rgba(30, 30, 30, 1)', 'rgba(243, 241, 234, 1)', 'rgba(255, 255, 255, 0.5)']] };
export const rgba = s => s.match(/[\d.]+/g).map(Number), hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const over = (t, b) => [0, 1, 2].map(i => t[i] * (t[3] ?? 1) + b[i] * (1 - (t[3] ?? 1)));
export const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const bgOf = ([, , chat, user]) => over(rgba(user), over(rgba(chat), [0, 0, 0]));
