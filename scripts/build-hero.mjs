import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const srcDir = 'assets/LandingPageCasa';
const destDir = 'public/hero';

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png'));

async function run() {
  for (const file of files) {
    const match = file.match(/^(\d+)\.png$/);
    if (!match) continue;
    const num = match[1];
    const src = path.join(srcDir, file);

    for (const size of [900, 1600]) {
      const resized = sharp(src).resize({ width: size, withoutEnlargement: true });
      
      await resized.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(destDir, `f${num}-${size}.avif`));
      await resized.clone().webp({ quality: 76 }).toFile(path.join(destDir, `f${num}-${size}.webp`));
      await resized.clone().jpeg({ quality: 80 }).toFile(path.join(destDir, `f${num}-${size}.jpg`));
    }
  }
  console.log('Done!');
}
run();
