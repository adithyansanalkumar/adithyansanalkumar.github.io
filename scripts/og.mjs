// Generates public/og.png — the preview image shown when the link is shared
// (LinkedIn, WhatsApp, Teams...). Run:  npm run og
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));

const grid = [];
for (let x = 0; x <= 1200; x += 24) grid.push(`<path d="M${x} 0V630" stroke="rgba(120,165,235,${x % 120 ? 0.06 : 0.12})"/>`);
for (let y = 0; y <= 630; y += 24) grid.push(`<path d="M0 ${y}H1200" stroke="rgba(120,165,235,${y % 120 ? 0.06 : 0.12})"/>`);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="th" x1="0" x2="1"><stop offset="0" stop-color="#4fb0ff"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#ff7a3c"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#081325"/>
  ${grid.join('')}
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="rgba(148,186,240,.35)"/>
  <text x="80" y="110" font-family="Consolas, monospace" font-size="20" fill="#7a8ca8" letter-spacing="3">PLAN N° 01 — LOT CVC</text>
  <circle cx="68" cy="103" r="6" fill="#ff7a3c"/>
  <text x="80" y="230" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="84" fill="#e9eef7">ADITHYAN</text>
  <text x="80" y="330" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="84" fill="none" stroke="#e9eef7" stroke-width="2">SANAL KUMAR</text>
  <rect x="80" y="372" width="520" height="4" fill="url(#th)"/>
  <text x="80" y="430" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="38" fill="#e9eef7">Technicien Bureau d'Études CVC</text>
  <text x="80" y="478" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#a8b6cc">Derichebourg Énergie · BIM · Revit · pyRevit</text>
  <path d="M890 520H960V160H1130" fill="none" stroke="#4fb0ff" stroke-width="16" opacity=".3"/>
  <path d="M890 520H960V160H1130" fill="none" stroke="#8fd0ff" stroke-width="3" stroke-dasharray="3 16" stroke-linecap="round"/>
  <path d="M1130 260H1020V560H890" fill="none" stroke="#ff7a3c" stroke-width="16" opacity=".3"/>
  <path d="M1130 260H1020V560H890" fill="none" stroke="#ffb07c" stroke-width="3" stroke-dasharray="3 16" stroke-linecap="round"/>
  <rect x="1040" y="174" width="40" height="18" fill="none" stroke="#4fb0ff" stroke-width="2"/>
  <rect x="1090" y="174" width="40" height="18" fill="none" stroke="#4fb0ff" stroke-width="2"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('og.png written to', out);
