// Resize 2x render to native 1200x630 and compress for OG sharing
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, 'individual', 'final.png');
const dstPng = path.join(__dirname, '..', '..', 'assets', 'og-image.png');
const dstJpg = path.join(__dirname, '..', '..', 'assets', 'og-image.jpg');

await sharp(src)
  .resize(1200, 630, { fit: 'cover' })
  .png({ quality: 90, compressionLevel: 9, palette: true })
  .toFile(dstPng);

await sharp(src)
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(dstJpg);

const png = await sharp(dstPng).metadata();
const jpg = await sharp(dstJpg).metadata();
console.log(`png: ${png.width}x${png.height} → ${dstPng} (${(png.size/1024).toFixed(1)} KB)`);
console.log(`jpg: ${jpg.width}x${jpg.height} → ${dstJpg} (${(jpg.size/1024).toFixed(1)} KB)`);
