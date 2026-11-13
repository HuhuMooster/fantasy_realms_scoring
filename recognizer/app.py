"""OCR sidecar: image in, text boxes out. Knows nothing about cards (the app matches names)."""

import io

import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from rapidocr import LangRec, ModelType, OCRVersion, RapidOCR


class OcrBox(BaseModel):
    text: str
    confidence: float = Field(ge=0, le=1)


class OcrResponse(BaseModel):
    boxes: list[OcrBox]


app = FastAPI()
# PP-OCRv5 at full resolution read every card in recognizer/fixtures; v4, the larger "server"
# det model and the default 2000px downscale each missed titles. Re-run the fixtures if you change it.
engine = RapidOCR(
    params={
        "Global.log_level": "error",
        "Global.max_side_len": 4096,
        "Det.ocr_version": OCRVersion.PPOCRV5,
        "Det.model_type": ModelType.MOBILE,
        "Rec.ocr_version": OCRVersion.PPOCRV5,
        "Rec.lang_type": LangRec.EN,
        "Rec.model_type": ModelType.MOBILE,
    }
)


def read_boxes(img: Image.Image) -> list[OcrBox]:
    r = engine(np.array(img.convert("RGB")))
    return [
        OcrBox(text=t, confidence=float(s))
        for t, s in zip(r.txts or (), r.scores or ())
    ]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(image: UploadFile) -> OcrResponse:
    try:
        img = Image.open(io.BytesIO(await image.read()))
    except UnidentifiedImageError:
        raise HTTPException(400, "Not a readable image")
    return OcrResponse(boxes=read_boxes(img))
