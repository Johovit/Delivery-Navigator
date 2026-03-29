import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('REACT_ERROR:', err.toString()));
  
  try {
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    console.log('Signup Page loaded:', page.url());
    
    const email = `test${Date.now()}@test.com`;
    await page.type('input[type="email"]', email);
    await page.type('input[placeholder="Password"]', 'password123');
    await page.type('input[placeholder="Confirm Password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 4000));
    console.log('After signup URL:', page.url());

    if (page.url().includes('dashboard')) {
        await page.goto('http://localhost:5173/plan', { waitUntil: 'networkidle0' });
        console.log('Plan Route page loaded. URL:', page.url());
        
        await page.type('#source-input', 'chennai');
        await page.type('#destination-input', 'coimbatore');
        await page.click('#find-route-btn');
        await new Promise(r => setTimeout(r, 5000));
        console.log('Start delivery exists:', await page.evaluate(() => !!document.querySelector('#start-delivery-btn')));
    }
  } catch(e) {
    console.error('SCRIPT_ERR:', e);
  }
  await browser.close();
})();
