const DEFAULT_COLUMNS = [
  "accountId",
  "type",
  "occurredAt",
  "actor",
  "source",
  "summary",
];

export function parseCsv(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("csv input must be a string");
  }

  const rows = tokenizeCsv(text);
  if (rows.length === 0) {
    return [];
  }

  const hasHeader = options.header ?? true;
  const columns = hasHeader ? rows[0].map(normalizeColumn) : options.columns ?? DEFAULT_COLUMNS;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .filter(row => row.some(value => value.trim() !== ""))
    .map((row, index) => mapRow(columns, row, index + (hasHeader ? 2 : 1)));
}

export function stringifyCsv(rows, columns = DEFAULT_COLUMNS) {
  const header = columns.join(",");
  const body = rows.map(row => columns.map(column => escapeCsv(row[column] ?? "")).join(","));
  return [header, ...body].join("\n");
}

function tokenizeCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
        continue;
      }
      if (char === "\"") {
        quoted = false;
        continue;
      }
      cell += char;
      continue;
    }

    if (char === "\"") {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (char !== "\r") {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function mapRow(columns, row, lineNumber) {
  const record = {};
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    if (!column) {
      continue;
    }
    record[column] = row[index]?.trim() ?? "";
  }
  record._lineNumber = lineNumber;
  return record;
}

function normalizeColumn(column) {
  return column.trim().replace(/^\uFEFF/, "");
}

function escapeCsv(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}
