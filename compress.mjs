import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const targets = [
  'freedomind_assets.file/IMG_9538.jpeg',
  'freedomind_assets.file/mannequin-34.jpeg',
  'freedomind_assets.file/3B668445-0DD8-4D04-A0F0-49EC109E9D08.jpeg',
  'freedomind_assets.file/IMG_6172.jpeg',
  'freedomind_assets.file/IMG_9043.jpeg',
  'freedomind_assets.file/35b8c840-e14d-405d-a212-c1163073e195.jpeg',
  'freedomind_assets.file/IMG_5075.jpeg',
  'freedomind_assets.file/att.xDmi7YXNKkMAjoP10su2mYkFCww5q1--J6GfvvC6f7Q.jpeg',
  'freedomind_assets.file/IMG_7156.jpeg',
  'freedomind_assets.file/IMG_1115.jpeg',
  'freedomind_assets.file/ab7bd3f8-f5d8-4725-8077-08b6f71b3745.jpeg',
  'brand_assets/Freedomind_brand_assets:brand guidelines/2024-11-29-Rozina-Garage-Women-Entrepreneurial-Bootcamp-San-Gwann-51-840x1176.jpg',
];

let totalBefore = 0;
let totalAfter = 0;

for (const src of targets) {
  const dst = src.replace(/\.jpe?g$/i, '.webp');
  const before = (await stat(src)).size;
  // Cap width at 1920px — enough for 2x retina on most layouts, drastically shrinks huge camera originals.
  await sharp(src)
    .rotate() // apply EXIF orientation, then strip — prevents phone photos landing sideways
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dst);
  const after = (await stat(dst)).size;
  totalBefore += before;
  totalAfter += after;
  const pct = (100 - (after / before) * 100).toFixed(1);
  console.log(`${(before / 1024 / 1024).toFixed(2).padStart(6)}MB → ${(after / 1024 / 1024).toFixed(2).padStart(5)}MB  (-${pct.padStart(4)}%)  ${dst}`);
}

console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(2)}MB → ${(totalAfter / 1024 / 1024).toFixed(2)}MB  (-${(100 - (totalAfter / totalBefore) * 100).toFixed(1)}%)`);
