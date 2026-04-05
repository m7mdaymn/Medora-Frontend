const fs = require('fs');
const path = require('path');

const root = path.resolve('C:/DATA/Elite Clinic');
const targets = [
  ['Frontend/actions', '.ts'],
  ['Frontend/app', '.tsx'],
  ['Frontend/lib', '.ts']
];

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, ext, acc);
    } else if (entry.isFile() && full.endsWith(ext)) {
      acc.push(full);
    }
  }
  return acc;
}

let files = [];
for (const [subPath, ext] of targets) {
  files = files.concat(walk(path.join(root, subPath), ext));
}
files.sort();

const stringRe = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/gs;
const rows = [];

for (const filePath of files) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  stringRe.lastIndex = 0;
  let match;
  while ((match = stringRe.exec(text)) !== null) {
    const literal = match[0].slice(1, -1);
    if (literal.includes('/api/')) {
      const line = (text.slice(0, match.index).match(/\n/g) || []).length + 1;
      const rel = path.relative(root, filePath).split(path.sep).join('/');
      rows.push([rel, line, literal]);
    }
  }
}

const outPath = path.join(root, 'docs/spec-kit/ENDPOINT_MATRIX_FRONTEND_USED.csv');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

function csvEscape(value) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const allRows = [['File', 'Line', 'RouteLiteral'], ...rows];
fs.writeFileSync(outPath, allRows.map(r => r.map(csvEscape).join(',')).join('\n'), 'utf8');

const uniqueCount = new Set(rows.map(r => r[2])).size;

console.log(`CSV_PATH:${outPath.replace(/\\/g, '/')}`);
console.log(`TOTAL_MATCHES:${rows.length}`);
console.log(`UNIQUE_ROUTE_LITERAL_COUNT:${uniqueCount}`);
console.log('FIRST_30_ROWS:');
for (const row of allRows.slice(0, 31)) {
  console.log(row.map(csvEscape).join(','));
}
