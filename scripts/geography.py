"""Approximate positions and geographical groups derived from the Maps links."""

import gzip
import json
import re
from math import asin, atan2, cos, degrees, hypot, radians, sin, sqrt
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOUNDARIES = ROOT / "data" / "reference" / "natural-earth-5.1.2.json.gz"
CITY_RADIUS_KM = 25
BOUNDARY_TOLERANCE_KM = 2
CITY_CENTRES = {
    "Alappuzha": (9.498, 76.338), "Bengaluru": (12.972, 77.595),
    "Chennai": (13.083, 80.271), "Coimbatore": (11.018, 76.972),
    "Kannur": (11.875, 75.370), "Kochi": (9.981, 76.300), "Kollam": (8.894, 76.614),
    "Kottayam": (9.591, 76.523), "Kozhikode": (11.258, 75.781), "Liverpool": (53.408, -2.991),
    "Malappuram": (11.074, 76.075), "Pala": (9.711, 76.685), "Palakkad": (10.787, 76.655),
    "Salalah": (17.021, 54.092), "Thalassery": (11.748, 75.492),
    "Thiruvananthapuram": (8.524, 76.937), "Thrissur": (10.528, 76.214),
}
COORDINATE_PIN = re.compile(r"/maps/search/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/?$")
FEATURE_ID = re.compile(r"!1s0x([\da-f]+):0x([\da-f]+)", re.IGNORECASE)
MAP_BOUNDS = (73.6, 7.7, 81.1, 16.5)  # west, south, east, north


def project(st):
    return (4 * st**2 - 1) / 3 if st >= 0.5 else (1 - 4 * (1 - st)**2) / 3


def s2_center(cell_id):
    """S2 quadratic projection and Hilbert traversal, returning latitude and longitude."""
    face = cell_id >> 61
    level_bit = cell_id & -cell_id
    if not 0 <= face < 6 or not (level_bit & 0x1555555555555555):
        return None
    level = 30 - (level_bit.bit_length() - 1) // 2
    ij_by_position = ((0, 1, 3, 2), (0, 2, 3, 1), (3, 2, 0, 1), (3, 1, 0, 2))
    orientation_deltas = (1, 0, 0, 3)
    orientation = face & 1
    i = j = 0
    for depth in range(1, level + 1):
        position = (cell_id >> (61 - 2 * depth)) & 3
        ij = ij_by_position[orientation][position]
        i, j = 2 * i + (ij >> 1), 2 * j + (ij & 1)
        orientation ^= orientation_deltas[position]
    u, v = (project((index + 0.5) / 2**level) for index in (i, j))
    x, y, z = ((1, u, v), (-u, 1, v), (-u, -v, 1),
               (-1, -v, -u), (v, -1, -u), (v, u, -1))[face]
    return degrees(atan2(z, hypot(x, y))), degrees(atan2(y, x))


def map_reference(url):
    """Return the link type, stable comparison key, coordinate source and point."""
    if not url:
        return "No link", "", "Unavailable", None
    pin = COORDINATE_PIN.search(url.split("?", 1)[0])
    if pin:
        point = tuple(map(float, pin.groups()))
        if abs(point[0]) <= 90 and abs(point[1]) <= 180:
            return "Coordinate pin", f"pin:{point[0]},{point[1]}", "Explicit pin", point
    feature = FEATURE_ID.search(url)
    if feature:
        point = s2_center(int(feature[1], 16))
        return "Maps listing", f"cid:{int(feature[2], 16):x}", "Estimated from link" if point else "Unavailable", point
    return "Other link", f"url:{url}", "Unavailable", None


def distance_km(first, second):
    a_lat, a_lon = map(radians, first)
    b_lat, b_lon = map(radians, second)
    arc = sin((a_lat - b_lat) / 2)**2 + cos(a_lat) * cos(b_lat) * sin((a_lon - b_lon) / 2)**2
    return 12742 * asin(min(1, sqrt(arc)))


def nearest_area(point):
    if point is None:
        return ""
    distance, city = min((distance_km(point, centre), city) for city, centre in CITY_CENTRES.items())
    return city if distance <= CITY_RADIUS_KM else ""


def ring_contains(ring, longitude, latitude):
    inside = False
    x1, y1 = ring[-1]
    for x2, y2 in ring:
        if (y1 > latitude) != (y2 > latitude) and longitude < (x2 - x1) * (latitude - y1) / (y2 - y1) + x1:
            inside = not inside
        x1, y1 = x2, y2
    return inside


def bounds(ring):
    longitudes, latitudes = zip(*ring)
    return min(longitudes), min(latitudes), max(longitudes), max(latitudes)


class Boundaries:
    def __init__(self):
        with gzip.open(BOUNDARIES, "rt", encoding="utf-8") as stream:
            data = json.load(stream)
        self.countries = self.index(data["countries"])
        self.states = self.index(data["india_states"])

    @staticmethod
    def index(features):
        return [(name, code, [(bounds(polygon[0]), polygon) for polygon in polygons if polygon[0]])
                for name, code, polygons in features]

    @staticmethod
    def containing(features, point):
        latitude, longitude = point
        for name, code, polygons in features:
            for (west, south, east, north), (outer, *holes) in polygons:
                if south <= latitude <= north and west <= longitude <= east:
                    if ring_contains(outer, longitude, latitude) and not any(
                        ring_contains(hole, longitude, latitude) for hole in holes
                    ):
                        return name, code
        return "", ""

    @staticmethod
    def nearby(features, point):
        """Return a unique boundary within the tolerance, using local planar distance."""
        latitude, longitude = point
        km_x = max(0.001, 111.195 * cos(radians(latitude)))
        km_y = 111.195
        limit = BOUNDARY_TOLERANCE_KM
        candidates = []
        for name, code, polygons in features:
            for (west, south, east, north), (ring, *_) in polygons:
                if not (west - limit / km_x <= longitude <= east + limit / km_x and
                        south - limit / km_y <= latitude <= north + limit / km_y):
                    continue
                ax, ay = (ring[-1][0] - longitude) * km_x, (ring[-1][1] - latitude) * km_y
                for x, y in ring:
                    bx, by = (x - longitude) * km_x, (y - latitude) * km_y
                    dx, dy = bx - ax, by - ay
                    length_squared = dx * dx + dy * dy
                    t = min(1, max(0, -(dx * ax + dy * ay) / length_squared)) if length_squared else 0
                    if hypot(ax + dx * t, ay + dy * t) <= limit:
                        candidates.append((name, code))
                        break
                    ax, ay = bx, by
                if candidates and candidates[-1] == (name, code):
                    break
        return candidates[0] if len(candidates) == 1 else ("", "")

    def labels(self, point):
        if point is None:
            return "", "", "No usable position"
        country, code = self.containing(self.countries, point)
        method = "Inside boundary"
        if not country:
            country, code = self.nearby(self.countries, point)
            method = "Near boundary" if country else "Country unassigned"
        state = self.containing(self.states, point)[0] if code == "IND" else ""
        if code == "IND" and not state:
            state = self.nearby(self.states, point)[0]
            method = "Near boundary" if state else "State unassigned"
        return country, state, method

    def southern_outlines(self):
        """Only return outlines that intersect the illustrated map bounds."""
        west, south, east, north = MAP_BOUNDS
        for name, _, polygons in self.states:
            for (xmin, ymin, xmax, ymax), (outer, *_) in polygons:
                if xmin <= east and xmax >= west and ymin <= north and ymax >= south:
                    yield name, outer
