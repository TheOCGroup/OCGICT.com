import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\brain\\c4579831-e507-4e6c-bf0c-03464a181275\\screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const routes = [
    { url: 'http://127.0.0.1:5173/', name: 'homepage' },
    { url: 'http://127.0.0.1:5173/invest', name: 'invest' },
    { url: 'http://127.0.0.1:5173/sell', name: 'sell' },
    { url: 'http://127.0.0.1:5173/how-ocg-works', name: 'how_it_works' },
    { url: 'http://127.0.0.1:5173/about', name: 'about' },
    { url: 'http://127.0.0.1:5173/contact', name: 'contact' }
  ];

  const viewports = [
    { width: 1440, height: 900, label: '1440_desktop' },
    { width: 768, height: 1024, label: '768_tablet' },
    { width: 375, height: 812, label: '375_mobile' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });

    for (const r of routes) {
      console.log(`Capturing ${r.name} @ ${vp.label}...`);
      await page.goto(r.url, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(res => setTimeout(res, 800));

      const filePath = path.join(outDir, `${r.name}_${vp.label}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
    }
  }

  // Also capture full-page desktop for Homepage
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await new Promise(res => setTimeout(res, 1000));
  await page.screenshot({ path: path.join(outDir, 'homepage_1440_fullpage.png'), fullPage: true });

  console.log('All screenshots successfully saved to:', outDir);
  await browser.close();
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
