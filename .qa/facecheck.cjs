/* 用浏览器自带的形状检测 API 粗略判断候选图是不是"人脸特写"，
   用来排除风景图 / 文字图 / 海报拼图。检测不到 API 就如实报告。 */

const fs = require('node:fs');
const path = require('node:path');
const PW = 'C:/Users/30704/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(PW);

const ROOT = path.resolve(__dirname, '..');
const DL = path.join(ROOT, '.qa', 'dl');

(async () => {
  const files = fs.readdirSync(DL).filter((f) => f.endsWith('.gif')).sort();
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto('about:blank');

  const hasApi = await page.evaluate(() => typeof window.FaceDetector === 'function');
  console.log('FaceDetector API: ' + (hasApi ? 'available' : 'NOT available'));

  const rows = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(DL, f));
    const b64 = buf.toString('base64');
    const res = await page.evaluate(async ({ b64, hasApi }) => {
      const img = new Image();
      img.src = 'data:image/gif;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let skin = 0, total = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        total++;
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && (Math.max(r, g, b) - Math.min(r, g, b)) > 15 && Math.abs(r - g) > 15) {
          skin++;
        }
      }

      let faces = -1, biggest = 0;
      if (hasApi) {
        try {
          const det = new FaceDetector({ fastMode: true, maxDetectedFaces: 6 });
          const found = await det.detect(c);
          faces = found.length;
          found.forEach((x) => { biggest = Math.max(biggest, x.boundingBox.width * x.boundingBox.height); });
        } catch (e) { faces = -2; }
      }
      return {
        w: c.width, h: c.height,
        skin: +(skin / total * 100).toFixed(1),
        faces, faceArea: faces > 0 ? +(biggest / (c.width * c.height) * 100).toFixed(1) : 0
      };
    }, { b64, hasApi });

    rows.push(`${f.padEnd(10)} ${String(res.w).padStart(4)}x${String(res.h).padEnd(4)} ` +
      `肤色占比=${String(res.skin).padStart(5)}%  face=${res.faces}  脸部占画面=${res.faceArea}%`);
  }

  console.log('\n' + rows.join('\n'));
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
