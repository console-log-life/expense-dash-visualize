// A small CSV parser for bank-statement style files.
// Handles quoted fields ("Amazon, Inc."), escaped quotes ("" inside quotes),
// and both \n and \r\n line endings. Returns an array of rows, each an array
// of strings. Empty lines are skipped.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
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
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

// Turns CSV text with a header row into objects keyed by lower-case header.
// Expected columns: date, description, amount, type, category.
// `type` may be left out if the amount is signed (negative = expense).
export function csvToRecords(text) {
  const rows = parseCsv(String(text || '').replace(/^﻿/, '')); // strip Excel BOM
  if (rows.length === 0) return { records: [], missingColumns: ['date', 'description', 'amount'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const required = ['date', 'description', 'amount'];
  const missingColumns = required.filter((col) => !header.includes(col));

  const records = rows.slice(1).map((cells, index) => {
    const record = { row: index + 2 }; // +2: 1-based and the header is row 1
    header.forEach((col, i) => {
      record[col] = (cells[i] ?? '').trim();
    });
    return record;
  });

  return { records, missingColumns };
}
