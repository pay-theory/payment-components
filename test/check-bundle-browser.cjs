/* global require, process, __dirname */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// This is supplemental compiled-bundle evidence. It does not contribute any
// counters to the authoritative original-source Istanbul coverage report.
(async () => {
  const bundle = fs.readFileSync(path.join(__dirname, '../dist/index.js'));
  const server = http.createServer((request, response) => {
    if (request.url === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle); }
    else if (request.url === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><body><script src="/bundle.js"></script></body>'); }
    else { response.statusCode = 404; response.end(); }
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const blocked = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === `http://127.0.0.1:${server.address().port}`) return route.continue();
      blocked.push(url.origin + url.pathname); return route.abort('blockedbyclient');
    });
    const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result = await page.evaluate(async () => {
      const sdk = window.paytheory;
      const names = ['pay-theory-credit-card-tag-frame', 'pay-theory-credit-card-card-number-tag-frame', 'pay-theory-bank-account-number-tag-frame', 'pay-theory-cash-name-tag-frame', 'pay-theory-checkout-button', 'pay-theory-checkout-qr', 'pay-theory-overlay'];
      return {
        messengerIdentity: sdk.PayTheoryMessenger === window.PayTheoryMessenger,
        functions: ['create', 'createPaymentFields', 'payTheoryFields', 'transact', 'confirm', 'cancel', 'tokenizePaymentMethod', 'updateAmount', 'button', 'qrCode', 'stateObserver', 'validObserver'].every(name => typeof sdk[name] === 'function'),
        constants: [sdk.PAY, sdk.ALL, sdk.MERCHANT_FEE],
        registrations: names.map(name => ({ name, registered: Boolean(customElements.get(name)), genuineElement: document.createElement(name) instanceof HTMLElement })),
        stylesheet: [...document.querySelectorAll('style')].some(style => style.textContent.includes('#pay-theory-badge-wrapper')),
        rejected: await sdk.payTheoryFields({ apiKey: 'invalid-synthetic-key' }),
      };
    });
    assert.equal(result.messengerIdentity, true); assert.equal(result.functions, true);
    assert.deepEqual(result.constants, ['PAY', 'ALL', 'merchant_fee']); assert.equal(result.stylesheet, true);
    assert.ok(result.registrations.every(row => row.registered && row.genuineElement));
    assert.equal(result.rejected.type, 'ERROR'); assert.match(result.rejected.error, /^INVALID_PARAM:/);
    assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    process.stdout.write(JSON.stringify({ outcome: 'passed', ...result, blockedRequests: blocked, pageErrors: errors }, null, 2) + '\n');
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
