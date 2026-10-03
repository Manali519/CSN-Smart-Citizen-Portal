FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/user/.cache/huggingface \
    OMP_NUM_THREADS=2 \
    TORCH_THREADS=2

# Run as an unprivileged user
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

# CPU-only torch keeps the image ~1 GB instead of several GB of CUDA libraries
COPY requirements.txt .
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision \
 && pip install -r requirements.txt

USER user
COPY --chown=user app ./app
COPY --chown=user config ./config

# Bake the CLIP weights into the image so cold starts never download them
RUN python -c "from app import settings as S; import open_clip; open_clip.create_model_and_transforms(S.MODEL_NAME, pretrained=S.PRETRAINED)"

# Cloud Run sets PORT (8080). exec makes uvicorn PID 1 so it receives SIGTERM.
ENV PORT=8080
EXPOSE 8080
CMD exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1
