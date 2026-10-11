// Allen 2001, "The Great Divergence in European Wages and Prices from the Middle Ages to the First World War",
// Explorations in Economic History 38:411. Periods: 1500–49, 1550–99, … 1850–99, 1900–13; null = no figure.
export const PERIODS = [1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900];
// Table 3: prices in grams of silver per unit, Strasbourg averages 1745–1754 (olive oil and wine from note a).
export const GOODS = {
    'bread (kg)': 0.693, 'beans or peas (litre)': 0.477, 'meat (kg)': 2.213, 'butter (kg)': 3.470, 'cheese (kg)': 2.843,
    'egg (each)': 0.010, 'beer (litre)': 0.470, 'wine (litre)': 0.965, 'olive oil (litre)': 7.545, 'soap (kg)': 2.880,
    'linen (metre)': 4.369, 'candles (kg)': 4.980, 'lamp oil (litre)': 7.545, 'fuel (million BTU)': 4.164,
};
// Table 4: consumer price index, Strasbourg 1745–1754 = 1.00.
export const CPI = {
    Antwerp: [0.43, 0.94, 1.15, 1.14, 1.05, 1.10, 1.32, 1.77, 3.40], Amsterdam: [0.46, 0.89, 1.10, 1.22, 1.17, 1.32, 1.65, 2.46, 4.50],
    London: [0.45, 0.76, 1.25, 1.42, 1.34, 1.64, 2.55, 2.81, 5.08], Florence: [0.66, 1.00, 1.30, 1.13, 0.95, 1.18, 1.66, 2.74, 5.44],
    Naples: [0.64, 0.91, 1.08, null, 0.77, 1.06, 1.63, null, null], Valencia: [0.75, 1.47, 2.01, 1.85, 1.56, 1.74, null, null, null],
    Madrid: [null, 1.57, 2.23, 1.72, 1.23, 1.70, 2.17, 2.08, 3.62], Paris: [0.64, 1.30, 1.57, 1.61, 1.29, 1.43, 2.15, 3.10, 5.70],
    Strasbourg: [0.59, 0.95, 1.35, 1.13, 1.03, 1.22, 1.91, 2.39, null], Augsburg: [0.48, 0.87, 1.45, 1.05, 1.07, 1.21, 1.52, null, null],
    Leipzig: [null, 0.79, 1.41, 0.97, 0.98, 0.99, 1.17, 2.37, 5.40], Munich: [0.53, 0.88, 1.12, 0.95, 0.98, 0.98, null, null, null],
    Vienna: [0.43, 0.61, 1.01, 0.78, 0.74, 0.85, 1.08, null, null], Gdansk: [0.38, 0.59, 0.78, 0.84, 0.73, 0.86, 1.67, null, null],
    Krakow: [0.40, 0.55, 0.73, 0.61, 0.53, 0.65, 0.84, 1.59, 3.48], Warsaw: [null, 0.47, 0.68, 0.53, 0.59, 0.75, 0.84, 1.33, 2.82],
    Lwow: [0.31, 0.52, 0.65, 0.78, 0.64, 1.06, null, null, null],
};
CPI.Milan = CPI.Florence;
// Tables 1 and 2: daily wages of building craftsmen and labourers, grams of silver.
export const CRAFTSMAN = {
    Antwerp: [5.2, 10.3, 12.6, 11.8, 11.5, 11.5, 12.8, 20.5, 53.1], Amsterdam: [4.5, 7.0, 10.4, 11.9, 11.7, 11.9, 12.1, 21.4, 64.1],
    London: [5.0, 6.9, 11.3, 14.5, 14.7, 17.8, 28.9, 48.3, 106.4], Florence: [5.3, 7.5, 10.6, null, null, null, null, 15.9, 35.2],
    Milan: [null, null, 10.5, 8.0, 6.1, 5.4, 6.2, 13.2, 45.5], Naples: [6.8, 5.5, 7.8, null, 5.9, 5.7, 6.6, null, null],
    Valencia: [6.5, 8.5, 10.5, 10.3, 8.6, 7.6, null, null, null], Madrid: [6.2, 12.5, 20.1, 15.1, 11.6, 10.7, 16.5, 19.2, 32.0],
    Paris: [4.4, 9.0, 10.6, 11.0, 8.2, 9.3, 16.4, 34.4, 76.3], Strasbourg: [5.1, 5.5, 6.1, 8.3, 4.4, 5.5, 10.6, 11.7, null],
    Augsburg: [3.5, 4.2, 5.4, 6.5, 6.0, 5.4, 5.8, null, null], Leipzig: [2.9, 3.3, 6.8, 7.0, 6.2, 5.0, 6.7, 22.5, 71.9],
    Munich: [4.4, 5.0, 5.2, 4.7, 3.8, 3.2, null, null, 74.7], Vienna: [4.0, 3.9, 5.5, 5.2, 4.8, 4.8, 3.2, 6.6, 59.1],
    Gdansk: [2.8, 4.7, 6.4, 7.7, 6.7, 5.2, 8.0, null, null], Krakow: [3.8, 5.2, 4.2, 4.1, 3.3, 3.8, 5.2, 15.9, 35.0],
    Warsaw: [null, 3.6, 5.6, 4.3, 5.3, 7.4, 10.9, 20.1, 50.1], Lwow: [3.0, 4.8, 5.2, 3.9, 3.0, 4.3, 5.8, null, null],
};
export const LABOURER = {
    Antwerp: [3.0, 5.9, 7.6, 7.1, 6.9, 6.9, 7.7, 12.7, 32.4], Amsterdam: [3.1, 4.7, 7.2, 8.5, 8.9, 9.2, 9.2, 16.3, 48.6],
    London: [3.2, 4.6, 7.1, 9.7, 10.5, 11.5, 17.7, 31.2, 71.5], Florence: [2.9, 3.8, 4.7, null, null, null, null, 10.8, 25.0],
    Milan: [null, null, 5.9, 4.1, 3.2, 2.9, 3.1, 7.3, 22.4], Naples: [3.3, 3.5, 5.3, 4.8, 4.8, 3.8, 3.8, null, null],
    Valencia: [4.2, 6.6, 8.8, 6.9, 5.7, 5.1, null, null, null], Madrid: [null, 6.3, 8.0, null, 5.1, 5.3, 8.0, 9.7, 19.0],
    Paris: [2.8, 5.5, 6.6, 6.9, 5.1, 5.2, 9.9, 21.4, 52.2], Strasbourg: [3.7, 3.4, 4.3, 3.1, 2.9, 3.3, 8.1, 9.3, null],
    Augsburg: [2.1, 3.1, 4.0, 4.7, 4.2, 4.3, null, null, null], Leipzig: [null, 1.9, 3.5, 3.9, 3.7, 3.1, 4.4, 14.8, 51.6],
    Vienna: [2.7, 2.6, 4.4, 3.5, 3.2, 3.0, 2.1, 4.2, 43.5], Gdansk: [2.1, 2.1, 3.8, 4.3, 3.8, 3.7, 4.8, null, null],
    Krakow: [1.9, 2.9, 3.4, 2.9, 2.2, 2.9, 2.4, 7.1, 24.1], Warsaw: [null, 2.5, 3.2, 2.7, 1.9, 3.4, 4.9, 9.1, 26.3],
};
