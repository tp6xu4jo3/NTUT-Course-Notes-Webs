"""Publish directory-based notes and preserve legacy URLs."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from urllib.parse import quote, unquote, urlsplit
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "dist"
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
(OUT / ".nojekyll").touch()
for name in ("SPSS", "robotics", "E-book Platform"):
    shutil.copytree(ROOT / name, OUT / name)
for name in ("index.html", "site.css"):
    shutil.copy2(ROOT / name, OUT / name)

def redirect(path, target):
    path = OUT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    safe = escape(target, quote=True)
    path.write_text(f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url={safe}"><title>頁面已移動</title></head><body><a href="{safe}">前往頁面</a></body></html>', encoding="utf-8")

redirect("spss/index.html", "../SPSS/")
redirect("SPSS.html", "SPSS/")
redirect("自主移動機器人_指南.html", "robotics/")
redirect("physica-ai/index.html", "../E-book%20Platform/reader.html?book=physica-ai")
redirect("實體人工智慧_科學誌.html", "E-book%20Platform/reader.html?book=physica-ai")
platform = OUT / "E-book Platform"

class PageAssets(HTMLParser):
    def __init__(self, fragment):
        super().__init__()
        self.fragment = fragment
    def handle_starttag(self, tag, attrs):
        if tag != "img":
            return
        src = dict(attrs).get("src", "")
        url = urlsplit(src)
        if src and not url.scheme and not url.netloc and url.path and not url.path.startswith("/"):
            # The reader inserts fragments into reader.html, so relative image paths use platform.
            if not (platform / unquote(url.path)).is_file():
                raise SystemExit(f"Missing image in {self.fragment}: {src}")

ids = set()
for rel in json.loads((platform / "catalog.json").read_text(encoding="utf-8")):
    manifest = platform / rel
    book = json.loads(manifest.read_text(encoding="utf-8"))
    expected = Path(*(book.get("categories") or ["其他"]), book["title"], "book.json")
    if Path(rel) != expected:
        raise SystemExit(f"Book folder does not match shelf: {rel}")
    if book["id"] in ids:
        raise SystemExit(f"Duplicate book ID: {book['id']}")
    ids.add(book["id"])
    assets = [book["cover"], *book["pages"], *book.get("styles", []), *book.get("scripts", [])]
    if book.get("widgets"):
        assets.append(book["widgets"])
    for asset in assets:
        if not (manifest.parent / asset).is_file():
            raise SystemExit(f"Missing book asset: {asset}")
    for page in book["pages"]:
        fragment = manifest.parent / page
        PageAssets(fragment).feed(fragment.read_text(encoding="utf-8"))
    if any(not 0 <= c["page"] < len(book["pages"]) for c in book["toc"]):
        raise SystemExit(f"Invalid TOC: {rel}")
print("Published SPSS, robotics and E-book Platform.")
