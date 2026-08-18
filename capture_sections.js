import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\brain\\c4579831-e507-4e6c-bf0c-03464a181275\\screenshots';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // Scroll down and screenshot sections
  const sections = [
    { name: '01_entry_pathways', y: 850 },
    { name: '02_strategy_matrix', y: 1450 },
    { name: '03_origin_story', y: 2200 },
    { name: '04_technology_ecosystem', y: 3150 },
    { name: '05_wichita_transformations', y: 4050 },
    { name: '06_underwriting_calculator', y: 4950 },
    { name: '07_g_intelligence', y: 5750 }
  ];

  for (const s of sections) {
    await page.evaluate((top) => {
      window.scrollTo(0, top);
    }, s.y);
    await new Promise(res => setTimeout(res, 500));
    await page.screenshot({ path: path.join(outDir, `homepage_section_${s.name}.png`), fullPage: false });
  }

  console.log('Section screenshots complete!');
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
