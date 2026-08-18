import { execSync } from 'child_process';
import path from 'path';

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const artifactDir = 'C:\\Users\\Genaro\\.gemini\\antigravity-ide\\brain\\c4579831-e507-4e6c-bf0c-03464a181275';
const baseUrl = 'https://ocg-website-staging-438680341626.us-central1.run.app';

console.log('=== CAPTURING SECTION DETAIL SCREENSHOTS ===\n');

// We can capture by launching Chrome with specific element anchors or using headless Chrome
const sections = [
  { name: 'section_01_hero_1440', url: `${baseUrl}/#top`, w: 1440, h: 900 },
  { name: 'section_02_strategies_1440', url: `${baseUrl}/#strategies`, w: 1440, h: 900 },
  { name: 'section_03_origin_1440', url: `${baseUrl}/#origin`, w: 1440, h: 900 },
  { name: 'section_04_technology_1440', url: `${baseUrl}/#technology`, w: 1440, h: 900 },
  { name: 'section_05_transformations_1440', url: `${baseUrl}/#transformations`, w: 1440, h: 900 },
  { name: 'section_06_calculator_1440', url: `${baseUrl}/#calculator`, w: 1440, h: 900 },
  { name: 'section_07_g_intelligence_1440', url: `${baseUrl}/#g`, w: 1440, h: 950 }
];

for (const s of sections) {
  const outPath = path.join(artifactDir, `${s.name}.png`);
  const cmd = `${chromePath} --headless --disable-gpu --virtual-time-budget=4500 --window-size=${s.w},${s.h} --screenshot="${outPath}" "${s.url}"`;
  console.log(`Capturing ${s.name}...`);
  execSync(cmd);
}

console.log('All detailed section screenshots captured.');
