"""OCR sidecar: image in, text boxes out. Knows nothing about cards (the app matches names)."""

import io

import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from rapidocr_onnxruntime import RapidOCR

app = FastAPI()
engine = RapidOCR()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(image: UploadFile):
    try:
        img = Image.open(io.BytesIO(await image.read())).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(400, "Not a readable image")

    result, _ = engine(np.array(img))
    return {
        "boxes": [
            {"text": text, "confidence": float(score), "bbox": [[float(x), float(y)] for x, y in bbox]}
            for bbox, text, score in result or []
        ]
    }
