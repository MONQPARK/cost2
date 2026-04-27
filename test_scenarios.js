const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let errors = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
      errors++;
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT ERROR:', error.message);
    errors++;
  });
  
  await page.goto('http://localhost:8081', { waitUntil: 'load', timeout: 60000 });
  
  // Clear any existing localStorage just to be safe
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'load', timeout: 60000 });

  console.log("== Scenario A: Persona ==");
  await page.click('#mode-btn-persona');
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if categories are rendered
  const cats = await page.$$eval('.cat-card', els => els.length);
  console.log(`Categories found: ${cats}`);
  
  // Scenario B check
  console.log("== Scenario B: Social ==");
  await page.click('#mode-btn-social');
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if social input is visible
  const isSocialInputVisible = await page.evaluate(() => {
    const el = document.getElementById('tab-social-input');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log(`Social input visible: ${isSocialInputVisible}`);

  console.log(`Total Errors: ${errors}`);
  await browser.close();
})();
