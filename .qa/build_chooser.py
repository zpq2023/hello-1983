"""生成 pick-image.html —— 一个离线选图页，把 20 张候选剧照铺开对比。
页面不依赖网络，双击即可打开。"""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TITLES = {
    "xiaxiaolan": [
        ("周也 夏晓兰 你好1983", 40.4),
        ("周也新剧你好1983今日开播，80年代夏晓兰造型获赞", 57.3),
        ("周也演绎夏晓兰：灵魂魅力大过外表", 47.5),
        ("周也 你好1983 夏晓兰", 28.0),
        ("周也把夏晓兰演活了，傲娇宠人双在线", 54.1),
        ("周也夏晓兰的可爱剧照来啦", 52.7),
        ("周也夏晓兰的可爱剧照来啦", 34.7),
        ("一集换了8套造型，完全就是从画报里走出来的", 47.1),
        ("周也饰演的夏晓兰从现代的社畜穿越到1983年", 11.1),
        ("周也2026年3月17日主演《你好1983》饰演夏晓兰", 53.1),
    ],
    "zhoucheng": [
        ("《你好1983》你的80年代白月光周诚来啦", 28.3),
        ("【翟潇闻】周诚：这个家我一定要加入！", 49.0),
        ("翟潇闻在剧里饰演出身于高干家庭的法律系高材生周诚", 18.3),
        ("【翟潇闻】武力值max的周诚", 50.5),
        ("周诚 理想型 #翟潇闻把周诚演活了！", 48.2),
        ("周诚 解语花 #看完《你好1983》，我宣布周诚就是我的理想男友", 11.8),
        ("周诚的追梦人生正在加载中 #你好1983# 领衔主演：翟潇闻", 11.6),
        ("翟潇闻发文告别你好1983角色周诚", 31.9),
        ("翟潇闻周诚", 38.8),
        ("翟潇闻周诚 #翟潇闻你好1983", 51.8),
    ],
}

INSTALLED = {"xiaxiaolan": "xiaxiaolan.gif（当前装的是 xx06 那张）", "zhoucheng": "zhoucheng.png（当前装的是 zc04 那张）"}
LABEL = {"xiaxiaolan": "夏晓兰 · 主角视角 01", "zhoucheng": "周诚 · 主角视角 02"}


def section(role):
    cards = []
    for i, (title, near) in enumerate(TITLES[role], 1):
        name = f"{role}-{i:02d}.png"
        near_tag = "近景" if near > 40 else ("中景" if near > 25 else "远景/群像")
        cards.append(f"""
      <figure class="card">
        <img src="assets/gifs/candidates/{name}" alt="{LABEL[role]} 候选 {i}">
        <figcaption>
          <b>#{i:02d}</b> <span class="near">{near_tag} {near}%</span>
          <p class="src">{title}</p>
          <code>Copy-Item assets/gifs/candidates/{name} assets/gifs/{role}.png -Force</code>
        </figcaption>
      </figure>""")
    return f"""
  <section>
    <h2>{LABEL[role]}</h2>
    <p class="now">当前使用：{INSTALLED[role]}</p>
    <div class="grid">{"".join(cards)}
    </div>
  </section>"""


html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>选图 · 你好1983 国庆特辑</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; padding: 28px 20px 60px; background: #140708; color: #f7ecda;
         font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; line-height: 1.7; }}
  h1 {{ font-family: "Songti SC", serif; font-size: 1.6rem; letter-spacing: .1em; color: #f7dfae; margin: 0 0 6px; }}
  h2 {{ font-family: "Songti SC", serif; font-size: 1.25rem; letter-spacing: .08em; color: #f7dfae;
        margin: 34px 0 4px; padding-bottom: 10px; border-bottom: 1px solid rgba(224,180,115,.28); }}
  .lead {{ color: rgba(247,236,218,.66); max-width: 60em; margin: 0 0 4px; }}
  .now {{ color: #e0b473; font-size: 13px; margin: 6px 0 0; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 18px; }}
  .card {{ margin: 0; border: 1px solid rgba(224,180,115,.26); border-radius: 12px; overflow: hidden;
           background: rgba(255,255,255,.04); }}
  .card img {{ display: block; width: 100%; aspect-ratio: 1/1; object-fit: cover; }}
  .card figcaption {{ padding: 10px 12px 14px; font-size: 13px; }}
  .card b {{ color: #f7dfae; font-size: 15px; letter-spacing: .1em; }}
  .near {{ float: right; font-size: 11px; color: rgba(247,236,218,.5); border: 1px solid rgba(224,180,115,.3);
           border-radius: 99px; padding: 1px 8px; }}
  .src {{ margin: 6px 0 8px; color: rgba(247,236,218,.7); }}
  code {{ display: block; font-size: 11px; word-break: break-all; color: #b9d8dd;
          background: rgba(45,109,120,.18); border-radius: 6px; padding: 6px 8px; }}
</style>
</head>
<body>
  <h1>挑一张剧照</h1>
  <p class="lead">下面 20 张都来自公开图片索引，且来源页标题里明确写了「周也 / 夏晓兰」或「翟潇闻 / 周诚」。<br>
  原图统一按人脸密集区裁成了正方形。<b>近景度</b>越高说明裁出来的画面越接近脸部特写。</p>
  <p class="lead">换图：点下面的命令复制到 PowerShell 里执行，或者直接告诉我编号，我帮你换。</p>
{section("xiaxiaolan")}
{section("zhoucheng")}
</body>
</html>
"""

with open(os.path.join(ROOT, "pick-image.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("pick-image.html 已生成")
