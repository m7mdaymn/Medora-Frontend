const fs = require('fs');
const path = require('path');

const root = path.resolve('C:/DATA/Elite Clinic');
const backendCsvPath = path.join(root, 'docs/spec-kit/ENDPOINT_MATRIX_BACKEND.csv');
const frontendActionsDir = path.join(root, 'Frontend/actions');
const frontendDir = path.join(root, 'Frontend');
const frontendActionsCsvPath = path.join(root, 'docs/spec-kit/ENDPOINT_MATRIX_FRONTEND_ACTIONS.csv');
const parityCsvPath = path.join(root, 'docs/spec-kit/ENDPOINT_PARITY_MATRIX.csv');

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  ensureDirForFile(filePath);
  const content = lines.join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
  return content;
}

function parseCsv(content) {
  let text = content || '';
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // ignore
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const objects = [];
  for (const values of rows.slice(1)) {
    if (values.length === 1 && values[0] === '') {
      continue;
    }
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] !== undefined ? values[index] : '';
    });
    objects.push(obj);
  }

  return objects;
}

function walkFiles(dir, options = {}, acc = []) {
  const { extensions = [], excludeDirs = [] } = options;
  if (!fs.existsSync(dir)) {
    return acc;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirs.some((name) => name.toLowerCase() === entry.name.toLowerCase())) {
        continue;
      }
      walkFiles(fullPath, options, acc);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.length === 0 || extensions.includes(ext)) {
        acc.push(fullPath);
      }
    }
  }

  return acc;
}

