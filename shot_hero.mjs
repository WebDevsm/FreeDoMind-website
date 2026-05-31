import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const sizes = [
  { w: 2560, h: 1440, label: '01-big-2560x1440' },
  { w: 1920, h: 1080, label: '02-desktop-1920x1080' },
  { w: 1440, h: 900,  label: '03-laptop-1440x900' },
  { w: 1280, h: 800,  label: '04-laptop-1280x800' },
  { w: 1100, h: 720,  label: '05-narrow-1100x720' },
];
for (const s of sizes) {
  const page = await browser.newPage();
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: `/tmp/hero-${s.label}.png` });
  await page.close();
  console.log(`shot ${s.label}`);
}
await browser.close();
