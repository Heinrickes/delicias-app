// Genera los PNG de la PWA a partir del logo real de la cápsula (logo-pod.png)
// compuesto sobre fondo crema. Uso: node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync } from "fs";

const CREMA = { r: 244, g: 239, b: 230, alpha: 1 };
const POD = "public/logo-pod.png";

async function gen(size, hRatio, out) {
  const podH = Math.round(size * hRatio);
  const pod = await sharp(POD)
    .trim() // quita el margen transparente alrededor de la cápsula
    .resize({ height: podH })
    .png()
    .toBuffer();
  const img = await sharp({
    create: { width: size, height: size, channels: 4, background: CREMA },
  })
    .composite([{ input: pod, gravity: "center" }])
    .png()
    .toBuffer();
  writeFileSync(out, img);
  console.log("✓", out);
}

await gen(192, 0.74, "public/icon-192.png");
await gen(512, 0.74, "public/icon-512.png");
await gen(512, 0.6, "public/icon-512-maskable.png"); // maskable: más margen (zona segura)
await gen(180, 0.72, "public/apple-icon.png");
console.log("Listo.");
