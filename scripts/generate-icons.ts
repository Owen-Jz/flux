import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Bold geometric F - SVG source for standard icons (192/512)
function createFSvg(size: number, bgColor: string, fgColor: string): Buffer {
  const padding = Math.round(size * 0.15);
  const innerSize = size - padding * 2;
  const stemWidth = Math.round(innerSize * 0.22);
  const barHeight = Math.round(innerSize * 0.22);
  const barWidth = Math.round(innerSize * 0.42);
  const midBarWidth = Math.round(innerSize * 0.58);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <g transform="translate(${padding}, ${padding})">
    <rect x="0" y="0" width="${stemWidth}" height="${innerSize}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="${Math.round(barHeight * 1.35)}" width="${midBarWidth}" height="${barHeight}" fill="${fgColor}"/>
  </g>
</svg>`;
  return Buffer.from(svg);
}

// Maskable icon: F centered in inner 80%
function createMaskableSvg(size: number, bgColor: string, fgColor: string): Buffer {
  const outerPad = Math.round(size * 0.1);
  const innerSize = size - outerPad * 2;
  const stemWidth = Math.round(innerSize * 0.22);
  const barHeight = Math.round(innerSize * 0.22);
  const barWidth = Math.round(innerSize * 0.42);
  const midBarWidth = Math.round(innerSize * 0.58);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <g transform="translate(${outerPad}, ${outerPad})">
    <rect x="0" y="0" width="${stemWidth}" height="${innerSize}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${fgColor}"/>
    <rect x="${stemWidth}" y="${Math.round(barHeight * 1.35)}" width="${midBarWidth}" height="${barHeight}" fill="${fgColor}"/>
  </g>
</svg>`;
  return Buffer.from(svg);
}

const BG = '#ffffff';
const FG = '#7c3aed';

async function generate() {
  await sharp(createFSvg(192, BG, FG)).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  await sharp(createFSvg(512, BG, FG)).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  await sharp(createMaskableSvg(512, BG, FG)).png().toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png');
}

generate().catch(console.error);