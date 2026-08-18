const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';

const DESKTOP_DIR = 'C:\\Users\\Genaro\\Desktop\\OCG_STAGING_REVIEW_SCREENSHOTS';
const BRAIN_DIR = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\brain\\c4579831-e507-4e6c-bf0c-03464a181275';
const WORKSPACE_DIR = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\scratch\\ocg-2026-website\\FOUNDER_REVIEW_SCREENSHOTS';

[DESKTOP_DIR, WORKSPACE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  async function saveShot(filename) {
    const p1 = path.join(DESKTOP_DIR, filename);
    const p2 = path.join(BRAIN_DIR, filename);
    const p3 = path.join(WORKSPACE_DIR, filename);
    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
    fs.copyFileSync(p1, p3);
    console.log(`✓ Saved: ${filename}`);
  }

  // 1. Homepage Desktop 1440px Hero & Full
  console.log('Capturing Homepage 1440px...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await saveShot('review_01_homepage_1440.png');

  // 2. Homepage Mobile 375px
  console.log('Capturing Homepage 375px Mobile...');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await saveShot('review_02_homepage_375.png');

  // Reset to 1440px for subpages
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });

  // 3. /invest
  console.log('Capturing /invest...');
  await page.goto(`${BASE_URL}/invest`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await saveShot('review_03_invest_page.png');

  // 4. /sell
  console.log('Capturing /sell...');
  await page.goto(`${BASE_URL}/sell`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await saveShot('review_04_sell_page.png');

  // 5. /about
  console.log('Capturing /about...');
  await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await saveShot('review_06_about_founder.png');

  // 6. /contact
  console.log('Capturing /contact...');
  await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await saveShot('review_07_contact_intake.png');

  // 7. Homepage Sections
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Section 03: Origin Story
  await page.evaluate(() => document.getElementById('origin')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await saveShot('homepage_section_03_origin_story.png');

  // Section 04: Technology Pipeline
  await page.evaluate(() => document.getElementById('technology')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await saveShot('homepage_section_04_technology_ecosystem.png');

  // Section 05: Transformations
  await page.evaluate(() => document.getElementById('transformations')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await saveShot('homepage_section_05_wichita_transformations.png');

  // Section 06: Calculator
  await page.evaluate(() => document.getElementById('calculator')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await saveShot('homepage_section_06_underwriting_calculator.png');

  // Section 07: G Intelligence
  await page.evaluate(() => document.getElementById('g')?.scrollIntoView());
  await new Promise(r => setTimeout(r, 800));
  await saveShot('homepage_section_07_g_intelligence.png');

  await browser.close();
  console.log('All 11 founder review screenshots updated successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
