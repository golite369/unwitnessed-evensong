from pathlib import Path
import sys

from PIL import Image


def clean_alpha(source: Path, destination: Path, cutoff: int = 4, padding: int = 8) -> None:
    image = Image.open(source).convert("RGBA")
    red, green, blue, alpha = image.split()
    alpha = alpha.point(lambda value: 0 if value < cutoff else value)
    image = Image.merge("RGBA", (red, green, blue, alpha))

    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("The source image has no visible pixels after alpha cleanup.")

    left, top, right, bottom = bounds
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    image.crop((left, top, right, bottom)).save(destination)

    cleaned = Image.open(destination).convert("RGBA")
    alpha_extrema = cleaned.getchannel("A").getextrema()
    print(f"saved={destination}")
    print(f"size={cleaned.size} alpha={alpha_extrema} corners={[cleaned.getpixel(p)[3] for p in [(0, 0), (cleaned.width - 1, 0), (0, cleaned.height - 1), (cleaned.width - 1, cleaned.height - 1)]]}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: clean_ui_alpha.py SOURCE DESTINATION")
    clean_alpha(Path(sys.argv[1]), Path(sys.argv[2]))
