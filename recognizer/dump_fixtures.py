"""Re-run after changing photos or OCR settings: OCRs fixtures/*.jpg into fixtures/*.json for the app's matching test."""

import json
from pathlib import Path

from PIL import Image

from app import read_boxes

for path in sorted(Path("fixtures").glob("*.jpg")):
    boxes = [{"text": b.text, "confidence": round(b.confidence, 3)} for b in read_boxes(Image.open(path))]
    path.with_suffix(".json").write_text(json.dumps(boxes, indent=1))
    print(path.name, len(boxes), "boxes")
