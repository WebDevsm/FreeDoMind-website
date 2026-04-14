import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));
const totalH = await page.evaluate(() => document.getElementById('fm-cinema-hero').offsetHeight);
const pinR = totalH - 900;
// Sample at: stage 0, mid stage 0→1 (mid-spin), stage 1, mid 1→2 (upside-down moment), stage 2, mid 2→3, stage 3
const samples = [
  { name: 's0',         p: 0.05 },
  { name: 's0to1_mid',  p: 0.14 },
  { name: 's1',         p: 0.40 },
  { name: 's1to2_mid',  p: 0.42 },
  { name: 's2',         p: 0.66 },
  { name: 's2to3_mid',  p: 0.68 },
  { name: 's3',         p: 0.99 },
];
for (const s of samples) {
  const y = Math.round(pinR * s.p);
  await page.evaluate((yy) => {
    if (window.fmLenis) window.fmLenis.scrollTo(yy, { immediate: false, duration: 0.5 });
    else window.scrollTo(0, yy);
  }, y);
  await new Promise(r => setTimeout(r, 1300));
  await page.screenshot({ path: `temporary screenshots/spin_${s.name}.png` });
}
await browser.close();
