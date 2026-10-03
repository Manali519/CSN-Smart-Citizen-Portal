import hmac
import logging
import warnings
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from PIL import Image

from . import settings as S
from .clip_service import ClipService

# Reject decompression bombs (tiny files that decode to huge images).
Image.MAX_IMAGE_PIXELS = 40_000_000
warnings.simplefilter("error", Image.DecompressionBombWarning)
log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not S.API_KEY:
        if S.REQUIRE_API_KEY:
            raise RuntimeError("ML_API_KEY must be set when REQUIRE_API_KEY=true")
        log.warning("ML_API_KEY is not set: requests are accepted without a key.")
    app.state.clip = ClipService()
    log.info("CLIP model %s ready", S.MODEL_NAME)
    yield


app = FastAPI(title="Complaint CLIP Service", lifespan=lifespan, docs_url=None, redoc_url=None)


def verify_key(x_api_key: str = Header(default="")):
    if S.API_KEY and not hmac.compare_digest(x_api_key.encode(), S.API_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/")
@app.get("/health")
def health(request: Request):
    return {"status": "ok", "categories": list(request.app.state.clip.categories)}


@app.post("/validate-complaint", dependencies=[Depends(verify_key)])
def validate_complaint(
    request: Request,
    image: UploadFile = File(...),
    text: str = Form(..., min_length=1, max_length=2000),
    category: str = Form(...),
):
    clip: ClipService = request.app.state.clip
    if category not in clip.categories:
        # Config mismatch with the backend; 422 makes it fall back to admin review.
        raise HTTPException(status_code=422, detail="Unknown category")
    data = image.file.read(S.MAX_IMAGE_BYTES + 1)
    if len(data) > S.MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")
    try:
        return clip.validate(data, text.strip(), category)
    except (OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=400, detail="Invalid image file")
