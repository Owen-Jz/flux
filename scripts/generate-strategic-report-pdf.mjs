/**
 * Flux Strategic Report — PDF Generator
 * Usage: node scripts/generate-strategic-report-pdf.mjs
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Output: flux-strategic-report.pdf (A4, print background colors)
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'flux-strategic-report.html');
const outputPath = path.join(projectRoot, 'flux-strategic-report.pdf');

async function generatePDF() {
  console.log('🚀 Launching Puppeteer...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport to A4-ish dimensions
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2
  });

  console.log(`📄 Loading HTML: ${htmlPath}`);
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for charts to render
  await new Promise(r => setTimeout(r, 2000));

  console.log('📐 Generating PDF...');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1.5cm',
      right: '1.5cm',
      bottom: '1.5cm',
      left: '1.5cm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%;text-align:center;font-size:10px;font-family:'IBM Plex Sans',sans-serif;color:#6B7280;">
        Flux Platform Strategic Analysis Report — April 2026
      </div>
    `,
    footerTemplate: `
      <div style="width:100%;display:flex;justify-content:space-between;padding:0 1.5cm;font-size:10px;font-family:'IBM Plex Sans',sans-serif;color:#6B7280;">
        <span>Confidential</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();

  console.log(`✅ PDF generated: ${outputPath}`);
  console.log('');
  console.log('Done! Open flux-strategic-report.pdf to review.');
}

generatePDF().catch((err) => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
