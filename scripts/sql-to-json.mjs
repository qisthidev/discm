import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = join(__dirname, "..");
const sqlPath = join(root, "disc.sql");
const outDir = join(root, "src", "data");
mkdirSync(outDir, { recursive: true });

const sql = readFileSync(sqlPath, "utf8");

function extractTuples(sectionLabel) {
  const start = sql.indexOf(sectionLabel);
  if (start === -1) return [];
  const rest = sql.slice(start + sectionLabel.length);
  const match = rest.match(/VALUES\s*([\s\S]*?);/i);
  if (!match) return [];
  const tuplesBlob = match[1];
  // split on '),\n(' while keeping inner commas intact
  const parts = tuplesBlob
    .trim()
    .replace(/^\(/, "")
    .replace(/\)\s*$/, "")
    .split(/\)\s*,\s*\(/);
  return parts.map((p) =>
    p.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((s) => s.trim())
  );
}

function unquote(val) {
  if (val === undefined) return val;
  if (val === "''") return "";
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (val.toUpperCase() === "NULL") return null;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}

// personalities: (id, no, term, most, least)
const personalitiesTuples = extractTuples("INSERT INTO personalities");
const personalities = personalitiesTuples.map((t) => {
  const [id, groupNo, term, mostMark, leastMark] = t.map(unquote);
  return { id, groupNo, term, mostMark, leastMark };
});
writeFileSync(
  join(outDir, "personalities.json"),
  JSON.stringify(personalities, null, 2)
);

// results: (id, dimension, intensity, value, segment, graph) — keep only graph=3
const resultsTuples = extractTuples("INSERT INTO results");
const resultMap = resultsTuples
  .map((t) => {
    const [id, dimension, intensity, value, segment, graph] = t.map(unquote);
    return { id, dimension, intensity, value, segment, graph };
  })
  .filter((r) => r.graph === 3)
  .map(({ dimension, value, segment }) => ({ dimension, value, segment }));
writeFileSync(
  join(outDir, "resultMap.json"),
  JSON.stringify(resultMap, null, 2)
);

// pattern_map: (d,i,s,c,pattern)
const patternMapTuples = extractTuples("INSERT INTO pattern_map");
const patternMap = patternMapTuples.map((t) => {
  const [d, i, s, c, pattern] = t.map(unquote);
  return { d, i, s, c, pattern };
});
writeFileSync(
  join(outDir, "patternMap.json"),
  JSON.stringify(patternMap, null, 2)
);

// patterns: (id,name,emotions,goal,judges_others,influences_others,organization_value,overuses,under_pressure,fear,effectiveness,description)
const patternsTuples = extractTuples("INSERT INTO patterns");
const patterns = patternsTuples.map((t) => {
  const [
    id,
    name,
    emotions,
    goal,
    judges_others,
    influences_others,
    organization_value,
    overuses,
    under_pressure,
    fear,
    effectiveness,
    description,
  ] = t.map(unquote);
  return {
    id,
    name,
    emotions,
    goal,
    judges_others,
    influences_others,
    organization_value,
    overuses,
    under_pressure,
    fear,
    effectiveness,
    description,
  };
});
writeFileSync(join(outDir, "patterns.json"), JSON.stringify(patterns, null, 2));

console.log("Generated data files at", outDir);
