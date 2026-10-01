/* 验证「放入动图后自动显示」这条链路：
   先临时生成 assets/gifs/xiaxiaolan.gif，再确认页面切到真实动图，
   最后把临时文件删掉，保证交付物里不会留下假素材。 */

const fs = require('node:fs');
const path = require('node:path');
const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'assets', 'gifs', 'xiaxiaolan.gif');

(async () => {
  if (!fs.existsSync(TARGET)) {
    console.log('SKIP 没有临时动图文件，先运行生成步骤');
    return;
  }

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let allOk = true;

  for (const file of ['xiaxiaolan.html', 'zhoucheng.html']) {
    await page.goto('file:///' + path.join(ROOT, file).replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => {
      const fig = document.querySelector('.actor-gif');
      const img = fig.querySelector('.actor-gif__img');
      return {
        src: img.getAttribute('src'),
        hasGif: fig.classList.contains('has-gif'),
        imgDisplay: getComputedStyle(img).display,
        imgNatural: img.naturalWidth + 'x' + img.naturalHeight,
        fallbackDisplay: getComputedStyle(fig.querySelector('.actor-gif__fallback')).display
      };
    });
    const ok = state.hasGif && state.imgDisplay !== 'none' &&
      state.fallbackDisplay === 'none' && state.imgNatural !== '0x0';
    allOk = allOk && ok;
    console.log((ok ? 'PASS  ' : 'FAIL  ') + file.padEnd(18) + JSON.stringify(state));
  }

  // 选图页：20 张候选都应当加载成功
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const p2err = [];
  p2.on('pageerror', (e) => p2err.push(e.message));
  await p2.goto('file:///' + path.join(ROOT, 'pick-image.html').replace(/\\/g, '/'), { waitUntil: 'load' });
  await p2.waitForTimeout(1500);
  const pick = await p2.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.card img'));
    return {
      total: imgs.length,
      loaded: imgs.filter((i) => i.naturalWidth > 0).length,
      firstBad: (imgs.find((i) => i.naturalWidth === 0) || {}).getAttribute
        ? imgs.find((i) => i.naturalWidth === 0).getAttribute('src') : null
    };
  });
  const pickOk = pick.total === 20 && pick.loaded === 20 && p2err.length === 0;
  console.log((pickOk ? 'PASS  ' : 'FAIL  ') + 'pick-image.html  ' + JSON.stringify(pick) +
    (p2err.length ? '  err=' + p2err.join('|') : ''));
  allOk = allOk && pickOk;
  await browser.close();

  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
