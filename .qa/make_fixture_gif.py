"""临时生成一张测试用动图，用来验证「放入 GIF 后自动显示」这条链路。
验证完请删除 assets/gifs/xiaxiaolan.gif 与 assets/gifs/zhoucheng.gif。"""

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "gifs")
os.makedirs(OUT, exist_ok=True)


def make(name, accent):
    frames = []
    for i in range(3):
        f = Image.new("RGB", (96, 96), (20, 8, 9))
        d = ImageDraw.Draw(f)
        d.ellipse([10, 10, 85, 85], outline=(224, 180, 115), width=3)
        d.line([48, 48, 48, 20 + i * 18], fill=accent, width=3)
        d.text((10, 78), "TEST", fill=(247, 223, 174))
        frames.append(f)
    path = os.path.join(OUT, name)
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=180, loop=0)
    print("made", path, os.path.getsize(path), "bytes")


make("xiaxiaolan.gif", (224, 43, 61))
make("zhoucheng.gif", (45, 109, 120))
