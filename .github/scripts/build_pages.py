"""Publish directory-based notes and preserve legacy URLs."""
from pathlib import Path
from html import escape
from urllib.parse import quote
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
for rel in json.loads((platform / "catalog.json").read_text(encoding="utf-8")):
    manifest = platform / rel
    book = json.loads(manifest.read_text(encoding="utf-8"))
    assets = [book["cover"], *book["pages"], *book.get("styles", []), *book.get("scripts", [])]
    if book.get("widgets"):
        assets.append(book["widgets"])
    for asset in assets:
        if not (manifest.parent / asset).is_file():
            raise SystemExit(f"Missing book asset: {asset}")
    if any(not 0 <= c["page"] < len(book["pages"]) for c in book["toc"]):
        raise SystemExit(f"Invalid TOC: {rel}")
print("Published SPSS, robotics and E-book Platform.")
