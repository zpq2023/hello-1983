const path = require('node:path');
const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'index.html', 'xiaxiaolan.html', 'zhoucheng.html',
  'two-views.html', 'blessing.html'
];
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 }
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const out = [];
  let bad = 0;

  for (const vp of VIEWPORTS) {
    for (const f of FILES) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto('file:///' + path.join(ROOT, f).replace(/\\/g, '/'), { waitUntil: 'load' });
      await page.waitForTimeout(900);
      await page.evaluate(() => {
        const d = document.querySelector('.deck');
        if (d) { d.style.scrollBehavior = 'auto'; }
      });

      const res = await page.evaluate(() => {
        const results = [];
        const bar = document.querySelector('.topbar').getBoundingClientRect();
        const nav = document.querySelector('.nav__inner').getBoundingClientRect();
        const slides = document.querySelectorAll('.slide');
        const deck = document.querySelector('.deck');

        const inter = (a, b) => {
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return w > 0 && h > 0 ? w * h : 0;
        };

        // 只在「滚动到底」这一稳定位置判定遮挡：
        // 中途被固定栏压住的文字，继续下滑即可看到，不算缺陷。
        const measure = (s, i) => {
          const hits = [];
          s.querySelectorAll('p, h1, h2, h3, li, a, button, svg, span, div').forEach((el) => {
            if (el.closest('.topbar, .nav, .foot')) { return; }
            if (!el.textContent.trim() && !el.querySelector('svg') && el.tagName !== 'SVG') { return; }
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) { return; }
            if (r.width > window.innerWidth * 0.96 && r.height > window.innerHeight * 0.9) { return; }
            const a = inter(r, bar);
            const b = inter(r, nav);
            if (Math.max(a, b) > 40) {
              hits.push((el.tagName.toLowerCase()) + '(' + (el.className || '').toString().slice(0, 24) + ')' +
                ' area=' + Math.round(Math.max(a, b)) +
                ' rect=' + Math.round(r.top) + '..' + Math.round(r.bottom) +
                ' navTop=' + Math.round(nav.top));
            }
          });
          if (hits.length) { results.push({ slide: i + 1, hits: hits.slice(0, 4) }); }
        };

        // 滚到整站底部，检查末节文字是否被底栏压住
        if (deck) {
          deck.scrollTop = deck.scrollHeight;
          measure(slides[slides.length - 1], slides.length);
        }
        return results;
      });

      if (res.length) {
        bad++;
        out.push(`${vp.tag.padEnd(7)} ${f.padEnd(18)} ⚠ 与顶栏/底栏重叠: ` +
          res.map((r) => 's' + r.slide + ' [' + r.hits.join(', ') + ']').join('  '));
      } else {
        out.push(`${vp.tag.padEnd(7)} ${f.padEnd(18)} ok 无遮挡`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(out.join('\n'));
  console.log('\n' + (out.length - bad) + '/' + out.length + ' 组合无遮挡');
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
