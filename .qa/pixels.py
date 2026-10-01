"""Sanity-check the rendered screenshots: not blank, and use the intended palette."""

import glob
import os

import numpy as np
from PIL import Image

SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shots")

rows = []
for fp in sorted(glob.glob(os.path.join(SHOTS, "*.png"))):
    name = os.path.basename(fp)
    with Image.open(fp) as im:
        im = im.convert("RGB")
        a = np.asarray(im).astype(np.float32)

    h, w, _ = a.shape
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    gold = ((r > 150) & (g > 105) & (b < 140) & (r >= g) & (g > b)).mean()
    red = ((r > 90) & (r > g * 1.55) & (r > b * 1.35)).mean()
    light = (lum > 200).mean()
    dark = (lum < 40).mean()
    grain = lum.std()
    unique = len(np.unique(((a // 16).astype(np.uint8)).reshape(-1, 3), axis=0))

    flags = []
    if grain < 4:
        flags.append("BLANK?")
    if unique < 40:
        flags.append("FLAT?")
    if light < 0.002:
        flags.append("NO-TEXT?")

    rows.append(
        f"{name:<38} {w}x{h} grain={grain:5.1f} tones={unique:5d} "
        f"gold={gold*100:5.2f}% red={red*100:5.2f}% text={light*100:4.2f}% dark={dark*100:5.1f}% "
        + (" ".join(flags) if flags else "ok")
    )

print("\n".join(rows))
bad = [r for r in rows if r.rstrip().rsplit(" ", 1)[-1] != "ok"]
print(f"\n{len(rows)} screenshots, {len(bad)} flagged")
