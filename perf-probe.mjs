import puppeteer from 'puppeteer';

const URL = process.argv[2] || 'http://localhost:3000/';
const HEADED = process.argv.includes('--headed');

const browser = await puppeteer.launch({
  headless: HEADED ? false : 'new',
  defaultViewport: { width: 1440, height: 900 }
});
const page = await browser.newPage();
const cdp = await page.target().createCDPSession();

await page.evaluateOnNewDocument(() => {
  window.__frames = [];
  let last = performance.now();
  function frame(now) {
    if (window.__measuring) window.__frames.push({ dt: now - last, t: now, scrollY: window.scrollY });
    last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});

console.log(`mode: ${HEADED ? 'HEADED (real Chrome window)' : 'headless'}`);
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));

// Real-user-style scrolling: fast bursts via wheel events, irregular speeds, rapid reversals
console.log('aggressive scroll test...');
await page.evaluate(() => { window.__measuring = true; });

// Scenario 1: fast scroll down
for (let i = 0; i < 60; i++) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: 100
  });
  await new Promise(r => setTimeout(r, 25));
}
await new Promise(r => setTimeout(r, 200));

// Scenario 2: rapid reversal — scroll up fast (the user's pain point)
for (let i = 0; i < 40; i++) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: -150
  });
  await new Promise(r => setTimeout(r, 20));
}
await new Promise(r => setTimeout(r, 300));

// Scenario 3: jagged scroll (variable speed)
for (let i = 0; i < 30; i++) {
  const dy = Math.floor(Math.random() * 200) - 50;
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: dy
  });
  await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
}

await page.evaluate(() => { window.__measuring = false; });
const frames = await page.evaluate(() => window.__frames);

const slow = frames.filter(f => f.dt > 33).sort((a,b) => b.dt - a.dt);
console.log(`\nSLOW FRAMES (>33ms): ${slow.length} of ${frames.length}`);
for (const f of slow.slice(0, 10)) {
  console.log(`  ${f.dt.toFixed(0).padStart(5)}ms  scrollY=${Math.round(f.scrollY).toString().padStart(5)}px  t=${(f.t/1000).toFixed(2)}s`);
}
const dts = frames.map(f => f.dt).sort((a,b) => a-b);
console.log(`\nFRAME PERCENTILES: p50=${dts[Math.floor(dts.length*0.5)]?.toFixed(1)}ms p95=${dts[Math.floor(dts.length*0.95)]?.toFixed(1)}ms p99=${dts[Math.floor(dts.length*0.99)]?.toFixed(1)}ms max=${dts[dts.length-1]?.toFixed(1)}ms`);

if (HEADED) await new Promise(r => setTimeout(r, 5000));
await browser.close();
