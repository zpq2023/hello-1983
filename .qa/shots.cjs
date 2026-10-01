const path = require('node:path');
const fs = require('node:fs');

const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.qa', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const FILES = [
  'index.html',
  'xiaxiaolan.html',
  'zhoucheng.html',
  'two-views.html',
  'blessing.html'
];

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 }
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const report = [];

  for (const vp of VIEWPORTS) {
    for (const file of FILES) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1
      });
      const problems = [];
      page.on('console', (m) => {
        // 动图位可选，缺文件时的资源 404 不算问题
        if (m.type() === 'error' && !/Failed to load resource|ERR_FILE_NOT_FOUND|net::ERR/.test(m.text())) {
          problems.push('CONSOLE: ' + m.text());
        }
      });
      page.on('pageerror', (e) => problems.push('PAGEERROR: ' + e.message));

      const url = 'file:///' + path.join(ROOT, file).replace(/\\/g, '/');
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(1400);

      const info = await page.evaluate(() => {
        const deck = document.querySelector('.deck');
        if (deck) { deck.style.scrollBehavior = 'auto'; }
        const hands = document.querySelector('.clock__hand--s');
        return {
          slides: document.querySelectorAll('.slide').length,
          clocks: document.querySelectorAll('.clock svg').length,
          hand: hands ? getComputedStyle(hands).transform : 'MISSING',
          navLabel: (document.querySelector('.nav__label') || {}).textContent || '',
          now: (document.querySelector('[data-now]') || {}).textContent || '',
          dots: document.querySelectorAll('.dot').length,
          dotActive: document.querySelectorAll('.dot.is-active').length,
          spilled: deck ? deck.scrollWidth > deck.clientWidth + 2 : false,
          docScroll: document.documentElement.scrollWidth > window.innerWidth + 2
        };
      });

      const fitNotes = [];

      for (let i = 0; i < info.slides; i++) {
        await page.evaluate((idx) => {
          const deck = document.querySelector('.deck');
          const s = document.querySelectorAll('.slide')[idx];
          if (deck && s) { deck.scrollTop = s.offsetTop; }
        }, i);
        await page.waitForTimeout(1100);
        const fit = await page.evaluate((idx) => {
          const s = document.querySelectorAll('.slide')[idx];
          const r = s.getBoundingClientRect();
          const cs = getComputedStyle(s);
          const padTop = parseFloat(cs.paddingTop);
          const padBottom = parseFloat(cs.paddingBottom);
          const inner = s.scrollHeight - padTop - padBottom;
          const avail = window.innerHeight - padTop - padBottom;
          let wide = 0;
          s.querySelectorAll('*').forEach((el) => {
            // 被父级 overflow:hidden 裁掉的动效（如动图框里的扫光）不算溢出
            for (let p = el.parentElement; p && p !== s; p = p.parentElement) {
              if (getComputedStyle(p).overflow !== 'visible') { return; }
            }
            const b = el.getBoundingClientRect();
            if (b.width && b.right > window.innerWidth + 1) { wide++; }
          });
          return { ratio: +(inner / avail).toFixed(2), wide, h: Math.round(r.height) };
        }, i);
        await page.screenshot({
          path: path.join(OUT, `${vp.tag}-${file.replace('.html', '')}-${i + 1}.png`)
        });
        fitNotes.push(`s${i + 1}:fill=${fit.ratio}${fit.ratio > 1.02 ? ' OVER' : ''}${fit.wide ? ' wide=' + fit.wide : ''}`);
      }

      report.push(
        `${vp.tag.padEnd(7)} ${file.padEnd(18)} clocks=${info.clocks} hand=${info.hand === 'none' ? 'null' : 'ok'}` +
        ` nav="${info.navLabel}" now=${info.now} active=${info.dotActive}/${info.dots}` +
        ` overflowX=${info.spilled || info.docScroll ? 'YES' : 'no'}` +
        '  [' + fitNotes.join(' ') + ']' +
        (problems.length ? '  ⚠ ' + problems.join(' | ') : '')
      );

      await page.close();
    }
  }

  await browser.close();
  console.log(report.join('\n'));
  console.log('\nshots -> ' + OUT);
})().catch((e) => {
  console.error('FATAL: ' + e.message);
  process.exit(1);
});
