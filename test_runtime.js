const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT ERROR:', error.message);
  });
  
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    // try to call the functions directly to see if they crash
    SocialApp.init();
    PersonaApp.init();
  });
  console.log("No uncaught page errors detected during init.");
  await browser.close();
})();
