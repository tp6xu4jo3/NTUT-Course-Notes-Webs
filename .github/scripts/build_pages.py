"""Build a GitHub Pages directory for each top-level HTML file, unchanged."""
from pathlib import Path
from html import escape, unescape
from hashlib import sha256
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'dist'
ROUTES = {
    'SPSS.html': 'spss',
    '實體人工智慧_科學誌.html': 'physica-ai',
    '自主移動機器人_指南.html': 'robotics',
}

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
(OUT / '.nojekyll').touch()
pages = []
used = set()
for source in sorted(ROOT.glob('*.html')):
    # Keep the exact original filename accessible as well as the clean URL.
    shutil.copy2(source, OUT / source.name)
    if source.name in ROUTES:
        slug = ROUTES[source.name]
    else:
        candidate = re.sub(r'[^a-z0-9-]+', '-', source.stem.lower()).strip('-')
        slug = candidate if candidate and source.stem.isascii() else 'page-' + sha256(source.name.encode('utf-8')).hexdigest()[:10]
    if slug in used:
        raise SystemExit(f'Duplicate public URL slug: {slug}')
    used.add(slug)
    folder = OUT / slug
    folder.mkdir()
    shutil.copy2(source, folder / 'index.html')
    text = source.read_text(encoding='utf-8')
    match = re.search(r'<title\b[^>]*>(.*?)</title>', text, flags=re.I | re.S)
    title = unescape(re.sub(r'\s+', ' ', match.group(1)).strip()) if match else source.stem
    pages.append((slug, title, source.name))

items = '\n'.join(
    '<a class="card" href="' + escape(slug, quote=True) + '/">'
    '<span class="label">' + escape(title) + '</span>'
    '<span class="file">' + escape(name) + '</span>'
    '<span class="link">開啟網站 ↗</span></a>'
    for slug, title, name in pages
)
homepage = '''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NTUT 課程筆記｜網站目錄</title>
<style>
:root{color-scheme:light;font-family:system-ui,-apple-system,'Noto Sans TC',sans-serif}
*{box-sizing:border-box}body{margin:0;background:#f6f7f4;color:#172c32}
main{max-width:1000px;margin:auto;padding:clamp(28px,7vw,72px) 22px}
h1{font-size:clamp(28px,5vw,46px);letter-spacing:-.04em;margin:8px 0}
p{color:#637277;line-height:1.7}.eyebrow{color:#116e61;font-size:12px;letter-spacing:.18em;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;margin-top:32px}
.card{text-decoration:none;color:inherit;background:#fff;border:1px solid #dce5e0;border-radius:17px;padding:22px;min-height:190px;display:flex;flex-direction:column;gap:14px;transition:transform .15s,border-color .15s}
.card:hover,.card:focus-visible{transform:translateY(-3px);border-color:#459b88;outline:none}
.label{font-size:20px;font-weight:750;line-height:1.4}.file{color:#73827c;font-size:12px;overflow-wrap:anywhere}
.link{margin-top:auto;color:#116e61;font-weight:700;font-size:13px}
footer{color:#7b8780;margin-top:38px;font-size:12px}</style></head><body>
<main><div class="eyebrow">NTUT / COURSE NOTES</div>
<h1>課程筆記 · 網站目錄</h1>
<p>每份HTML都有自己的網址，內容及互動功能直接來自儲存庫中的原始檔案。</p>
<section class="grid">''' + items + '''</section>
<footer>更新GitHub中的HTML後，網站將由GitHub Actions重新部署。</footer>
</main></body></html>'''
(OUT / 'index.html').write_text(homepage, encoding='utf-8')
print('Generated site routes:')
for slug, title, _ in pages:
    print(f'/{slug}/  {title}')
