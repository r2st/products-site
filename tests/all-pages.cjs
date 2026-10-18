const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const base = process.argv[2];
  if (!base) throw new Error('Provide a hosted release URL');
  const root = path.resolve(__dirname, '..');
  const files = fs.readdirSync(root).filter(f => f.endsWith('.html'))
    .concat(fs.readdirSync(path.join(root, 'blog')).filter(f => f.endsWith('.html')).map(f => 'blog/' + f));
  const browser = await chromium.launch();
  const results = [];
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    for (const file of files) {
      if (/http-equiv="refresh"/i.test(fs.readFileSync(path.join(root, file), 'utf8'))) continue;
      const errors = [];
      const handler = error => errors.push(error.message);
      page.on('pageerror', handler);
      try {
        await page.setViewportSize({ width: 390, height: 844 });
        const response = await page.goto(`${base}/${file}`, { waitUntil: 'load', timeout: 25000 });
        await page.evaluate(() => document.fonts.ready);
        const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        const controls = await page.locator('input:not([type=hidden]), textarea, select').evaluateAll(es => es.map(e => ({
          id: e.id, type: e.type, value: e.value, min: e.min, max: e.max, required: e.required
        })));
        const buttons = await page.locator('button').evaluateAll(es => es.filter(e => e.offsetWidth).map(e => ({ id: e.id, text: e.innerText.trim() })));
        await page.setViewportSize({ width: 1440, height: 900 });
        const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        results.push({ file, status: response.status(), errors, mobileOverflow, desktopOverflow, controls, buttons });
      } catch (error) { results.push({ file, error: error.message }); }
      page.off('pageerror', handler);
    }
  } finally { await browser.close(); }
  fs.writeFileSync('/tmp/doaide-all-pages.json', JSON.stringify(results, null, 2));
  const issues = results.filter(r => r.error || r.status !== 200 || r.errors.length || r.mobileOverflow || r.desktopOverflow);
  console.log(JSON.stringify({ checked: results.length, issues }, null, 2));
  process.exitCode = issues.length ? 1 : 0;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
