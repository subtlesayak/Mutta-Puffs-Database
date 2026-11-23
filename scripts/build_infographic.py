"""Build the crowdsourced list infographic from the original Maps CSV."""

import csv
import re
from collections import Counter
from math import asin, atan2, cos, degrees, hypot, radians, sin, sqrt
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "mutta-puffs-everywhere.csv"
OUTPUT = ROOT / "visuals" / "mutta-puff-trail.png"
RADIUS_KM = 25
CITY_CENTERS = {
    "Alappuzha": (9.498, 76.338),
    "Bengaluru": (12.972, 77.595),
    "Chennai": (13.083, 80.271),
    "Coimbatore": (11.018, 76.972),
    "Kannur": (11.875, 75.370),
    "Kochi": (9.981, 76.300),
    "Kollam": (8.894, 76.614),
    "Kottayam": (9.591, 76.523),
    "Kozhikode": (11.258, 75.781),
    "Liverpool": (53.408, -2.991),
    "Malappuram": (11.074, 76.075),
    "Pala": (9.711, 76.685),
    "Palakkad": (10.787, 76.655),
    "Salalah": (17.021, 54.092),
    "Thalassery": (11.748, 75.492),
    "Thiruvananthapuram": (8.524, 76.937),
    "Thrissur": (10.528, 76.214),
}
TIP_EXCERPTS = (
    ("Dhanya Bakery", "Fresh ones drop around 3PM."),
    ("KR Bakes And Restaurant", "Great egg puff(ask for no cut)"),
    ("Rose Bakery", "best with some sarbath to drink"),
)
COORDINATE_PIN = re.compile(r"/maps/search/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$")
FEATURE_ID = re.compile(r"!1s0x([\da-f]+):0x[\da-f]+", re.IGNORECASE)


def project(st):
    """S2 quadratic projection from one cell-space axis to a cube face."""
    return (4 * st**2 - 1) / 3 if st >= 0.5 else (1 - 4 * (1 - st)**2) / 3


def s2_center(cell_id):
    """Return the centre of an S2 cell, as latitude and longitude."""
    face = cell_id >> 61
    level_bit = cell_id & -cell_id
    if face >= 6 or not (level_bit & 0x1555555555555555):
        return None

    level = 30 - (level_bit.bit_length() - 1) // 2
    ij_by_position = ((0, 1, 3, 2), (0, 2, 3, 1), (3, 2, 0, 1), (3, 1, 0, 2))
    orientation_deltas = (1, 0, 0, 3)
    orientation = face & 1
    i = j = 0
    for depth in range(1, level + 1):
        position = (cell_id >> (61 - 2 * depth)) & 3
        ij = ij_by_position[orientation][position]
        i = 2 * i + (ij >> 1)
        j = 2 * j + (ij & 1)
        orientation ^= orientation_deltas[position]

    u, v = (project((index + 0.5) / 2**level) for index in (i, j))
    x, y, z = ((1, u, v), (-u, 1, v), (-u, -v, 1),
               (-1, -v, -u), (v, -1, -u), (v, u, -1))[face]
    return degrees(atan2(z, hypot(x, y))), degrees(atan2(y, x))


def location(url):
    pin = COORDINATE_PIN.search(url)
    if pin:
        latitude, longitude = map(float, pin.groups())
        if abs(latitude) <= 90 and abs(longitude) <= 180:
            return latitude, longitude
        return None
    feature = FEATURE_ID.search(url)
    return s2_center(int(feature[1], 16)) if feature else None


def distance_km(first, second):
    lat_a, lon_a = map(radians, first)
    lat_b, lon_b = map(radians, second)
    arc = sin((lat_a - lat_b) / 2)**2 + cos(lat_a) * cos(lat_b) * sin((lon_a - lon_b) / 2)**2
    return 12742 * asin(min(1, sqrt(arc)))


