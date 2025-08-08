import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = join(__dirname, '..');
const seedDir = join(root, 'seed');
const outDir = join(root, 'src', 'data');
mkdirSync(outDir, { recursive: true });

function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim() !== '');
  const rows = [];
  for (const line of lines) {
    if (line.trim().startsWith('#')) continue; // allow comments
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    rows.push(cols.map((c) => c.trim().replace(/^"|"$/g, '')));
  }
  return rows;
}

function toInt(val, def = null) {
  const n = Number(val);
  return Number.isFinite(n) ? n : def;
}

function loadPersonalities() {
  const jsonPath = join(seedDir, 'personalities.json');
  const csvPath = join(seedDir, 'personalities.csv');
  if (existsSync(jsonPath)) {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
    return data;
  }
  if (existsSync(csvPath)) {
    const rows = parseCsv(readFileSync(csvPath, 'utf8'));
    const [header, ...rest] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const required = ['id', 'groupNo', 'term', 'mostMark', 'leastMark'];
    for (const r of required) if (!(r in idx)) throw new Error(`Missing column in personalities.csv: ${r}`);
    return rest.map((row) => ({
      id: toInt(row[idx.id]),
      groupNo: toInt(row[idx.groupNo]),
      term: row[idx.term],
      mostMark: row[idx.mostMark],
      leastMark: row[idx.leastMark],
    }));
  }
  return null;
}

function loadPatterns() {
  const jsonPath = join(seedDir, 'patterns.json');
  const csvPath = join(seedDir, 'patterns.csv');
  if (existsSync(jsonPath)) {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
    return data;
  }
  if (existsSync(csvPath)) {
    const rows = parseCsv(readFileSync(csvPath, 'utf8'));
    const [header, ...rest] = rows;
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const required = ['id','name','emotions','goal','judges_others','influences_others','organization_value','overuses','under_pressure','fear','effectiveness','description'];
    for (const r of required) if (!(r in idx)) throw new Error(`Missing column in patterns.csv: ${r}`);
    return rest.map((row) => Object.fromEntries(Object.keys(idx).map((k) => [k, k === 'id' ? toInt(row[idx[k]]) : row[idx[k]]])));
  }
  return null;
}

const personalities = loadPersonalities();
const patterns = loadPatterns();

if (!personalities && !patterns) {
  console.log('No seed files found in', seedDir);
  process.exit(0);
}

if (personalities) {
  // minimal validations
  const marks = new Set(['D','I','S','C','#']);
  const invalid = personalities.filter((p) => !marks.has(p.mostMark) || !marks.has(p.leastMark));
  if (invalid.length) {
    throw new Error('Invalid marks found in personalities seed (allowed: D,I,S,C,#)');
  }
  writeFileSync(join(outDir, 'personalities.json'), JSON.stringify(personalities, null, 2));
  console.log('Wrote', join(outDir, 'personalities.json'));
}

if (patterns) {
  writeFileSync(join(outDir, 'patterns.json'), JSON.stringify(patterns, null, 2));
  console.log('Wrote', join(outDir, 'patterns.json'));
}

console.log('Seeding complete.');