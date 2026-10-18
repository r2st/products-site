const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const base = process.argv[2];
  assert(base, 'Provide a hosted release URL');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const products = ['bizname', 'complipilot', 'desk', 'documedic', 'gosumo',
      'gst', 'gstbot', 'hireagent', 'invoicer', 'n409', 'qr', 'talentping', 'voicedesk'];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const product of products) {
        await page.goto(`${base}/${product}`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${product}: overflow at ${width}`);
        if (width === 390) {
          await page.locator('.burger').click();
          assert(await page.locator('#site-nav').isVisible(), `${product}: mobile navigation hidden`);
        }
        await page.locator('[data-menu-btn]').click();
        assert.equal(await page.locator('[data-menu-btn]').getAttribute('aria-expanded'), 'true');
        await page.locator('[data-menu-panel]').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-menu-btn]').getAttribute('aria-expanded'), 'false');
        if (width === 390) {
          await page.keyboard.press('Escape');
          assert(!(await page.locator('#site-nav').isVisible()));
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/cap-table-calculator`, { waitUntil: 'networkidle' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Cap table overflow');
    await page.screenshot({ path: '/tmp/doaide-cap-table-mobile.png', fullPage: true });
    await page.goto(`${base}/desk`, { waitUntil: 'networkidle' });
    await page.locator('.burger').click();
    await page.locator('[data-menu-btn]').click();
    await page.locator('[data-menu-panel]').waitFor({ state: 'visible' });
    assert(await page.locator('#site-nav').evaluate(nav => nav.getBoundingClientRect().bottom <= innerHeight), 'Mobile menu exceeds viewport');
    await page.locator('#site-nav .nav__cta').scrollIntoViewIfNeeded();
    assert(await page.locator('#site-nav .nav__cta').evaluate(link => link.getBoundingClientRect().bottom <= innerHeight), 'Bottom navigation link is unreachable');
    await page.screenshot({ path: '/tmp/doaide-product-menu-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: 13 product menus on desktop/mobile, Escape controls, and cap-table mobile layout');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
