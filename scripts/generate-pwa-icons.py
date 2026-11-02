#!/usr/bin/env python3
"""Generate PWA icons matching AppLogo colors."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public"
BG = (238, 242, 255)  # #eef2ff
PRIMARY = (79, 70, 229)  # #4f46e5
ACCENT = (234, 88, 12)  # #ea580c
WHITE = (255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    d = ImageDraw.Draw(img)
    pad = size * 0.12
    book_w = size * 0.56
    book_h = size * 0.72
    x0 = pad + size * 0.08
    y0 = pad + size * 0.06
    d.rounded_rectangle([x0, y0, x0 + book_w, y0 + book_h], radius=int(size * 0.08), fill=PRIMARY)
    spine = x0 + book_w * 0.22
    d.rectangle([spine, y0, spine + size * 0.02, y0 + book_h], fill=WHITE)
    tab_x = x0 + book_w * 0.72
    d.polygon(
        [
            (tab_x, y0 - size * 0.04),
            (tab_x + size * 0.18, y0 + size * 0.06),
            (tab_x + size * 0.18, y0 + book_h),
            (tab_x, y0 + book_h),
        ],
        fill=ACCENT,
    )
    return img


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512)):
        draw_icon(size).save(ROOT / name, format="PNG")
    print("Wrote", ROOT / "icon-192.png", "and", ROOT / "icon-512.png")


if __name__ == "__main__":
    main()
