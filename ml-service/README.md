# Complaint CLIP Service

FastAPI service that checks a complaint photo and description against the chosen category with OpenAI CLIP (ViT-B/32) and returns scores plus a perceptual hash for duplicate detection. Deployed to Google Cloud Run by `deploy/cloudrun.sh ml`.

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Model status and category keys |
| POST | `/validate-complaint` | Multipart `image`, `text`, `category`; header `X-API-Key` |

## Configuration (environment variables)

| Name | Default | Purpose |
|---|---|---|
| `ML_API_KEY` | — | Shared secret; the backend sends it as `X-API-Key` |
| `REQUIRE_API_KEY` | `false` | Set `true` in production so the service refuses to start without a key |
| `FUSION_THRESHOLD` | `0.6` | Minimum combined score for a complaint to be routed automatically |
| `W_IMAGE` / `W_TEXT` | `0.5` | Weights of the photo and description scores |
| `MAX_IMAGE_MB` | `8` | Upload size limit |
| `PORT` | `8080` (container) | Listening port, set by Cloud Run |

Category keys in `config/phrases.json` must match `backend/src/config/complaintCategories.js`.

## Local development

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows; use .venv/bin/activate elsewhere
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
