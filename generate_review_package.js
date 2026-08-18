import { execSync } from 'child_process';
import path from 'path';

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const artifactDir = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\brain\\c4579831-e507-4e6c-bf0c-03464a181275';
const baseUrl = 'https://ocg-website-staging-438680341626.us-central1.run.app';

console.log('=== CAPTURING FOUNDER REVIEW PACKAGE FROM CLOUD RUN STAGING ===\n');

const captures = [
  { name: 'review_01_homepage_1440', url: baseUrl, w: 1440, h: 900 },
  { name: 'review_02_homepage_375', url: baseUrl, w: 375, h: 812 },
  { name: 'review_03_invest_page', url: `${baseUrl}/invest`, w: 1440, h: 900 },
  { name: 'review_04_sell_page', url: `${baseUrl}/sell`, w: 1440, h: 900 },
  { name: 'review_05_how_it_works', url: `${baseUrl}/how-it-works`, w: 1440, h: 900 },
  { name: 'review_06_about_founder', url: `${baseUrl}/about`, w: 1440, h: 900 },
  { name: 'review_07_contact_intake', url: `${baseUrl}/contact`, w: 1440, h: 900 },
  { name: 'review_08_homepage_fullpage', url: baseUrl, w: 1440, h: 5600 }
];

for (const c of captures) {
  const outPath = path.join(artifactDir, `${c.name}.png`);
  const cmd = `${chromePath} --headless --disable-gpu --virtual-time-budget=4500 --window-size=${c.w},${c.h} --screenshot="${outPath}" "${c.url}"`;
  console.log(`Capturing ${c.name} (${c.w}x${c.h})...`);
  execSync(cmd);
}

console.log('\nAll founder review screenshots generated successfully.');
