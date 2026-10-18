const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function main() {
  const base = process.argv[2];
  assert(base, 'Provide a hosted release URL');
  const browser = await chromium.launch();
  const results = [];
  const marker = '<b data-audit="plain-text">Sample & Co</b>';
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    page.setDefaultTimeout(8000);
    const fill = async values => { for (const [id, value] of Object.entries(values)) await page.locator('#' + id).fill(String(value)); };
    const click = name => page.getByRole('button', { name, exact: true }).click();
    const visible = selector => page.locator(selector).waitFor({ state: 'visible' });
    const selectFirst = async id => {
      const value = await page.locator('#' + id + ' option').evaluateAll(es => es.find(e => e.value && !e.disabled).value);
      await page.locator('#' + id).selectOption(value);
    };
    async function check(file, test) {
      const errors = [], dialogs = [];
      const onError = e => errors.push(e.message);
      const onDialog = async d => { dialogs.push(d.message()); await d.dismiss(); };
      page.on('pageerror', onError);
      page.on('dialog', onDialog);
      try {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
        await test();
        assert.deepEqual(errors, [], 'JavaScript errors');
        assert.deepEqual(dialogs, [], 'Unexpected dialog');
        assert(!/\b(?:NaN|Infinity)\b/.test(await page.locator('body').innerText()), 'Non-finite output');
        await page.setViewportSize({ width: 390, height: 844 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Generated output overflows mobile viewport');
        results.push({ file, pass: true });
        console.log('PASS:', file);
      } catch (error) {
        results.push({ file, pass: false, error: error.message, errors, dialogs });
        console.log('FAIL:', file, error.message);
        await page.screenshot({ path: `/tmp/doaide-failure-${file}.png` });
      } finally { page.off('pageerror', onError); page.off('dialog', onDialog); }
    }
    await check('cap-table-calculator', async () => {
      await page.locator('#founderRows input[type=text]').first().fill(marker);
      await fill({ investAmount: 1000000, preMoney: 5000000, roundName: marker });
      await click('Build Cap Table');
      await visible('#results.show');
      assert.equal(await page.locator('#results [data-audit]').count(), 0);
      assert((await page.locator('#results').innerText()).includes(marker));
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Cap-table results overflow on mobile');
      await page.setViewportSize({ width: 1440, height: 900 });
      await fill({ newPoolPct: 100 });
      await click('Build Cap Table');
      await visible('#cap-error');
      assert(!(await page.locator('#results').isVisible()));
      await fill({ newPoolPct: 0, optionsGranted: 2000000 });
      await click('Build Cap Table');
      await visible('#cap-error');
    });
    await check('free-nda-generator', async () => {
      await fill({ disclosingParty: marker, receivingParty: 'Sample Recipient', jurisdiction: 'Sample Jurisdiction', purpose: 'Sample evaluation', effectiveDate: '2026-10-14' });
      await click('Generate NDA');
      await visible('#ndaContent');
      assert.equal(await page.locator('#ndaContent [data-audit]').count(), 0);
      assert((await page.locator('#ndaContent').innerText()).includes(marker));
      const downloaded = page.waitForEvent('download');
      await page.locator('#downloadBtn').click();
      const download = await downloaded;
      const bytes = fs.readFileSync(await download.path());
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
      assert(bytes.length > 1000);
    });
    await check('eway-bill-generator', async () => {
      await fill({ fromName: marker, docNumber: marker, distance: 200 });
      await page.locator('.item-name').first().fill(marker);
      await page.locator('.item-value').first().fill('10000');
      await page.getByRole('button', { name: /Generate E-Way Bill Summary/ }).click();
      await visible('#summaryGrid');
      assert.equal(await page.locator('#summaryGrid [data-audit], #itemsSummary [data-audit]').count(), 0);
      assert((await page.locator('#summaryGrid').innerText()).includes(marker));
    });
    await check('sip-calculator', async () => {
      await fill({ monthly: 1000, rate: 0, years: 1 });
      await click('Calculate SIP Returns');
      assert.match(await page.locator('#totalValue').innerText(), /12,000/);
      for (const years of ['-1', '1.5', '1000000']) {
        await fill({ years });
        await click('Calculate SIP Returns');
        await visible('#sip-error');
        assert.equal(await page.locator('#totalValue').innerText(), '--');
      }
    });
    await check('409a-valuation-calculator', async () => {
      await fill({ ppsPrice: 10, totalShares: 1000000, prefShares: 200000, monthsSince: 6 });
      await click('Estimate Fair Market Value');
      await visible('#results');
      await fill({ prefShares: 2000000 });
      await click('Estimate Fair Market Value');
      assert(!(await page.locator('#results').isVisible()));
    });
    await check('stock-option-tax-calculator', async () => {
      await fill({ strike: 1, fmv: 10, numShares: 1000, otherIncome: 100000 });
      await click('Calculate Tax Impact');
      await visible('#results');
      await click('NSO (Non-Qualified)');
      await click('Calculate Tax Impact');
      await visible('#results');
      await fill({ numShares: -1 }); await click('Calculate Tax Impact');
      assert(!(await page.locator('#results').isVisible()));
    });
    await check('salary', async () => {
      await fill({ ctc: 1200000 });
      await click('Calculate Take-Home Salary');
      await visible('#results');
      await fill({ rent: -100 }); await click('Calculate Take-Home Salary');
      assert(!(await page.locator('#results').isVisible()));
    });
    await check('resume', async () => {
      await fill({ jd: 'Job title: ' + marker + '\nWe need a software engineer with JavaScript, testing, teamwork, and SQL experience.', resume: 'Summary: Software engineer. Experience: Built JavaScript applications and SQL databases for three years. Skills: JavaScript, SQL, testing, teamwork. Education: Computer Science degree. Delivered 30% faster services.' });
      await click('Score My Resume');
      await visible('#results.active');
      assert.equal(await page.locator('#results [data-audit]').count(), 0);
    });
    await check('itc-calculator', async () => {
      await fill({ totalInputTax: 1000, outputTax: 1500 });
      await click('Calculate ITC');
      assert.match(await page.locator('#resNetTax').innerText(), /500/);
      await page.locator('[data-tab=blocked]').click();
      await page.locator('[data-blocked=motorVehicles]').check();
      await page.locator('[data-key=motorVehicles]').fill('100');
      assert.match(await page.locator('#totalBlockedAmount').innerText(), /100/);
      await page.locator('[data-tab=reversal]').click();
      await fill({ totalITCPeriod: 1000, taxableTurnover: 8000, exemptTurnover: 2000, totalTurnover: 10000 });
      await click('Calculate Reversal');
    });
    await check('gst-composition-calculator', async () => {
      await fill({ 'el-turnover': 1000000 });
      await click('Check Eligibility');
      await visible('#el-result');
      await page.locator('[data-tab=taxcalc]').click();
      await fill({ 'tc-turnover': 1000000 });
      await click('Calculate Tax'); await visible('#tc-result');
      await page.locator('[data-tab=compare]').click();
      await fill({ 'cmp-turnover': 1000000 });
      await click('Compare'); await visible('#cmp-result');
      await page.locator('[data-tab=cmp08]').click();
      await fill({ q1: 100000, q2: 100000, q3: 100000, q4: 100000 });
      await click('Generate CMP-08 Summary'); await visible('#cmp08-result');
    });
    await check('gst-composition-scheme', async () => {
      await selectFirst('elig-business-type'); await selectFirst('elig-state');
      await fill({ 'elig-turnover': 1000000 });
      await click('Check Eligibility'); await visible('#eligibility-result');
      await selectFirst('comp-business-type');
      await fill({ 'comp-monthly-turnover': 100000, 'comp-monthly-purchases': 50000 });
      await click('Compare'); await visible('#comparison-result');
    });
    await check('gst-rcm-calculator', async () => {
      await selectFirst('rcm-service'); await fill({ 'invoice-value': 10000 });
      await click('Calculate RCM Liability'); await visible('#results');
    });
    await check('eway-bill-helper', async () => {
      await fill({ consValue: 100000, distance: 200 });
      await selectFirst('fromState'); await selectFirst('toState');
      await click('Check Requirement'); await visible('#results');
    });
    await check('gst-penalty-calculator', async () => {
      await click('By Days Late');
      await fill({ daysLate: 5, taxLiability: 10000 });
      await click('Calculate Late Fee & Penalty'); await visible('#results');
    });
    await check('gstr-9-calculator', async () => {
      await fill({ aggregateTurnover: 30000000, totalSales: 1000000, igstCollected: 180000, igstItc: 100000, igstCash: 80000 });
      await click('Calculate All Sections');
      assert((await page.locator('body').innerText()).includes('1,80,000'));
    });
    await check('gstr-3b-calculator', async () => {
      await fill({ legalName: 'Sample Company' });
      await selectFirst('returnMonth'); await selectFirst('returnYear');
      for (let step = 1; step < 6; step++) {
        const numbers = page.locator('.step-panel.active input[type=number]');
        if (await numbers.count()) await numbers.first().fill('1000');
        await page.locator('.step-panel.active').getByRole('button', { name: /Next:/ }).click();
      }
      await visible('#step6.active');
    });
    await check('gst-invoice-generator', async () => {
      await fill({ sellerName: 'Sample Seller', buyerName: 'Sample Buyer' });
      const inputs = page.locator('#itemsBody tr').first().locator('input');
      await inputs.nth(0).fill('Sample item'); await inputs.nth(2).fill('2'); await inputs.nth(3).fill('100');
      assert((await page.locator('body').innerText()).includes('236.00'));
      await click('+ Add Line Item');
      assert.equal(await page.locator('#itemsBody tr').count(), 2);
      await page.locator('#itemsBody tr').last().locator('button').click();
      assert.equal(await page.locator('#itemsBody tr').count(), 1);
    });
    await check('tds-calculator', async () => {
      await page.locator('[data-tab=calculator]').click();
      await fill({ calcAmount: 100000 });
      await page.locator('#calcBtn').click(); await visible('#resultContent');
    });
    for (const [file, id] of [['hsn-code-finder', 'searchInput'], ['contract-clause-library', 'searchInput'], ['free-tools', 'tool-search']]) {
      await check(file, async () => {
        await fill({ [id]: 'no-such-entry-audit-xyz' });
        await page.waitForFunction(() => /no (?:results|tools|clauses|matching|codes)|showing 0 of/i.test(document.body.innerText));
        await fill({ [id]: '' });
      });
    }
  } finally { await browser.close(); }
  fs.writeFileSync('/tmp/doaide-tool-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ checked: results.length, failures: results.filter(r => !r.pass) }, null, 2));
  process.exitCode = results.some(r => !r.pass) ? 1 : 0;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
