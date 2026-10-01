"""检查候选动图：是不是真动图、多大、画面里有没有人脸（用来排除错图/风景图/文字图）。"""

import glob
import os

from PIL import Image, ImageSequence

try:
    import cv2  # 可选
    HAS_CV = True
except Exception:
    HAS_CV = False

DL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dl")
CASCADE = None
if HAS_CV:
    for name in ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt.xml"):
        path = os.path.join(cv2.data.haarcascades, name)
        if os.path.exists(path):
            CASCADE = cv2.CascadeClassifier(path)
            break

print(f"opencv: {'yes' if HAS_CV else 'no'}   cascade: {'yes' if CASCADE is not None else 'no'}\n")

rows = []
for fp in sorted(glob.glob(os.path.join(DL, "*.gif"))):
    name = os.path.basename(fp)
    with Image.open(fp) as im:
        frames = list(ImageSequence.Iterator(im))
        n = len(frames)
        size = im.size
        fmt = im.format
        durations = []
        for f in frames:
            durations.append(f.info.get("duration", 0))

        faces = []
        face_box = 0
        if CASCADE is not None and n:
            mid = frames[min(n // 2, n - 1)].convert("RGB")
            arr = cv2.cvtColor(__import__("numpy").array(mid), cv2.COLOR_RGB2GRAY)
            det = CASCADE.detectMultiScale(arr, 1.15, 5, minSize=(28, 28))
            faces = list(det)
            for (x, y, w, h) in faces:
                face_box = max(face_box, w * h)

        cover = (face_box / (size[0] * size[1])) if face_box else 0.0
        rows.append(
            f"{name:<10} {fmt:<5} {size[0]:>4}x{size[1]:<4} frames={n:<4} "
            f"dur={sum(durations)}ms  faces={len(faces):<2} faceArea={cover*100:5.1f}%"
        )

print("\n".join(rows))