function decodeQuotedLiteral(raw) {
  if (!raw) {
    return '';
  }

  const text = raw.trim();
  const quote = text[0];
  const last = text[text.length - 1];

  if (!((quote === '\'' || quote === '"' || quote === '`') && last === quote)) {
    return text;
  }

  let value = text.slice(1, -1);
  if (quote === '\'') {
    value = value.replace(/\\'/g, '\'');
  } else if (quote === '"') {
    value = value.replace(/\\"/g, '"');
  }
  value = value.replace(/\\\\/g, '\\');
  return value;
}

function extractStringLiterals(text) {
  const literals = [];
  const regex = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/gs;
  let match;
  while ((match = regex.exec(text)) !== null) {
    literals.push({
      raw: match[0],
      value: decodeQuotedLiteral(match[0]),
      index: match.index,
    });
  }
  return literals;
}

function getLineNumber(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

function normalizeRoute(routeLiteral) {
  if (!routeLiteral) {
    return '';
  }

  let route = decodeQuotedLiteral(String(routeLiteral).trim());

  route = route.replace(/^\(?\s*/, '');
  route = route.replace(/\s*\)?$/, '');

  route = route.replace(/\$\{\s*process\.env\.[A-Z0-9_]*NEXT_PUBLIC_API_URL[A-Z0-9_]*\s*\}/gi, '');
  route = route.replace(/process\.env\.[A-Z0-9_]*NEXT_PUBLIC_API_URL[A-Z0-9_]*\s*\+?/gi, '');
  route = route.replace(/^https?:\/\/[^/]+/i, '');

  route = route.replace(/\$\{[^}]+\}/g, '{}');
  route = route.replace(/\{[^{}:]+:[^{}]+\}/g, '{}');
  route = route.replace(/\{[^{}]+\}/g, '{}');

  // Remove non-path placeholders such as trailing `${query}` while preserving `/{}` path params.
  let previous = '';
  while (route !== previous) {
    previous = route;
    route = route.replace(/([^/])\{\}/g, '$1');
  }

  route = route.replace(/\?.*$/, '');
  route = route.replace(/^["'`]+|["'`]+$/g, '');
  route = route.replace(/\s+/g, '');
  route = route.replace(/^\/+/, '');
  route = route.replace(/\/+$/, '');
  route = route.replace(/\/\/{2,}/g, '/');

  return route.toLowerCase();
}

function findMatchingParen(text, openParenIndex) {
  let depth = 1;
  let inQuote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openParenIndex + 1; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      inQuote = ch;
      continue;
    }

    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function splitTopLevelArgs(text) {
  const args = [];
  let start = 0;

  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;

  let inQuote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      inQuote = ch;
      continue;
    }

    if (ch === '(') {
      depthParen += 1;
    } else if (ch === ')') {
      depthParen = Math.max(0, depthParen - 1);
    } else if (ch === '{') {
      depthBrace += 1;
    } else if (ch === '}') {
      depthBrace = Math.max(0, depthBrace - 1);
    } else if (ch === '[') {
      depthBracket += 1;
    } else if (ch === ']') {
      depthBracket = Math.max(0, depthBracket - 1);
    } else if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  const tail = text.slice(start).trim();
  if (tail) {
    args.push(tail);
  }

  return args;
}

function extractRoutesFromExpression(expression) {
  const expr = String(expression || '').trim();
  if (!expr) {
    return [];
  }

  const literals = extractStringLiterals(expr)
    .map((item) => item.value)
    .filter((value) => /\/api\//i.test(value) || /^api\//i.test(value) || /next_public_api_url/i.test(value));

  const prefixMatches = Array.from(expr.matchAll(/\/api\/[a-z0-9/_-]+/gi)).map((match) => match[0]);

  const allCandidates = Array.from(new Set([...literals, ...prefixMatches]));

  if (allCandidates.length > 0) {
    return allCandidates;
  }

  const direct = decodeQuotedLiteral(expr);
  if (/\/api\//i.test(direct) || /^api\//i.test(direct) || /next_public_api_url/i.test(direct)) {
    return [direct];
  }

  return [];
}

function resolveIdentifierRoutes(identifier, beforeText) {
  const name = escapeRegExp(identifier);
  const declarationRegex = new RegExp(
    `\\b(?:const|let|var)\\s+${name}(?:\\s*:\\s*[^=\\n]+)?\\s*=\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n\\s*(?:const|let|var|return|if|for|while|switch|try|catch|export|function|}\\s*|$))`,
    'g',
  );

  let match;
  let lastExpression = '';
  while ((match = declarationRegex.exec(beforeText)) !== null) {
    lastExpression = match[1];
  }

  if (!lastExpression) {
    return [];
  }

  return extractRoutesFromExpression(lastExpression);
}

function extractMethod(optionsArgument) {
  if (!optionsArgument) {
    return 'GET';
  }

  const methodMatch = /\bmethod\s*:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i.exec(optionsArgument);
  if (methodMatch) {
    return methodMatch[1].toUpperCase();
  }

  return 'GET';
}

function extractActionEndpoints(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const relFile = toPosix(path.relative(root, filePath));

  const fetchRegex = /\bfetchApi\b(?:\s*<[\s\S]*?>)?\s*\(/g;
  const rows = [];

  let match;
  while ((match = fetchRegex.exec(text)) !== null) {
    const openParenIndex = match.index + match[0].lastIndexOf('(');
    const closeParenIndex = findMatchingParen(text, openParenIndex);
    if (closeParenIndex < 0) {
      continue;
    }

    const argsText = text.slice(openParenIndex + 1, closeParenIndex);
    const args = splitTopLevelArgs(argsText);
    if (args.length === 0) {
      continue;
    }

    const firstArg = args[0].trim();
    const secondArg = args.length > 1 ? args[1] : '';
    const method = extractMethod(secondArg);
    const line = getLineNumber(text, match.index);

    let routeCandidates = extractRoutesFromExpression(firstArg);
    if (routeCandidates.length === 0 && /^[A-Za-z_$][\w$]*$/.test(firstArg)) {
      routeCandidates = resolveIdentifierRoutes(firstArg, text.slice(0, match.index));
    }

    routeCandidates = Array.from(new Set(routeCandidates));

    for (const routeLiteral of routeCandidates) {
      const normalizedRoute = normalizeRoute(routeLiteral);
      if (!normalizedRoute || !normalizedRoute.includes('api/')) {
        continue;
      }

      rows.push({
        HttpVerb: method,
        RouteLiteral: routeLiteral,
        NormalizedRoute: normalizedRoute,
        FrontendFile: relFile,
        Line: line,
      });
    }
  }

  return rows;
}

function extractNonActionRouteLiterals() {
  const files = walkFiles(frontendDir, {
    extensions: ['.ts', '.tsx'],
    excludeDirs: ['actions', '.next', 'node_modules', 'dist', 'build', '.turbo'],
  });

  const rows = [];

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8');
    const relFile = toPosix(path.relative(root, filePath));
    const literals = extractStringLiterals(text);

    for (const item of literals) {
      const routeLiteral = item.value;
      if (!/\/api\//i.test(routeLiteral) && !/^api\//i.test(routeLiteral) && !/next_public_api_url/i.test(routeLiteral)) {
        continue;
      }

      const normalizedRoute = normalizeRoute(routeLiteral);
      if (!normalizedRoute || !normalizedRoute.includes('api/')) {
        continue;
      }

      const context = text.slice(item.index, Math.min(text.length, item.index + 300));
      const methodMatch = /\bmethod\s*:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i.exec(context);

      rows.push({
        method: methodMatch ? methodMatch[1].toUpperCase() : '',
        routeLiteral,
        normalizedRoute,
        file: relFile,
        line: getLineNumber(text, item.index),
      });
    }
  }

  return rows;
}

function buildIndex(rows) {
  const byRoute = new Map();
  const byRouteMethod = new Map();

  for (const row of rows) {
    if (!byRoute.has(row.NormalizedRoute)) {
      byRoute.set(row.NormalizedRoute, []);
    }
    byRoute.get(row.NormalizedRoute).push(row);

    const key = `${row.NormalizedRoute}|${row.HttpVerb.toUpperCase()}`;
    if (!byRouteMethod.has(key)) {
      byRouteMethod.set(key, []);
    }
    byRouteMethod.get(key).push(row);
  }

  return { byRoute, byRouteMethod };
}

function countStatuses(rows) {
  const result = { wired: 0, partial: 0, 'ui-missing': 0 };
  for (const row of rows) {
    if (result[row.Status] === undefined) {
      result[row.Status] = 0;
    }
    result[row.Status] += 1;
  }
  return result;
}

function run() {
  if (!fs.existsSync(backendCsvPath)) {
    throw new Error(`Backend CSV not found: ${backendCsvPath}`);
  }

  const backendRows = parseCsv(fs.readFileSync(backendCsvPath, 'utf8'));
  const actionFiles = walkFiles(frontendActionsDir, {
    extensions: ['.ts'],
    excludeDirs: ['node_modules', '.next', 'dist', 'build'],
  }).sort();

  let actionRows = [];
  for (const filePath of actionFiles) {
    actionRows = actionRows.concat(extractActionEndpoints(filePath));
  }

  actionRows.sort((a, b) => {
    if (a.FrontendFile !== b.FrontendFile) return a.FrontendFile.localeCompare(b.FrontendFile);
    if (a.Line !== b.Line) return a.Line - b.Line;
    if (a.HttpVerb !== b.HttpVerb) return a.HttpVerb.localeCompare(b.HttpVerb);
    return a.RouteLiteral.localeCompare(b.RouteLiteral);
  });

  const dedupedActionRows = [];
  const actionSeen = new Set();
  for (const row of actionRows) {
    const key = `${row.HttpVerb}|${row.NormalizedRoute}|${row.FrontendFile}|${row.Line}|${row.RouteLiteral}`;
    if (!actionSeen.has(key)) {
      actionSeen.add(key);
      dedupedActionRows.push(row);
    }
  }
  actionRows = dedupedActionRows;

  const nonActionRows = extractNonActionRouteLiterals();
  const nonActionByRoute = new Map();
  for (const row of nonActionRows) {
    if (!nonActionByRoute.has(row.normalizedRoute)) {
      nonActionByRoute.set(row.normalizedRoute, row);
    }
  }

  const { byRoute, byRouteMethod } = buildIndex(actionRows);

  const parityRows = backendRows.map((backend) => {
    const backendMethod = String(backend.HttpVerb || '').toUpperCase();
    const routeTemplate = backend.RouteTemplate || '';
    const normalizedBackendRoute = normalizeRoute(routeTemplate);

    const exactMatches = byRouteMethod.get(`${normalizedBackendRoute}|${backendMethod}`) || [];
    const routeMatches = byRoute.get(normalizedBackendRoute) || [];
    const nonActionMatch = nonActionByRoute.get(normalizedBackendRoute) || null;

    let status = 'ui-missing';
    let frontendMethod = '';
    let frontendRouteLiteral = '';
    let frontendFile = '';
    let note = 'no matched route in Frontend/actions';

    if (exactMatches.length > 0) {
      const selected = exactMatches[0];
      status = 'wired';
      frontendMethod = selected.HttpVerb;
      frontendRouteLiteral = selected.RouteLiteral;
      frontendFile = `${selected.FrontendFile}:${selected.Line}`;
      note = 'matched method and normalized route in actions';
    } else if (routeMatches.length > 0) {
      const selected = routeMatches[0];
      const methods = Array.from(new Set(routeMatches.map((row) => row.HttpVerb))).sort().join('|');
      status = 'partial';
      frontendMethod = selected.HttpVerb;
      frontendRouteLiteral = selected.RouteLiteral;
      frontendFile = `${selected.FrontendFile}:${selected.Line}`;
      note = `method mismatch (backend ${backendMethod}; frontend ${methods})`;
    } else if (nonActionMatch) {
      status = 'partial';
      frontendMethod = nonActionMatch.method || '';
      frontendRouteLiteral = nonActionMatch.routeLiteral;
      frontendFile = `${nonActionMatch.file}:${nonActionMatch.line}`;
      note = 'route found only in non-actions scan';
    }

    return {
      HttpVerb: backendMethod,
      RouteTemplate: routeTemplate,
      ControllerFile: backend.ControllerFile || '',
      MethodName: backend.MethodName || '',
      Status: status,
      FrontendMethod: frontendMethod,
      FrontendRouteLiteral: frontendRouteLiteral,
      FrontendFile: frontendFile,
      Note: note,
      _NormalizedBackendRoute: normalizedBackendRoute,
    };
  });

  writeCsv(
    frontendActionsCsvPath,
    ['HttpVerb', 'RouteLiteral', 'NormalizedRoute', 'FrontendFile', 'Line'],
    actionRows,
  );

  const parityOutputRows = parityRows.map((row) => ({
    HttpVerb: row.HttpVerb,
    RouteTemplate: row.RouteTemplate,
    ControllerFile: row.ControllerFile,
    MethodName: row.MethodName,
    Status: row.Status,
    FrontendMethod: row.FrontendMethod,
    FrontendRouteLiteral: row.FrontendRouteLiteral,
    FrontendFile: row.FrontendFile,
    Note: row.Note,
  }));

  const parityCsv = writeCsv(
    parityCsvPath,
    ['HttpVerb', 'RouteTemplate', 'ControllerFile', 'MethodName', 'Status', 'FrontendMethod', 'FrontendRouteLiteral', 'FrontendFile', 'Note'],
    parityOutputRows,
  );

  const totals = countStatuses(parityRows);
  const contractorRows = parityRows.filter((row) =>
    row._NormalizedBackendRoute.includes('partner') || row._NormalizedBackendRoute.includes('contract'),
  );
  const contractorTotals = countStatuses(contractorRows);

  console.log(`BACKEND_ENDPOINTS:${backendRows.length}`);
  console.log(`ACTION_ENDPOINTS_EXTRACTED:${actionRows.length}`);
  console.log(`NON_ACTION_ROUTE_REFERENCES:${nonActionRows.length}`);
  console.log(`WROTE:${toPosix(path.relative(root, frontendActionsCsvPath))}`);
  console.log(`WROTE:${toPosix(path.relative(root, parityCsvPath))}`);

  console.log('TOTALS_BY_STATUS');
  console.log(`wired:${totals.wired || 0}`);
  console.log(`partial:${totals.partial || 0}`);
  console.log(`ui-missing:${totals['ui-missing'] || 0}`);

  console.log('CONTRACTOR_SUBSET_TOTALS(/partner|/contract)');
  console.log(`subset_count:${contractorRows.length}`);
  console.log(`wired:${contractorTotals.wired || 0}`);
  console.log(`partial:${contractorTotals.partial || 0}`);
  console.log(`ui-missing:${contractorTotals['ui-missing'] || 0}`);

  console.log('PARITY_CSV_FIRST_20_ROWS');
  const previewLines = parityCsv.split(/\r?\n/).slice(0, 21);
  for (const line of previewLines) {
    console.log(line);
  }
}

run();
