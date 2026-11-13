import io

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app import app

client = TestClient(app)


def png_with_text(text: str) -> bytes:
    img = Image.new("RGB", (600, 160), "white")
    ImageDraw.Draw(img).text((40, 40), text, fill="black", font=ImageFont.load_default(64))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_ocr_returns_text_boxes():
    res = client.post("/ocr", files={"image": ("card.png", png_with_text("Unicorn"), "image/png")})

    assert res.status_code == 200
    boxes = res.json()["boxes"]
    assert [b["text"] for b in boxes] == ["Unicorn"]
    assert 0 < boxes[0]["confidence"] <= 1


def test_unreadable_upload_is_rejected():
    res = client.post("/ocr", files={"image": ("x.png", b"not an image", "image/png")})
    assert res.status_code == 400


def test_health():
    assert client.get("/health").json() == {"status": "ok"}
