// Genera los PNG de la PWA (cápsula de cacao en cobre sobre oliva) desde SVG.
// Uso: node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";

const OLIVA = "#7a7f64";
const COBRE = "#b8734d";

const MARCA = `
  <path d="M24 40 C 13 33 11 21 15.5 10 C 20.5 19 23 31 24 40 Z"/>
  <path d="M16.5 14 C 19.5 22 22 31 24 39"/>
  <path d="M24 40 C 35 33 37 21 32.5 10 C 27.5 19 25 31 24 40 Z"/>
  <path d="M31.5 14 C 28.5 22 26 31 24 39"/>
  <path d="M24 40 C 24 42 24 43 24 44"/>`;

// Ícono estándar (margen normal). rounded controla las esquinas.
const estandar = (size, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="${rounded ? 11 : 0}" fill="${OLIVA}"/>
  <g transform="translate(0 1)" fill="none" stroke="${COBRE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${MARCA}</g>
</svg>`;

// Maskable: fondo a sangre + marca reducida a la zona segura (~64%).
const maskable = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <rect width="48" height="48" fill="${OLIVA}"/>
  <g transform="translate(24 24.5) scale(0.64) translate(-24 -24.5)" fill="none" stroke="${COBRE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${MARCA}</g>
</svg>`;

async function png(svg, size, out) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(out, buf);
  console.log("✓", out);
}

mkdirSync("public", { recursive: true });
await png(estandar(192, true), 192, "public/icon-192.png");
await png(estandar(512, true), 512, "public/icon-512.png");
await png(maskable(512), 512, "public/icon-512-maskable.png");
await png(estandar(180, false), 180, "public/apple-icon.png");
console.log("Listo.");
