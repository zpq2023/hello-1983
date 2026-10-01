const path = require('node:path');
const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  ['blessing.html', 1440, 900],
  ['index.html', 390, 844]
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });

  for (const [file, w, h] of TARGETS) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('file:///' + path.join(ROOT, file).replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const data = await page.evaluate(() => {
      const deck = document.querySelector('.deck');
      deck.style.scrollBehavior = 'auto';
      deck.scrollTop = deck.scrollHeight;
      const slides = Array.from(document.querySelectorAll('.slide'));
      const last = slides[slides.length - 1];
      const nav = document.querySelector('.nav__inner').getBoundingClientRect();
      const strip = (el) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
      };
      return {
        clock: (() => {
          const c = last.querySelector('.oracle__clock');
          if (!c) { return null; }
          const r = c.getBoundingClientRect();
          return {
            w: Math.round(r.width), h: Math.round(r.height),
            cssWidth: getComputedStyle(c).width,
            classes: c.className
          };
        })(),
        deck: { scrollTop: Math.round(deck.scrollTop), scrollHeight: deck.scrollHeight, clientHeight: deck.clientHeight },
        slideCount: slides.length,
        lastSlide: strip(last),
        lastPad: getComputedStyle(last).padding,
        wrap: strip(last.querySelector('.wrap')),
        deepest: strip(last.querySelector('.wrap').lastElementChild),
        nav: { top: Math.round(nav.top), bottom: Math.round(nav.bottom) },
        viewport: window.innerHeight
      };
    });
    console.log('=== ' + file + ' @ ' + w + 'x' + h + ' ===');
    console.log(JSON.stringify(data, null, 2));
    await page.close();
  }

  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
