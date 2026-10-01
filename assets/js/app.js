/* ===================================================================
   《你好，1983》· 国庆特辑
   多页面滑动浏览项目 — 交互脚本
   依赖：无。全部离线可用。
   =================================================================== */

(function () {
  'use strict';

  /* ---------------- 页面谱系 ---------------- */

  var PAGES = [
    { href: 'index.html', name: '封面 · 你好，1983' },
    { href: 'xiaxiaolan.html', name: '夏晓兰 · 破局者' },
    { href: 'zhoucheng.html', name: '周诚 · 守护者' },
    { href: 'two-views.html', name: '双视角 · 两种时间' },
    { href: 'blessing.html', name: '共祝祖国 · 终章' }
  ];

  var pageIndex = parseInt(document.body.getAttribute('data-page') || '0', 10);
  if (isNaN(pageIndex)) { pageIndex = 0; }

  var deck = document.querySelector('.deck');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 时钟绘制 ---------------- */

  function ticksSVG() {
    var out = '';
    for (var i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      var a = (i * 6 - 90) * Math.PI / 180;
      var r1 = big ? 79 : 84;
      var r2 = 89;
      var x1 = (100 + Math.cos(a) * r1).toFixed(2);
      var y1 = (100 + Math.sin(a) * r1).toFixed(2);
      var x2 = (100 + Math.cos(a) * r2).toFixed(2);
      var y2 = (100 + Math.sin(a) * r2).toFixed(2);
      out += '<line class="clock__tick' + (big ? ' clock__tick--big' : '') +
        '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>';
    }
    return out;
  }

  function clockSVG(label) {
    return '' +
      '<svg viewBox="0 0 200 200" role="img" aria-label="时钟，指针随时间转动">' +
        '<circle class="clock__face" cx="100" cy="100" r="97"></circle>' +
        '<circle class="clock__rim" cx="100" cy="100" r="97"></circle>' +
        '<circle class="clock__rim2" cx="100" cy="100" r="91"></circle>' +
        ticksSVG() +
        '<text class="clock__num" x="100" y="42">12</text>' +
        '<text class="clock__num" x="160" y="100">3</text>' +
        '<text class="clock__num" x="100" y="160">6</text>' +
        '<text class="clock__num" x="40" y="100">9</text>' +
        '<text class="clock__label" x="100" y="140">' + label + '</text>' +
        '<g class="clock__hand clock__hand--h"><line x1="100" y1="100" x2="100" y2="58" stroke="#e0b473" stroke-width="4.6"></line></g>' +
        '<g class="clock__hand clock__hand--m"><line x1="100" y1="100" x2="100" y2="44" stroke="#f7dfae" stroke-width="2.8"></line></g>' +
        '<g class="clock__hand clock__hand--s"><line x1="100" y1="112" x2="100" y2="34" stroke="#e02b3d" stroke-width="1.5"></line></g>' +
        '<circle class="clock__cap" cx="100" cy="100" r="5"></circle>' +
        '<circle class="clock__cap2" cx="100" cy="100" r="2"></circle>' +
      '</svg>';
  }

  function handAngles(h, m, s) {
    return {
      s: s * 6,
      m: m * 6 + s * 0.1,
      h: (h % 12) * 30 + m * 0.5
    };
  }

  function paint(el, a) {
    el.h.style.transform = 'rotate(' + a.h + 'deg)';
    el.m.style.transform = 'rotate(' + a.m + 'deg)';
    el.s.style.transform = 'rotate(' + a.s + 'deg)';
  }

  var clocks = [];

  function initClocks() {
    var nodes = document.querySelectorAll('[data-clock]');
    Array.prototype.forEach.call(nodes, function (node) {
      var label = node.getAttribute('data-clock-label') || '北京时间';
      var mode = node.getAttribute('data-mode') || 'live';
      var fixed = node.getAttribute('data-time') || '';
      var rewind = node.hasAttribute('data-rewind');

      node.innerHTML = clockSVG(label);

      var rec = {
        node: node,
        mode: mode,
        h: node.querySelector('.clock__hand--h'),
        m: node.querySelector('.clock__hand--m'),
        s: node.querySelector('.clock__hand--s'),
        sAbs: 0,
        live: false
      };

      var now = new Date();
      var hh = now.getHours();
      var mm = now.getMinutes();
      var ss = now.getSeconds();

      if (mode === 'fixed' && fixed.indexOf(':') > -1) {
        var bits = fixed.split(':');
        hh = parseInt(bits[0], 10) || 0;
        mm = parseInt(bits[1], 10) || 0;
        ss = 0;
      }

      rec.sAbs = ss * 6;
      paint(rec, handAngles(hh, mm, ss));

      if (mode === 'fixed') {
        clocks.push(rec);
        return;
      }

      if (rewind && !reduceMotion) {
        node.classList.add('clock--rewind');
        var target = handAngles(hh, mm, ss);
        var start = performance.now();
        var DUR = 1900;

        var step = function (t) {
          var p = Math.min((t - start) / DUR, 1);
          var e = 1 - Math.pow(1 - p, 3);
          paint(rec, {
            h: target.h + 120 * (1 - e),
            m: target.m + 720 * (1 - e),
            s: target.s + 1440 * (1 - e)
          });
          if (p < 1) {
            requestAnimationFrame(step);
          } else {
            rec.sAbs = new Date().getSeconds() * 6;
            node.classList.remove('clock--rewind');
            rec.live = true;
          }
        };
        requestAnimationFrame(step);
      } else {
        rec.live = true;
      }

      clocks.push(rec);
    });
  }

  function tickClocks() {
    var now = new Date();
    for (var i = 0; i < clocks.length; i++) {
      var rec = clocks[i];
      if (!rec.live) { continue; }
      rec.sAbs += 6;
      rec.h.style.transform = 'rotate(' + ((now.getHours() % 12) * 30 + now.getMinutes() * 0.5 + now.getSeconds() * (0.5 / 60)) + 'deg)';
      rec.m.style.transform = 'rotate(' + (now.getMinutes() * 6 + now.getSeconds() * 0.1) + 'deg)';
      rec.s.style.transform = 'rotate(' + rec.sAbs + 'deg)';
    }
  }

  /* ---------------- 顶栏实时时间 ---------------- */

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function initTopClock() {
    var node = document.querySelector('[data-now]');
    if (!node) { return; }
    var run = function () {
      var d = new Date();
      node.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    };
    run();
    setInterval(run, 1000);
  }

  /* ---------------- 报时钟声（WebAudio 合成，无外部资源） ---------------- */

  var bellOn = false;
  var audioCtx = null;

  try {
    bellOn = window.localStorage.getItem('hello1983-bell') === '1';
  } catch (e) { bellOn = false; }

  function chime() {
    if (!bellOn) { return; }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { return; }
      if (!audioCtx) { audioCtx = new Ctx(); }
      if (audioCtx.state === 'suspended') { audioCtx.resume(); }
      var t0 = audioCtx.currentTime;
      var tones = [660, 990, 1320];
      tones.forEach(function (f, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.16 / (i + 1), t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5 + i * 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 2.2);
      });
    } catch (e) { /* 静默降级 */ }
  }

  /* ---------------- 导航条 ---------------- */

  var dotsWrap = document.querySelector('[data-dots]');
  var labelNode = document.querySelector('[data-label]');
  var prevBtn = document.querySelector('[data-prev]');
  var nextBtn = document.querySelector('[data-next]');
  var bellBtn = document.querySelector('[data-bell]');

  function buildNav() {
    if (dotsWrap) {
      var html = '';
      for (var i = 0; i < PAGES.length; i++) {
        html += '<button type="button" class="dot' + (i === pageIndex ? ' is-active' : '') +
          '" data-goto="' + i + '" aria-label="前往：' + PAGES[i].name + '"' +
          (i === pageIndex ? ' aria-current="page"' : '') + '></button>';
      }
      dotsWrap.innerHTML = html;
      dotsWrap.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-goto]');
        if (!btn) { return; }
        goTo(parseInt(btn.getAttribute('data-goto'), 10));
      });
    }
    if (labelNode) { labelNode.textContent = PAGES[pageIndex].name; }
    if (prevBtn) { prevBtn.disabled = pageIndex <= 0; }
    if (nextBtn) { nextBtn.disabled = pageIndex >= PAGES.length - 1; }
    if (bellBtn) {
      bellBtn.setAttribute('aria-pressed', bellOn ? 'true' : 'false');
      bellBtn.addEventListener('click', function () {
        bellOn = !bellOn;
        bellBtn.setAttribute('aria-pressed', bellOn ? 'true' : 'false');
        try { window.localStorage.setItem('hello1983-bell', bellOn ? '1' : '0'); } catch (e) { }
        if (bellOn) { chime(); }
      });
    }
  }

  function goTo(i) {
    if (i < 0 || i >= PAGES.length || i === pageIndex) { return; }
    chime();
    var main = document.querySelector('.deck');
    if (main && !reduceMotion) {
      main.classList.add('is-turning');
    }
    window.location.href = PAGES[i].href;
  }

  /* ---------------- 滚动揭示 + 进度 ---------------- */

  var progressBar = document.querySelector('[data-progress]');

  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) { return; }
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (t) { t.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
        }
      });
    }, { root: deck || null, threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  }

  function initProgress() {
    if (!deck) { return; }
    var update = function () {
      if (!progressBar) { return; }
      var max = deck.scrollHeight - deck.clientHeight;
      var inner = max > 0 ? deck.scrollTop / max : 0;
      var pct = ((pageIndex + inner) / PAGES.length) * 100;
      progressBar.style.width = pct.toFixed(2) + '%';
    };
    deck.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------- 翻页：滚轮越界 / 键盘 / 横向滑动 ---------------- */

  // 末节可能比一屏略高，强制吸附会把滚动位置拉回它的起点。
  // 这段「够不着的余量」必须算进来，否则滚到底也不会触发翻页。
  function endSlack() {
    if (!deck) { return 0; }
    var slides = deck.querySelectorAll('.slide');
    if (!slides.length) { return 0; }
    var last = slides[slides.length - 1];
    return Math.max(0, last.getBoundingClientRect().height - deck.clientHeight);
  }

  function atDeckEnd() {
    if (!deck) { return false; }
    var max = deck.scrollHeight - deck.clientHeight;
    return deck.scrollTop >= max - endSlack() - 6;
  }

  function atDeckStart() {
    return !deck || deck.scrollTop <= 6;
  }

  function initPaging() {
    if (prevBtn) { prevBtn.addEventListener('click', function () { goTo(pageIndex - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { goTo(pageIndex + 1); }); }

    document.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) { return; }
      var tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { return; }
      if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === 'j') {
        ev.preventDefault();
        goTo(pageIndex + 1);
      } else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp' || ev.key === 'k') {
        ev.preventDefault();
        goTo(pageIndex - 1);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        goTo(0);
      } else if (ev.key === ' ' || ev.key === 'Spacebar') {
        if (atDeckEnd()) {
          ev.preventDefault();
          goTo(pageIndex + 1);
        }
      }
    });

    if (!deck) { return; }

    // 站内链接跳转时也响一声
    document.addEventListener('click', function (ev) {
      var link = ev.target.closest ? ev.target.closest('a[href$=".html"]') : null;
      if (link) { chime(); }
    });

    var locked = false;
    var stuck = 0;
    var lastTop = 0;

    function turn(dir) {
      locked = true;
      window.setTimeout(function () { locked = false; }, 1100);
      goTo(pageIndex + dir);
    }

    deck.addEventListener('wheel', function (ev) {
      if (locked) { return; }
      var dir = ev.deltaY > 18 ? 1 : (ev.deltaY < -18 ? -1 : 0);
      if (!dir) { return; }

      var top = deck.scrollTop;
      stuck = Math.abs(top - lastTop) < 1.5 ? stuck + 1 : 0;
      lastTop = top;
      if (stuck < 1) { return; }

      if (dir > 0 && atDeckEnd() && pageIndex < PAGES.length - 1) {
        stuck = 0;
        turn(1);
      } else if (dir < 0 && atDeckStart() && pageIndex > 0) {
        stuck = 0;
        turn(-1);
      }
    }, { passive: true });

    var sx = 0, sy = 0, st = 0, tracking = false;

    document.addEventListener('touchstart', function (ev) {
      if (ev.touches.length !== 1) { tracking = false; return; }
      sx = ev.touches[0].clientX;
      sy = ev.touches[0].clientY;
      st = Date.now();
      tracking = true;
    }, { passive: true });

    document.addEventListener('touchend', function (ev) {
      if (!tracking) { return; }
      tracking = false;
      var t = ev.changedTouches && ev.changedTouches[0];
      if (!t) { return; }
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      var dt = Date.now() - st;
      if (dt > 900) { return; }
      if (Math.abs(dx) < 62 || Math.abs(dx) < Math.abs(dy) * 1.6) { return; }
      if (dx < 0) { goTo(pageIndex + 1); } else { goTo(pageIndex - 1); }
    }, { passive: true });

    // 桌面端鼠标横向拖拽翻页
    var md = null;
    document.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) { return; }
      if (ev.target.closest('a, button, input, textarea, select, .panel--paper')) { return; }
      md = { x: ev.clientX, y: ev.clientY, t: Date.now() };
    });
    document.addEventListener('mouseup', function (ev) {
      if (!md) { return; }
      var d = md;
      md = null;
      var dx = ev.clientX - d.x;
      var dy = ev.clientY - d.y;
      if (Date.now() - d.t > 900) { return; }
      if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 2) { return; }
      if (dx < 0) { goTo(pageIndex + 1); } else { goTo(pageIndex - 1); }
    });
  }

  /* ---------------- 烟花 ---------------- */

  /* ---------------- 演员动图：有图就显示，没图就留动画占位 ---------------- */

  var IMG_EXTS = ['gif', 'png', 'jpg', 'jpeg', 'webp'];

  function initActorGifs() {
    var figs = document.querySelectorAll('.actor-gif');
    Array.prototype.forEach.call(figs, function (fig) {
      var img = fig.querySelector('.actor-gif__img');
      if (!img) { return; }
      var base = img.getAttribute('data-base');
      if (!base) { return; }

      var next = 0;
      img.addEventListener('load', function () {
        if (img.naturalWidth > 0) { fig.classList.add('has-gif'); }
      });
      img.addEventListener('error', function () {
        fig.classList.remove('has-gif');
        if (next < IMG_EXTS.length) { img.src = base + '.' + IMG_EXTS[next++]; }
      });
      img.src = base + '.' + IMG_EXTS[next++];
    });
  }

  function initFireworks() {
    var canvas = document.querySelector('canvas[data-fireworks]');
    if (!canvas || reduceMotion) { return; }
    var ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    var parts = [];
    var w = 0, h = 0, dpr = 1;
    var COLORS = ['#f7dfae', '#e0b473', '#ff6b7a', '#e02b3d', '#ffd08a'];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst() {
      var cx = w * (0.12 + Math.random() * 0.76);
      var cy = h * (0.14 + Math.random() * 0.44);
      var n = 30 + Math.floor(Math.random() * 22);
      var base = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n + Math.random() * 0.24;
        var sp = 1.1 + Math.random() * 3.1;
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: 0.007 + Math.random() * 0.013,
          size: 1 + Math.random() * 1.9,
          color: Math.random() < 0.72 ? base : COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
      if (parts.length > 900) { parts.splice(0, parts.length - 900); }
    }

    var lastBurst = 0;
    var last = performance.now();

    function frame(now) {
      var dt = Math.min((now - last) / 16.67, 3);
      last = now;

      if (now - lastBurst > 1100) {
        lastBurst = now;
        burst();
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 0.032 * dt;
        p.vx *= 0.985;
        p.vy *= 0.988;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }

        ctx.globalAlpha = Math.max(p.life, 0) * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  /* ---------------- 启动 ---------------- */

  function boot() {
    initClocks();
    initActorGifs();
    initTopClock();
    buildNav();
    initReveal();
    initProgress();
    initPaging();
    initFireworks();
    setInterval(tickClocks, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
