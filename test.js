const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('http://localhost:8081');
  await new Promise(r => setTimeout(r, 500));
  await page.click('#mode-btn-social');
  await new Promise(r => setTimeout(r, 500));
  await page.click('#mode-btn-persona');
  await new Promise(r => setTimeout(r, 500));
  await browser.close();
})();
