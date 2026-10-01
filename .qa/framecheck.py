"""确认剧照真的画在页面上了：在整页截图里裁出左侧人物卡区域，统计肤色像素与色彩离散度。
如果剧照没渲染出来（或被遮住），这块区域会是接近纯色的深色。"""

import os
import sys

import numpy as np
from PIL import Image

SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shots")

TARGETS = [
    ("desktop-xiaxiaolan-1.png", "夏晓兰 · 主角视角 01"),
    ("desktop-zhoucheng-1.png", "周诚 · 主角视角 02"),
]

print(f"{'截图':<28} {'区域':<12} {'肤色占比':>8} {'亮度σ':>7} {'判定':>6}")
bad = 0
for name, who in TARGETS:
    fp = os.path.join(SHOTS, name)
    if not os.path.exists(fp):
        print(f"{name:<28} 缺失")
        bad += 1
        continue
    with Image.open(fp) as im:
        im = im.convert("RGB")
        w, h = im.size
        # 剧照框本身所在的紧裁区域（左侧人物卡中央的方形框）
        box = im.crop((int(w * 0.20), int(h * 0.19), int(w * 0.35), int(h * 0.47)))
        a = np.asarray(box).astype(np.float32)

    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    skin = (r > 95) & (g > 40) & (b > 20) & (r > g) & (r > b) & \
           ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 15) & \
           (np.abs(r - g) > 15)
    share = skin.mean() * 100
    sigma = float((0.2126 * r + 0.7152 * g + 0.0722 * b).std())

    ok = share > 8 and sigma > 22
    if not ok:
        bad += 1
    print(f"{name:<28} {who:<12} {share:7.2f}% {sigma:7.2f} {'OK' if ok else 'MISS?'}")

print(f"\n{len(TARGETS) - bad}/{len(TARGETS)} 张剧照确认渲染")
sys.exit(1 if bad else 0)
