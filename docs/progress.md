# Progress log

Newest first. Each entry: date, model, what changed (plain words), what was checked, what is next.

## 2026-10-13 (2), Claude Opus 5.5
- Changed: job 2 done. For a real place and a story date from 1940 to about a week ago, Weather and BodyEnvironment give the weather that was actually recorded that day (ERA5 via Open-Meteo): high, low, rain or snow, wind, humidity, temperature at the hour. Other dates and fictional places keep the weather generator.
- Checked: London 6/6/1944 high 13.5 °C, low 9.3 °C, 0.8 mm; Moscow 5/12/1941 −20.6/−26.1 °C; São Paulo 15/1/2000 30.6/21.1 °C, 5.5 mm; 2030 and 1900 fall back to the generator. Compiles with zero errors.
- Next: job 1 (BioGears sidecar) needs a computer or a Codespace with build tools; alternatively the 20th Century Reanalysis for 1836–1939 (job 2b), or section 5 of superset-models.md (actions against a character's profile) once papers 84, 87, 99 are downloaded.

## 2026-10-13, Claude Opus 5.5
- Changed: Price answers wages for about 60 more markets in subsistence baskets (Moatsos & de Zwart 2025) and the hourly pay of a named trade in 1953–2008 (Occupational Wages around the World). New tool PlaceProfile gives a country's population, share in towns, murder rate and infant mortality (Clio Infra) and a city's population (Reba et al. 2016).
- Researched and wrote down the replacements for hand-written rules: BioGears for the body, census microdata for people, reanalysis for weather (`docs/superset-models.md`).
- Set up Codespaces + OpenCode so other models can continue (`AGENTS.md`, `opencode.json`, `.devcontainer/`).
- Checked: compiled with zero errors; welder Germany 1980 US$7.07/h; Agra 1699 a year's basket = 63 days of work; Paris 1700 = 530,000 people.
- Next: job 2 in `docs/superset-models.md` (Open-Meteo weather for story dates from 1940), then job 1 (BioGears), then job 3 (census sampler, needs the user's IPUMS downloads).
