const cleanFileName = (name = 'export') => String(name)
  .replace(/[^a-z0-9-_]+/gi, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase() || 'export';

const safeSheetName = (name, fallback = 'Sheet') => String(name || fallback)
  .replace(/[\\/?*\[\]:]/g, ' ')
  .trim()
  .slice(0, 31) || fallback;

const xmlEscape = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const normalizeValue = value => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const columnName = index => {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

const worksheetXml = (rows = [], emptyMessage = 'No records available') => {
  const normalizedRows = rows.map(row => Object.fromEntries(Object.entries(row || {}).map(([k, v]) => [k, normalizeValue(v)])));
  const headers = normalizedRows.length ? Object.keys(normalizedRows[0]) : ['Message'];
  const data = normalizedRows.length ? normalizedRows : [{ Message: emptyMessage }];

  const makeCell = (ref, value, style = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
    if (typeof value === 'boolean') return `<c r="${ref}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
  };

  const headerRow = `<row r="1" ht="22" customHeight="1">${headers.map((header, i) => makeCell(`${columnName(i)}1`, header, 1)).join('')}</row>`;
  const bodyRows = data.map((row, rowIndex) => {
    const r = rowIndex + 2;
    return `<row r="${r}">${headers.map((header, i) => makeCell(`${columnName(i)}${r}`, row[header] ?? '', 0)).join('')}</row>`;
  }).join('');
  const lastCol = columnName(Math.max(0, headers.length - 1));
  const lastRow = data.length + 1;

  const widths = headers.map((header, i) => {
    const sample = [header, ...data.slice(0, 300).map(row => row[header])];
    const max = Math.min(42, Math.max(11, ...sample.map(v => String(v ?? '').length + 2)));
    return `<col min="${i + 1}" max="${i + 1}" width="${max}" customWidth="1"/>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${widths}</cols>
  <sheetData>${headerRow}${bodyRows}</sheetData>
  <autoFilter ref="A1:${lastCol}${lastRow}"/>
</worksheet>`;
};

const workbookXml = names => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${names.map((name, i) => `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`;

const workbookRelsXml = count => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({ length: count }, (_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}
  <Relationship Id="rId${count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const contentTypesXml = count => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from({ length: count }, (_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0788C9"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// Minimal ZIP writer using STORE (no compression), sufficient for .xlsx containers.
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = bytes => {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const u16 = value => new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
const u32 = value => new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
const concat = parts => {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  parts.forEach(part => { out.set(part, offset); offset += part.length; });
  return out;
};

const createZip = entries => {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach(entry => {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.text);
    const crc = crc32(data);
    const localHeader = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const central = concat(centralParts);
  const local = concat(localParts);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(local.length), u16(0)
  ]);
  return concat([local, central, end]);
};

const downloadBlob = (bytes, fileName) => {
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanFileName(fileName)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const excelExportService = {
  exportSheets(fileName, sheets = []) {
    const usable = (sheets || []).filter(sheet => sheet && sheet.name);
    const finalSheets = usable.length ? usable : [{ name: 'Data', rows: [] }];
    const usedNames = new Set();
    const names = finalSheets.map((sheet, i) => {
      const base = safeSheetName(sheet.name, `Sheet ${i + 1}`);
      let name = base;
      let suffix = 2;
      while (usedNames.has(name)) name = `${base.slice(0, 27)} ${suffix++}`;
      usedNames.add(name);
      return name;
    });

    const entries = [
      { name: '[Content_Types].xml', text: contentTypesXml(finalSheets.length) },
      { name: '_rels/.rels', text: rootRelsXml },
      { name: 'xl/workbook.xml', text: workbookXml(names) },
      { name: 'xl/_rels/workbook.xml.rels', text: workbookRelsXml(finalSheets.length) },
      { name: 'xl/styles.xml', text: stylesXml },
      ...finalSheets.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: worksheetXml(sheet.rows || [], sheet.emptyMessage) }))
    ];

    downloadBlob(createZip(entries), fileName);
  },

  exportRows(fileName, sheetName, rows = [], emptyMessage = 'No records available') {
    this.exportSheets(fileName, [{ name: sheetName, rows, emptyMessage }]);
  },
};
