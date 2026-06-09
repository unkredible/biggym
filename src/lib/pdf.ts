// Minimal dependency-free PDF writer: one font (Helvetica), absolute-positioned
// text lines, auto-paginated. Enough for attendee rosters. Latin-1 (WinAnsi).

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Build a simple text PDF: a title on page 1, then one line per entry. */
export function textPdf(title: string, lines: string[]): Uint8Array {
  const left = 56;
  const top = 756;
  const lh = 16;
  const perPage = 40;

  const chunks: string[][] = [];
  for (let i = 0; i < Math.max(lines.length, 1); i += perPage) {
    chunks.push(lines.slice(i, i + perPage));
  }
  if (chunks.length === 0) chunks.push([]);

  const fontObj = 3;
  const pageStart = 4;
  const nPages = chunks.length;
  const contentStart = pageStart + nPages;
  const maxObj = contentStart + nPages - 1;

  const objects: string[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  const kids = chunks.map((_, i) => `${pageStart + i} 0 R`).join(" ");
  objects[2] = `<< /Type /Pages /Count ${nPages} /Kids [${kids}] >>`;
  objects[fontObj] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;

  chunks.forEach((chunk, i) => {
    const pageObj = pageStart + i;
    const contentObj = contentStart + i;
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`;
    let y = top;
    let body = "";
    if (i === 0) {
      body += `BT /F1 18 Tf ${left} ${y} Td (${esc(title)}) Tj ET\n`;
      y -= 28;
    }
    for (const ln of chunk) {
      body += `BT /F1 11 Tf ${left} ${y} Td (${esc(ln)}) Tj ET\n`;
      y -= lh;
    }
    objects[contentObj] =
      `<< /Length ${Buffer.byteLength(body, "latin1")} >>\nstream\n${body}endstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let n = 1; n <= maxObj; n++) {
    offsets[n] = Buffer.byteLength(pdf, "latin1");
    pdf += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= maxObj; n++) {
    pdf += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Uint8Array(Buffer.from(pdf, "latin1"));
}
