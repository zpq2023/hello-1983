"""把下载到的候选剧照统一处理成正方形：
  先算出"肤色像素"分布，把方形取景框滑到肤色最密的区域，
  这样竖构图照片也不会把脸裁掉。结果输出到 assets/gifs/candidates/。"""

import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "gifs", "candidates")
os.makedirs(OUT, exist_ok=True)

SIZE = 640


def skin_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    return (r > 95) & (g > 40) & (b > 20) & (r > g) & (r > b) & ((mx - mn) > 15) & (np.abs(r - g) > 15)


def best_square(im):
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    h, w, _ = a.shape
    m = skin_mask(a)
    s = min(w, h)
    step = max(1, s // 30)

    best, best_score, best_off = None, -1.0, 0
    if w >= h:
        for x in range(0, w - s + 1, step):
            win = m[:, x:x + s]
            score = win.mean()
            if score > best_score:
                best_score, best_off = score, x
        box = (best_off, 0, best_off + s, s)
    else:
        span = h - s
        for y in range(0, span + 1, step):
            win = m[y:y + s, :]
            # 人脸通常在画面上半部，同分时优先靠上
            score = win.mean() + 0.02 * (1 - (y / span if span else 0))
            if score > best_score:
                best_score, best_off = score, y
        box = (0, best_off, s, best_off + s)

    crop = im.convert("RGB").crop(box)
    inside = skin_mask(np.asarray(crop).astype(np.int16)).mean()
    return crop.resize((SIZE, SIZE), Image.LANCZOS), box, inside, (w, h), s


rows = []
for role, folder in (("xiaxiaolan", ".qa/xx"), ("zhoucheng", ".qa/zc")):
    files = sorted(glob.glob(os.path.join(ROOT, folder, "*.jpg")))
    for i, fp in enumerate(files, 1):
        tag = os.path.basename(fp).replace(".jpg", "")
        with Image.open(fp) as im:
            out, box, inside, src, side = best_square(im)
        name = f"{role}-{i:02d}.png"
        out.save(os.path.join(OUT, name), "PNG")
        axis = "x" if src[0] >= src[1] else "y"
        rows.append(f"{tag:<8} -> {name:<20} 源{src[0]}x{src[1]}  裁{side}px 取景{axis}={box[0] if axis=='x' else box[1]:<4} "
                    f"裁后肤色={inside*100:5.1f}%")

print("\n".join(rows))
print(f"\n共 {len(rows)} 张 -> assets/gifs/candidates/")
