# DISC Astro Static App

No-database build of the DISC assessment using Astro. All data is bundled as static JSON generated from `db/disc.sql` or seeded from CSV/JSON.

## Commands

- Install: `npm i`
- Generate from SQL: `npm run gen:data`
- Seed real data: place files under `seed/` then run `npm run seed`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Seeding real-world data
- Add `seed/personalities.csv` with columns: `id,groupNo,term,mostMark,leastMark` (marks one of D,I,S,C,#)
  - Or use `seed/personalities.json` with the same fields per object
- Add `seed/patterns.csv` (or `.json`) with columns: `id,name,emotions,goal,judges_others,influences_others,organization_value,overuses,under_pressure,fear,effectiveness,description`
- Run `npm run seed` to write `src/data/personalities.json` and/or `src/data/patterns.json`

## Notes
- Result page computes scoring client-side and shows mapped pattern.
- Share URLs can include `?p={patternId}` to render OG image statically.