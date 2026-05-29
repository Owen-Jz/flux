import { chromium, devices } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'screenshots');
mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const VIEWPORTS = [
  { name: 'iphone-se-320', vw: 320, vh: 568 },
  { name: 'iphone-12-375', vw: 375, vh: 667 },
  { name: 'iphone-14-pro-428', vw: 428, vh: 926 },
];

const PAGES = [
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/pricing', name: 'pricing' },
  { path: '/', name: 'landing' },
];

const results = [];

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  for (const pg of PAGES) {
    const context = await browser.newContext({
      viewport: { width: vp.vw, height: vp.vh },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: devices['iPhone 12'].userAgent,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });

    let status = 'ok';
    let bodyOverflow = false;
    let smallTargets = 0;
    let unlabeledIconBtns = 0;
    let httpStatus = 0;

    try {
      const resp = await page.goto(`${BASE}${pg.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      httpStatus = resp?.status() ?? 0;
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

      bodyOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });

      smallTargets = await page.evaluate(() => {
        const els = Array.from(
          document.querySelectorAll('button, a[href], input, [role="button"]')
        );
        let count = 0;
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.width < 36 || r.height < 36) count++;
        }
        return count;
      });

      unlabeledIconBtns = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        let n = 0;
        for (const b of btns) {
          const text = (b.textContent || '').trim();
          const hasSvg = !!b.querySelector('svg');
          const aria = b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
          const title = b.getAttribute('title');
          if (!text && hasSvg && !aria && !title) n++;
        }
        return n;
      });

      await page.screenshot({
        path: resolve(outDir, `${pg.name}-${vp.name}.png`),
        fullPage: false,
      });
    } catch (e) {
      status = `error: ${e.message}`;
    }

    results.push({
      page: pg.name,
      viewport: vp.name,
      httpStatus,
      status,
      bodyOverflow,
      smallTargets,
      unlabeledIconBtns,
      jsErrors: consoleErrors.length,
      jsErrorSample: consoleErrors.slice(0, 2),
    });

    await context.close();
  }
}

await browser.close();

console.log('\n=== MOBILE SMOKE RESULTS ===');
for (const r of results) {
  const flags = [];
  if (r.bodyOverflow) flags.push('OVERFLOW');
  if (r.smallTargets > 0) flags.push(`small-targets:${r.smallTargets}`);
  if (r.unlabeledIconBtns > 0) flags.push(`unlabeled-icons:${r.unlabeledIconBtns}`);
  if (r.jsErrors > 0) flags.push(`js-errors:${r.jsErrors}`);
  const tag = flags.length === 0 ? 'OK' : flags.join(' ');
  console.log(`[${r.viewport}] ${r.page} HTTP ${r.httpStatus} ${r.status} ${tag}`);
  if (r.jsErrorSample.length) {
    for (const e of r.jsErrorSample) console.log(`    err: ${e.slice(0, 200)}`);
  }
}

const overflowCount = results.filter((r) => r.bodyOverflow).length;
const jsErrCount = results.filter((r) => r.jsErrors > 0).length;
console.log(
  `\nSUMMARY: ${results.length} checks, ${overflowCount} horizontal overflows, ${jsErrCount} pages with JS errors`
);
console.log(`Screenshots: ${outDir}`);

process.exit(overflowCount > 0 || jsErrCount > 0 ? 1 : 0);