def area_counts(urls):
    counts = Counter()
    mapped = 0
    for url in urls:
        point = location(url)
        if point is None:
            continue
        mapped += 1
        distance, city = min((distance_km(point, center), city) for city, center in CITY_CENTERS.items())
        if distance <= RADIUS_KM:
            counts[city] += 1
    return sorted(counts.items(), key=lambda area: (-area[1], area[0])), mapped


def font(size, family="body"):
    candidates = {
        "body": ("Arial.ttf", "DejaVuSans.ttf"),
        "bold": ("Arial Bold.ttf", "DejaVuSans-Bold.ttf"),
        "serif": ("Georgia Bold.ttf", "DejaVuSerif-Bold.ttf"),
    }
    for filename in candidates[family]:
        for path in (Path("/System/Library/Fonts/Supplemental") / filename, filename):
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)


def build(rows):
    urls = [row["URL"] for row in rows if row["URL"]]
    notes = {row["Title"]: row["Note"].strip() for row in rows if row["Note"].strip()}
    note_count = sum(bool(row["Note"].strip()) for row in rows)
    pin_count = sum(bool(COORDINATE_PIN.search(url)) for url in urls)
    areas, mapped = area_counts(urls)
    top_areas = areas[:5]

    background, ink, muted = "#FFF6E9", "#281D2C", "#604F53"
    accent, track, rule = "#AB4029", "#F1DFCF", "#DECBBA"
    image = Image.new("RGB", (1200, 1450), background)
    draw = ImageDraw.Draw(image)
    left, right = 70, 1130

    def label(x, y, value, size, family="body", color=ink, anchor="lt"):
        draw.text((x, y), str(value), font=font(size, family), fill=color, anchor=anchor)

    draw.rectangle((left, 65, right, 72), fill=accent)
    label(left, 99, "MUTTAPUFFS EVERYWHERE", 25, "bold", accent)
    label(left, 159, "The mutta puff trail", 88, "serif")
    label(left, 275, "A crowdsourced list of egg puff stops", 35, color=muted)

    metrics = ((len(urls), "Maps links"), (note_count, "Contributor notes"), (pin_count, "Coordinate pins"))
    draw.rounded_rectangle((left, 354, right, 517), radius=19, fill=track)
    for index, (value, name) in enumerate(metrics):
        x = 103 + index * 353
        if index:
            draw.line((x - 33, 383, x - 33, 487), fill=rule, width=2)
        label(x, 379, value, 65, "serif")
        label(x, 462, name, 26, "bold", muted)

    label(left, 576, "Most-saved areas", 45, "serif")
    total = sum(count for _, count in top_areas)
    label(left, 646, f"{total} of {mapped} mappable entries are near the cities shown.", 27, color=muted)

    scale = max((count for _, count in top_areas), default=1)
    for index, (area, count) in enumerate(top_areas):
        middle = 723 + 59 * index
        bar_end = 442 + round(590 * count / scale)
        label(left, middle, area, 29, "bold", anchor="lm")
        draw.rounded_rectangle((442, middle - 13, 1032, middle + 13), radius=13, fill=track)
        draw.rounded_rectangle((442, middle - 13, bar_end, middle + 13), radius=13, fill=accent)
        label(1092, middle, count, 29, "bold", anchor="rm")

    draw.line((left, 1017, right, 1017), fill=rule, width=2)
    label(left, 1062, "From contributor notes", 41, "serif")
    tips = [(name, excerpt) for name, excerpt in TIP_EXCERPTS if excerpt in notes.get(name, "")]
    for index, (name, tip) in enumerate(tips):
        y = 1130 + 55 * index
        label(left, y, name, 26, "bold")
        label(510, y, f"“{tip}”", 26, color=muted)

    draw.line((left, 1306, right, 1306), fill=rule, width=2)
    label(left, 1332, "Source  ·  MuttaPuffs Everywhere, crowdsourced Google Maps export", 23, "bold")
    label(left, 1370, f"Approximate areas use the nearest selected city centre within {RADIUS_KM} km.", 23, color=muted)
    return image


if __name__ == "__main__":
    with SOURCE.open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build(rows).save(OUTPUT, optimize=True)
