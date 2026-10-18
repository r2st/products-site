const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function main() {
  const base = process.argv[2];
  assert(base, 'Provide the hosted release URL');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('.suite-card').count(), 9);
      assert.equal(await page.locator('#products-grid > a').count(), 44);
      assert.equal(await page.locator('#search-input').getAttribute('aria-label'), 'Search tools');
      const question = page.locator('.faq-item__q').first();
      await question.click();
      assert.equal(await question.getAttribute('aria-expanded'), 'true');
      await question.click();
      assert.equal(await question.getAttribute('aria-expanded'), 'false');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
      await page.screenshot({ path: `/tmp/doaide-${width}.png`, fullPage: true });
      await page.locator('#search-input').fill('GST');
      await page.waitForFunction(() => document.querySelectorAll('#products-grid > a').length < 44);
      assert(await page.locator('#products-grid > a').count() > 0);
      assert(await page.locator('#products-grid > a').count() < 44);
      await page.locator('#search-input').fill('no-such-tool-xyz');
      await page.locator('#no-results').waitFor({ state: 'visible' });
      await page.locator('#search-input').fill('');
      await page.waitForFunction(() => document.querySelectorAll('#products-grid > a').length === 44);
      await page.locator('[data-cat="financial"]').click();
      assert(await page.locator('#products-grid > a').count() > 0);
      assert(await page.locator('#products-grid > a').count() < 44);
      await page.locator('[data-cat="all"]').click();
      assert.equal(await page.locator('#products-grid > a').count(), 44);
    }
    fs.writeFileSync('/tmp/doaide-rendered-links.json', JSON.stringify(await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(a => a.href))]), null, 2));
    assert.deepEqual(errors, [], 'Browser JavaScript errors');
    await page.goto(`${base}/gst-calculator`, { waitUntil: 'networkidle' });
    await page.locator('#amount').fill('1000');
    await page.getByRole('button', { name: '18%', exact: true }).click();
    await page.getByRole('button', { name: 'Calculate GST', exact: true }).click();
    assert.match(await page.locator('#results-grid').innerText(), /1,180/);
    await page.goto(`${base}/emi-calculator`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Calculate EMI', exact: true }).click();
    assert.match(await page.locator('#emiVal').innerText(), /8,678/);
    await page.locator('#amount').fill('12000');
    await page.locator('#rate').fill('0');
    await page.locator('#tenure').fill('12');
    await page.locator('#tenureType').selectOption('months');
    await page.getByRole('button', { name: 'Calculate EMI', exact: true }).click();
    assert.match(await page.locator('#emiVal').innerText(), /1,000/);
    assert.equal(await page.locator('#intVal').innerText(), '\u20b90');
    assert.equal(await page.locator('#amortBody tr').count(), 12);
    for (const invalid of ['1.5', '361', '0']) {
      await page.locator('#tenure').fill(invalid);
      await page.getByRole('button', { name: 'Calculate EMI', exact: true }).click();
      assert(await page.locator('#loan-error').isVisible());
      assert(!(await page.locator('#resultsCard').isVisible()));
    }
    await page.goto(`${base}/json-formatter`, { waitUntil: 'networkidle' });
    await page.locator('#jsonInput').fill('{"test":true}');
    await page.getByRole('button', { name: 'Format', exact: false }).click();
    assert.match(await page.locator('#statusBar').innerText(), /success|valid|formatted/i);
    await page.goto(`${base}/qr-code-generator`, { waitUntil: 'networkidle' });
    await page.locator('#btn-generate').click();
    await page.locator('#qr-output.visible').waitFor();
    assert(await page.locator('#qr-image').evaluate(img => img.complete && img.naturalWidth > 0));
    assert.deepEqual(errors, [], 'Tool JavaScript errors');
    const routes = require('../build/product-routing');
    for (const [slug, destination] of Object.entries(routes)) {
      await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForURL(url => url.hostname === new URL(destination).hostname);
    }
    console.log('PASS: desktop/mobile layout, 44 tools, search, filters, accessible FAQs, four tool workflows, fifteen redirects, no JS errors');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
