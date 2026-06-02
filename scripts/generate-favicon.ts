import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Regenerates public/favicon.ico from the new three-squares Flux brand logo.
 *
 * sharp cannot encode .ico directly, so we render PNG frames at the standard
 * favicon sizes and assemble a multi-image ICO that embeds PNG-compressed
 * entries (supported by every modern browser, Vista+). Keeping the geometry
 * identical to scripts/generate-icons.ts guarantees the favicon matches the
 * PWA icons and the navbar mark.
 */

const COLOR = '#7E3BE9';
const ICO_SIZES = [16, 32, 48];

// Layered box logo — identical ratios to scripts/generate-icons.ts.
function createLogoSvg(size: number, color: string): Buffer {
    const rectSize = Math.round(size * 0.702); // 66/94 ratio
    const offset1 = Math.round(size * 0.149); // 14/94
    const offset2 = Math.round(size * 0.298); // 28/94
    const y1 = Math.round(size * 0.3125); // 30/96
    const y2 = Math.round(size * 0.156); // 15/96

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="${y1}" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}" fill-opacity="0.3"/>
  <rect x="${offset1}" y="${y2}" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}" fill-opacity="0.6"/>
  <rect x="${offset2}" y="0" width="${rectSize}" height="${rectSize}" rx="5" fill="${color}"/>
</svg>`;
    return Buffer.from(svg);
}

/** Assemble an .ico file from a set of PNG buffers (one entry per size). */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type: 1 = icon
    header.writeUInt16LE(images.length, 4); // image count

    const entries: Buffer[] = [];
    const ENTRY_SIZE = 16;
    let offset = 6 + images.length * ENTRY_SIZE;

    for (const img of images) {
        const entry = Buffer.alloc(ENTRY_SIZE);
        entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width (0 => 256)
        entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
        entry.writeUInt8(0, 2); // color palette count
        entry.writeUInt8(0, 3); // reserved
        entry.writeUInt16LE(1, 4); // color planes
        entry.writeUInt16LE(32, 6); // bits per pixel
        entry.writeUInt32LE(img.data.length, 8); // size of PNG data
        entry.writeUInt32LE(offset, 12); // offset of PNG data
        entries.push(entry);
        offset += img.data.length;
    }

    return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function generate() {
    const images = await Promise.all(
        ICO_SIZES.map(async (size) => ({
            size,
            data: await sharp(createLogoSvg(size, COLOR)).png().toBuffer(),
        }))
    );

    const ico = buildIco(images);
    const outPath = path.resolve(process.cwd(), 'public/favicon.ico');
    fs.writeFileSync(outPath, ico);
    console.log(`Generated ${outPath} (${ico.length} bytes, sizes: ${ICO_SIZES.join('/')})`);
}

generate().catch((err) => {
    console.error(err);
    process.exit(1);
});
