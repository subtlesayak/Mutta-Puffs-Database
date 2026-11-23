"""Render a printable infographic from the crowdsourced Maps export."""

from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from analyze import analyse, read_rows
from geography import Boundaries, MAP_BOUNDS


OUTPUT = Path(__file__).resolve().parents[1] / "visuals" / "mutta-puff-trail.png"
PAPER, INK, MUTED = "#FBF5E9", "#28231F", "#5B554C"
FOREST, CREAM, LIGHT = "#173A32", "#FFF7E8", "#E4E5D2"
ACCENT, TRACK, RULE = "#A63B26", "#EEE3D3", "#D9CBB9"
WATER, LAND, BOUNDARY = "#E9EFE6", "#F6EDDA", "#8B9074"
TIP_CARDS = (
    ("Dhanya Bakery", ("around 3pm", "made on site"), ("Fresh batch around 3 pm", "Made on site")),
    ("KR Bakes And Restaurant", ("no cut", "onion puff", "chenna puff"), ("Uncut egg puff", "Onion and chenna puffs too")),
    ("Rose Bakery", ("always hot", "sarbath"), ("Hot mutta puff", "Pair it with sarbath")),
)


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


def map_panel(boundaries, records):
    image = Image.new("RGB", (496, 405), WATER)
    draw = ImageDraw.Draw(image)
    west, south, east, north = MAP_BOUNDS
    scale = 405 / (north - south)
    gutter = (496 - (east - west) * scale) / 2

    def xy(lon, lat):
        return gutter + (lon - west) * scale, (north - lat) * scale

    for _, ring in boundaries.southern_outlines():
        draw.polygon([xy(*point) for point in ring], fill=LAND, outline=BOUNDARY)

    bins = Counter()
    for row in records:
        lat, lon = row["latitude"], row["longitude"]
        if lat is not None and south <= lat <= north and west <= lon <= east:
            x, y = xy(lon, lat)
            bins[round(x / 10) * 10, round(y / 10) * 10] += 1
    for (x, y), count in sorted(bins.items(), key=lambda item: item[1], reverse=True):
        radius = 3.5 + 2.4 * count**0.5
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=ACCENT, outline=PAPER, width=1)
    for name, lat, lon in (("Kerala", 10.9, 73.25), ("Karnataka", 14.5, 75.95), ("Tamil Nadu", 10.35, 79.95)):
        draw.text(xy(lon, lat), name, font=font(18, "bold"), fill=FOREST, anchor="mm", stroke_width=2, stroke_fill=WATER)
    return image


def build(analysis, boundaries):
    summary, records = analysis["summary"], analysis["records"]
    image = Image.new("RGB", (1200, 1530), PAPER)
    draw = ImageDraw.Draw(image)
    left, right = 72, 1128

    def label(x, y, value, size, family="body", colour=INK, anchor="lt"):
        draw.text((x, y), str(value), font=font(size, family), fill=colour, anchor=anchor)

    draw.rectangle((0, 0, 1200, 306), fill=FOREST)
    label(left, 62, "MUTTAPUFFS EVERYWHERE", 22, "bold", LIGHT)
    label(left, 117, "The mutta puff trail", 86, "serif", CREAM)
    label(left, 231, "A crowdsourced list of egg puff stops", 30, colour=LIGHT)

    stats = ((summary["rows"], "Source entries"), (summary["mappable"], "Mappable links"),
             (len(summary["countries"]), "Countries"), (summary["notes"], "Contributor notes"))
    for index, (count, text) in enumerate(stats):
        x = left + index * 266
        label(x, 345, count, 66, "serif", ACCENT)
        label(x, 431, text, 24, "bold", MUTED)
    draw.line((left, 487, right, 487), fill=RULE, width=2)

    label(left, 529, "Where people saved a stop", 50, "serif")
    india = summary["countries"].get("India", 0)
    kerala = summary["india_states"].get("Kerala", 0)
    label(left, 603, f"Kerala accounts for {kerala} of the {india} entries assigned to India.", 28, colour=MUTED)

    image.paste(map_panel(boundaries, records), (left, 665))
    label(left, 1088, "Southern India · Larger dots show more entries", 21, colour=MUTED)

    x = 625
    label(x, 663, "Top Indian states", 32, "serif")
    states = list(summary["india_states"].items())[:3]
    maximum = states[0][1] if states else 1
    for index, (name, count) in enumerate(states):
        y = 721 + 59 * index
        label(x, y, name, 24, "bold")
        label(right, y, count, 24, "bold", anchor="rt")
        draw.rounded_rectangle((x, y + 33, right, y + 42), radius=4, fill=TRACK)
        draw.rounded_rectangle((x, y + 33, x + (right - x) * count / maximum, y + 42), radius=4, fill=ACCENT)

    label(x, 925, "Beyond India", 30, "serif")
    abroad = [(country, count) for country, count in summary["countries"].items() if country != "India"][:4]
    for index, (country, count) in enumerate(abroad):
        column = x + index % 2 * 269
        y = 981 + index // 2 * 41
        label(column, y, country, 20, "bold", MUTED)
        label(x + 220 if index % 2 == 0 else right, y, count, 20, "bold", anchor="rt")

    draw.line((left, 1146, right, 1146), fill=RULE, width=2)
    label(left, 1187, "From contributor notes", 42, "serif")
    notes = {row["title"]: row["note"].casefold() for row in records if row["note"].strip()}
    for index, (name, phrases, lines) in enumerate(TIP_CARDS):
        if not all(phrase in notes.get(name, "") for phrase in phrases):
            continue
        x = left + index * 355
        label(x, 1264, name, 24, "bold")
        for line, tip in enumerate(lines):
            label(x, 1304 + line * 32, tip, 23, colour=MUTED)

    draw.line((left, 1395, right, 1395), fill=RULE, width=2)
    label(left, 1421, "Source · Crowdsourced MuttaPuffs Everywhere Google Maps export", 22, "bold")
    label(left, 1461, "Geographic assignments are approximate. Boundaries by Natural Earth 5.1.2.", 21, colour=MUTED)
    return image


if __name__ == "__main__":
    boundaries = Boundaries()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build(analyse(read_rows(), boundaries), boundaries).save(OUTPUT, optimize=True)
