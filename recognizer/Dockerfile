FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.8.17 /uv /bin/uv
# opencv (pulled in by rapidocr) needs these shared libs
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY app.py .
# rapidocr downloads its models on first use (the rec model only once it sees text): fetch them at build time
RUN uv run --no-sync python -c "from PIL import Image, ImageDraw; from app import read_boxes; i = Image.new('RGB', (400, 100), 'white'); ImageDraw.Draw(i).text((20, 20), 'WARMUP', fill='black', font_size=48); assert read_boxes(i)"
EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
