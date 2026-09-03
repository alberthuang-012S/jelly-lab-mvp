from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "水母圖.jpg"
OUTPUT = ROOT / "assets" / "jellyfish"
NAMES = [
    "jelly-normal.png",
    "jelly-sparkle.png",
    "jelly-detective.png",
    "jelly-angry.png",
    "jelly-cute.png",
    "jelly-playful.png",
    "jelly-shy.png",
    "jelly-fire.png",
]


def outside_background_mask(tile: Image.Image) -> np.ndarray:
    """Return pixels connected to the tile edge that are near-gray background."""
    rgb = np.asarray(tile.convert("RGB"), dtype=np.int16)
    channel_range = rgb.max(axis=2) - rgb.min(axis=2)
    near_gray = channel_range < 16
    height, width = near_gray.shape
    outside = np.zeros_like(near_gray, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if near_gray[0, x]:
            queue.append((0, x))
        if near_gray[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if near_gray[y, 0]:
            queue.append((y, 0))
        if near_gray[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if outside[y, x] or not near_gray[y, x]:
            continue
        outside[y, x] = True
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= next_y < height and 0 <= next_x < width and not outside[next_y, next_x]:
                queue.append((next_y, next_x))

    return outside


def prepare_tile(image: Image.Image, column: int, row: int) -> Image.Image:
    width, height = image.size
    x0 = round(column * width / 4)
    x1 = round((column + 1) * width / 4)
    y0 = round(row * height / 2)
    y1 = round((row + 1) * height / 2)
    tile = image.crop((x0, y0, x1, y1)).convert("RGBA")
    outside = outside_background_mask(tile)
    rgba = np.asarray(tile).copy()
    rgba[outside, 3] = 0
    alpha = rgba[:, :, 3] > 0
    height, width = alpha.shape
    visited = np.zeros_like(alpha, dtype=bool)

    # The source board has a few coloured fragments crossing a tile boundary.
    # Remove only small components that touch an outer edge; eyes and stars in
    # the enclosed artwork are kept.
    for start_y, start_x in zip(*np.where(alpha & ~visited)):
        if visited[start_y, start_x]:
            continue
        stack = [(int(start_y), int(start_x))]
        component = []
        while stack:
            current_y, current_x = stack.pop()
            if not (0 <= current_y < height and 0 <= current_x < width):
                continue
            if visited[current_y, current_x] or not alpha[current_y, current_x]:
                continue
            visited[current_y, current_x] = True
            component.append((current_y, current_x))
            for next_y in range(current_y - 1, current_y + 2):
                for next_x in range(current_x - 1, current_x + 2):
                    if 0 <= next_y < height and 0 <= next_x < width and not visited[next_y, next_x]:
                        stack.append((next_y, next_x))

        if len(component) < 1500:
            touches_edge = any(y <= 3 or x <= 3 or y >= height - 4 or x >= width - 4 for y, x in component)
            if touches_edge:
                for component_y, component_x in component:
                    rgba[component_y, component_x, 3] = 0
    cleaned = Image.fromarray(rgba, mode="RGBA")

    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No visible artwork found in tile {column}, {row}")

    left, top, right, bottom = bbox
    padding = 18
    cropped = cleaned.crop((max(0, left - padding), max(0, top - padding), min(cleaned.width, right + padding), min(cleaned.height, bottom + padding)))
    cropped.thumbnail((420, 420), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
    paste_x = (canvas.width - cropped.width) // 2
    paste_y = (canvas.height - cropped.height) // 2
    canvas.alpha_composite(cropped, (paste_x, paste_y))
    return canvas


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE)
    for index, name in enumerate(NAMES):
        row, column = divmod(index, 4)
        prepare_tile(source, column, row).save(OUTPUT / name, optimize=True)
    print(f"Generated {len(NAMES)} transparent jellyfish assets in {OUTPUT}")


if __name__ == "__main__":
    main()
