import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Layered box logo - matching fluxboard_logo.svg
function createLogoSvg(size: number, color: string): Buffer {
  const rectSize = Math.round(size * 0.702); // 66/94 ratio
  const offset1 = Math.round(size * 0.149);   // 14/94
  const offset2 = Math.round(size * 0.298);   // 28/94
  const y1 = Math.round(size * 0.3125);       // 30/96
  const y2 = Math.round(size * 0.156);         // 15/96

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="${y1}" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}" fill-opacity="0.3"/>
  <rect x="${offset1}" y="${y2}" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}" fill-opacity="0.6"/>
  <rect x="${offset2}" y="0" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}"/>
</svg>`;
  return Buffer.from(svg);
}

// Maskable version - centered in inner 80%
function createMaskableSvg(size: number, color: string): Buffer {
  const outerPad = Math.round(size * 0.1);
  const innerSize = size - outerPad * 2;
  const offset1 = Math.round(innerSize * 0.149);
  const offset2 = Math.round(innerSize * 0.298);
  const y1 = Math.round(innerSize * 0.3125);
  const y2 = Math.round(innerSize * 0.156);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="${outerPad + y1}" width="${innerSize}" height="${innerSize}" rx="5" fill="${color}" fill-opacity="0.3"/>
  <rect x="${outerPad + offset1}" y="${outerPad + y2}" width="${innerSize}" height="${innerSize}" rx="5" fill="${color}" fill-opacity="0.6"/>
  <rect x="${outerPad + offset2}" y="${outerPad}" width="${innerSize}" height="${innerSize}" rx="5" fill="${color}"/>
</svg>`;
  return Buffer.from(svg);
}

const COLOR = '#7E3BE9';

async function generate() {
  await sharp(createLogoSvg(192, COLOR)).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  await sharp(createLogoSvg(512, COLOR)).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  await sharp(createMaskableSvg(512, COLOR)).png().toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png');
}

generate().catch(console.error);