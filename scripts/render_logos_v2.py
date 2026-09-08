"""Round 2: 4 fresh logo directions for PelangganKu, tagline: Jangkau Ulang Setiap Pelanggan."""
import os, math
from PIL import Image, ImageDraw, ImageFont

os.makedirs("/app/frontend/public/logos", exist_ok=True)

def font(size, bold=True):
    for p in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

BG = "#FAF7F2"
ACCENT = "#C2410C"
ACCENT_DARK = "#7C2D12"
ACCENT_MID = "#E05206"
ACCENT_SOFT = "#F97316"
ACCENT_LIGHT = "#FED7AA"
CREAM = "#FFF7ED"
CHARCOAL = "#1C1917"
STONE = "#57534E"

def wordmark(d, x, y):
    d.text((x, y), "PelangganKu", font=font(56), fill=CHARCOAL)
    d.text((x, y + 72), "Jangkau ulang setiap pelanggan", font=font(20, bold=False), fill=STONE)

# ======================================================================
# LOGO A — RADAR PING: heart-dot in center, concentric dashed arcs opening rightward
# metaphor: sinyal "jangkau ulang" ke pelanggan yang tersebar
# ======================================================================
img = Image.new("RGB", (900, 520), BG)
d = ImageDraw.Draw(img)
cx, cy = 260, 260
# Outer arcs (progressively lighter, opening 40°..320°)
arcs = [(200, ACCENT_LIGHT, 26), (155, ACCENT_SOFT, 22), (110, ACCENT_MID, 18)]
for r, col, w in arcs:
    d.arc([cx - r, cy - r, cx + r, cy + r], start=-70, end=70, fill=col, width=w)
# Solid center circle
d.ellipse([cx - 55, cy - 55, cx + 55, cy + 55], fill=ACCENT)
# Small dot inside center circle (target)
d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=CREAM)
wordmark(d, 500, 210)
img.save("/app/frontend/public/logos/A.png", "PNG")

# ======================================================================
# LOGO B — LOOP KEMBALI: circular arrow (repeat symbol) around a warm dot
# metaphor: pelanggan yang balik lagi & lagi
# ======================================================================
img = Image.new("RGB", (900, 520), BG)
d = ImageDraw.Draw(img)
cx, cy = 260, 260
# Ring (thick, near-full circle with a gap on the right)
d.arc([cx - 130, cy - 130, cx + 130, cy + 130], start=200, end=110, fill=ACCENT, width=34)
# Arrow tip at end of arc (~110°) — pointing tangentially
# Compute tip position
a = math.radians(110)
tx = cx + 130 * math.cos(a); ty = cy + 130 * math.sin(a)
# arrow triangle rotated
t_size = 34
# Perpendicular direction to draw arrow
d.polygon([
    (tx + 24, ty - 6),
    (tx - 18, ty - 28),
    (tx - 6, ty + 30),
], fill=ACCENT)
# center soft warm bloom
d.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=ACCENT_LIGHT)
d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=ACCENT_DARK)
wordmark(d, 500, 210)
img.save("/app/frontend/public/logos/B.png", "PNG")

# ======================================================================
# LOGO C — BATIK NUSANTARA: 5 warm circles arranged as archipelago arc, one highlighted
# metaphor: menjangkau tiap pulau/kota, Indonesian identity
# ======================================================================
img = Image.new("RGB", (900, 520), BG)
d = ImageDraw.Draw(img)
cx, cy = 260, 260
# Arc of dots (5 circles along a curve)
dots = [
    (100, 320, 30, ACCENT_LIGHT),
    (170, 240, 38, ACCENT_SOFT),
    (260, 190, 46, ACCENT),        # highlighted
    (355, 220, 38, ACCENT_MID),
    (420, 300, 30, ACCENT_LIGHT),
]
# Subtle connecting line (path)
line_pts = [(x, y) for x, y, r, c in dots]
for i in range(len(line_pts) - 1):
    x0, y0 = line_pts[i]; x1, y1 = line_pts[i + 1]
    d.line([(x0, y0), (x1, y1)], fill=ACCENT_LIGHT, width=6)
# Dots on top
for x, y, r, c in dots:
    d.ellipse([x - r, y - r, x + r, y + r], fill=c)
# Highlight center dot with a ring
x, y, r, _ = dots[2]
d.ellipse([x - r - 12, y - r - 12, x + r + 12, y + r + 12], outline=ACCENT_DARK, width=4)
# Small cream pin dot in highlighted circle
d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=CREAM)
wordmark(d, 500, 210)
img.save("/app/frontend/public/logos/C.png", "PNG")

# ======================================================================
# LOGO D — BUNGA MEKAR (BLOOM): rounded 5-petal warm mandala, batik feel
# metaphor: setiap pelanggan mekar / bertumbuh, warm identity
# ======================================================================
img = Image.new("RGB", (900, 520), BG)
d = ImageDraw.Draw(img)
cx, cy = 260, 260
petal_colors = [ACCENT, ACCENT_MID, ACCENT_SOFT, ACCENT, ACCENT_MID]
# Draw 5 rounded "petals" as ellipses rotated around center
import numpy as np
for i in range(5):
    ang = -math.pi / 2 + i * (2 * math.pi / 5)
    # Petal center offset from cx, cy
    r_offset = 70
    px = cx + r_offset * math.cos(ang)
    py = cy + r_offset * math.sin(ang)
    # Draw petal as rotated ellipse via mask
    petal = Image.new("RGBA", (200, 90), (0, 0, 0, 0))
    pd = ImageDraw.Draw(petal)
    pd.ellipse([0, 0, 200, 90], fill=petal_colors[i])
    petal = petal.rotate(math.degrees(ang) + 90, resample=Image.BICUBIC, expand=True)
    px2 = int(px - petal.width / 2); py2 = int(py - petal.height / 2)
    img.paste(petal, (px2, py2), petal)
# Center circle (cream) with dot
d2 = ImageDraw.Draw(img)
d2.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], fill=CREAM)
d2.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], fill=ACCENT_DARK)
wordmark(d2, 500, 210)
img.save("/app/frontend/public/logos/D.png", "PNG")

print("Round 2 logos ready:")
for n in "ABCD":
    p = f"/app/frontend/public/logos/{n}.png"
    print(f"  {p}  ({os.path.getsize(p)} bytes)")
