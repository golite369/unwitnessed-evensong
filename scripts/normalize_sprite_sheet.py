from pathlib import Path
from typing import Tuple
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "demo"
SHEETS = {
    "irena": "sheet_irena_run6_raw.png",
    "sophie": "sheet_sophie_run6_raw.png",
    "evan": "sheet_evan_run6_raw.png",
}

SOURCE_COLS = 3
SOURCE_ROWS = 2
CELL_SIZE = 384
MAX_CONTENT_WIDTH = 348
MAX_CONTENT_HEIGHT = 336
BASELINE = 360
ALPHA_THRESHOLD = 12


def alpha_bbox(frame: Image.Image) -> Tuple[int, int, int, int]:
    alpha = frame.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Frame has no visible pixels")
    return bbox


def normalize_sheet(source_path: Path, target_path: Path) -> None:
    source = Image.open(source_path).convert("RGBA")
    source_cell_w = source.width // SOURCE_COLS
    source_cell_h = source.height // SOURCE_ROWS
    frames = []

    for index in range(SOURCE_COLS * SOURCE_ROWS):
        col = index % SOURCE_COLS
        row = index // SOURCE_COLS
        frame = source.crop((
            col * source_cell_w,
            row * source_cell_h,
            (col + 1) * source_cell_w,
            (row + 1) * source_cell_h,
        ))
        bbox = alpha_bbox(frame)
        frames.append((frame.crop(bbox), bbox[2] - bbox[0], bbox[3] - bbox[1]))

    widest = max(width for _, width, _ in frames)
    tallest = max(height for _, _, height in frames)
    scale = min(MAX_CONTENT_WIDTH / widest, MAX_CONTENT_HEIGHT / tallest)
    output = Image.new("RGBA", (CELL_SIZE * SOURCE_COLS, CELL_SIZE * SOURCE_ROWS), (0, 0, 0, 0))

    for index, (content, width, height) in enumerate(frames):
        resized_w = max(1, round(width * scale))
        resized_h = max(1, round(height * scale))
        resized = content.resize((resized_w, resized_h), Image.LANCZOS)
        col = index % SOURCE_COLS
        row = index // SOURCE_COLS
        x = col * CELL_SIZE + (CELL_SIZE - resized_w) // 2
        y = row * CELL_SIZE + BASELINE - resized_h
        output.alpha_composite(resized, (x, y))

    output.save(target_path, optimize=True)


for character, filename in SHEETS.items():
    normalize_sheet(ASSET_DIR / filename, ASSET_DIR / f"sheet_{character}_run6.png")
    print(f"normalized {character}")
