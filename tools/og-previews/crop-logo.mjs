// Auto-trim transparent margins from the logo so we have a tight wordmark
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, '..', '..', 'assets', 'logos', '1-transparent.png');
const dst = path.join(__dirname, 'logo-wordmark.png');

const img = sharp(src);
const meta = await img.metadata();
console.log('source:', meta.width, 'x', meta.height);

await sharp(src)
  .trim({ threshold: 1 })
  .toFile(dst);

const out = await sharp(dst).metadata();
console.log('cropped:', out.width, 'x', out.height, '→', dst);
