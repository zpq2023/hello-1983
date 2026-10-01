const path = require('node:path');
const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const results = [];

function check(name, ok, extra) {
  results.push((ok ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  → ' + extra : ''));
}

function fileUrl(f) {
  return 'file:///' + path.join(ROOT, f).replace(/\\/g, '/');
}

function base(f) {
  return path.basename(f);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });

  // ---------- 桌面：交互 ----------
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // 动图位是可选的：文件不存在时浏览器会记一条资源 404，这不是脚本错误
  const benign = (t) => /Failed to load resource|ERR_FILE_NOT_FOUND|net::ERR/.test(t);
  page.on('console', (m) => { if (m.type() === 'error' && !benign(m.text())) { errors.push(m.text()); } });

  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(1300);

  const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.is-in').length);
  check('入场动画元素被激活', revealed > 0, 'is-in = ' + revealed);

  const clockOk = await page.evaluate(() => {
    const s = document.querySelector('.clock__hand--s');
    if (!s) { return 'no hand'; }
    const a = getComputedStyle(s).transform;
    return a && a !== 'none' ? 'a' : 'none';
  });
  check('封面时钟指针已绘制并旋转', clockOk === 'a');

  // 秒针在 2.2 秒后应发生变化
  const t1 = await page.evaluate(() => getComputedStyle(document.querySelector('.clock__hand--s')).transform);
  await page.waitForTimeout(2200);
  const t2 = await page.evaluate(() => getComputedStyle(document.querySelector('.clock__hand--s')).transform);
  check('秒针持续走时', t1 !== t2, t1 + ' → ' + t2);

  // 报时钟声开关
  await page.click('[data-bell]');
  const bellState = await page.evaluate(() => ({
    pressed: document.querySelector('[data-bell]').getAttribute('aria-pressed'),
    stored: window.localStorage.getItem('hello1983-bell')
  }));
  check('报时开关可切换并记忆', bellState.pressed === 'true' && bellState.stored === '1',
    JSON.stringify(bellState));

  // 滚轮越界翻页（先滚到底）
  await page.evaluate(() => {
    const d = document.querySelector('.deck');
    d.style.scrollBehavior = 'auto';
    d.scrollTop = d.scrollHeight;
  });
  await page.waitForTimeout(400);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(120);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1200);
  check('滚轮到底后继续下滑翻到夏晓兰页', page.url().endsWith('xiaxiaolan.html'), page.url().split('/').pop());

  // 方向键翻页
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  check('方向键右键翻到周诚页', page.url().endsWith('zhoucheng.html'), page.url().split('/').pop());

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(900);
  check('方向键左键退回夏晓兰页', page.url().endsWith('xiaxiaolan.html'), page.url().split('/').pop());

  // 站点导航点跳转
  await page.click('.dot[data-goto="4"]');
  await page.waitForTimeout(900);
  check('导航点可跳到祝福页', page.url().endsWith('blessing.html'), page.url().split('/').pop());

  // 页内链接跳转
  await page.click('.nav__btn[data-prev]');
  await page.waitForTimeout(900);
  check('上一页按钮可退回双视角页', page.url().endsWith('two-views.html'), page.url().split('/').pop());

  // 双视角页应当有两个表盘
  const twinClocks = await page.evaluate(() => document.querySelectorAll('.clock svg').length);
  check('双视角页绘制两个表盘', twinClocks === 2, 'clocks = ' + twinClocks);

  // 演员剧照位：已装入剧照时应显示图片、隐藏占位
  await page.goto(fileUrl('xiaxiaolan.html'), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const gifSlot = await page.evaluate(() => {
    const fig = document.querySelector('.actor-gif');
    if (!fig) { return { count: 0 }; }
    const img = fig.querySelector('.actor-gif__img');
    return {
      count: document.querySelectorAll('.actor-gif').length,
      hasGif: fig.classList.contains('has-gif'),
      imgShown: getComputedStyle(img).display !== 'none',
      natural: img.naturalWidth + 'x' + img.naturalHeight,
      fallbackHidden: getComputedStyle(fig.querySelector('.actor-gif__fallback')).display === 'none',
      moving: getComputedStyle(img).animationName
    };
  });
  check('主角视角已装入剧照并带缓动',
    gifSlot.count === 1 && gifSlot.hasGif === true && gifSlot.imgShown === true &&
    gifSlot.fallbackHidden === true && gifSlot.moving !== 'none' && gifSlot.natural !== '0x0',
    JSON.stringify(gifSlot));

  // 末页的"下一页"应为禁用
  await page.goto(fileUrl('blessing.html'), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const nextDisabled = await page.evaluate(() => document.querySelector('[data-next]').disabled);
  check('末页下一页按钮禁用', nextDisabled === true);

  // 键盘空格：页内滚动到底后翻页
  await page.goto(fileUrl('xiaxiaolan.html'), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const d = document.querySelector('.deck');
    d.style.scrollBehavior = 'auto';
    d.scrollTop = d.scrollHeight;
  });
  await page.waitForTimeout(400);
  await page.keyboard.press(' ');
  await page.waitForTimeout(1000);
  check('空格键在页尾翻到下一页', page.url().endsWith('zhoucheng.html'), page.url().split('/').pop());

  check('运行期间无 JS 报错', errors.length === 0, errors.join(' | '));

  // ---------- 移动端：触摸滑动 ----------
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
  });
  const m = await ctx.newPage();
  const mErrors = [];
  m.on('pageerror', (e) => mErrors.push(e.message));
  m.on('console', (mm) => { if (mm.type() === 'error' && !benign(mm.text())) { mErrors.push(mm.text()); } });
  await m.goto(fileUrl('zhoucheng.html'), { waitUntil: 'load' });
  await m.waitForTimeout(1200);

  await m.evaluate(() => {
    const send = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
      document.dispatchEvent(new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true
      }));
    };
    send('touchstart', 320, 400);
    send('touchend', 120, 408);
  });
  await m.waitForTimeout(1000);
  check('触摸左滑翻到下一页', m.url().endsWith('two-views.html'), m.url().split('/').pop());

  await m.evaluate(() => {
    const send = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
      document.dispatchEvent(new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true
      }));
    };
    send('touchstart', 100, 500);
    send('touchend', 330, 492);
  });
  await m.waitForTimeout(1000);
  check('触摸右滑退回上一页', m.url().endsWith('zhoucheng.html'), m.url().split('/').pop());

  // 纵向滑动不应触发翻页
  const before = m.url();
  await m.evaluate(() => {
    const send = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
      document.dispatchEvent(new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true
      }));
    };
    send('touchstart', 200, 500);
    send('touchend', 214, 220);
  });
  await m.waitForTimeout(900);
  check('纵向滑动不误翻页', m.url() === before, m.url().split('/').pop());

  check('移动端无 JS 报错', mErrors.length === 0, mErrors.join(' | '));

  await browser.close();
  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  console.log('\n' + (results.length - failed) + '/' + results.length + ' 项通过');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
