import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Local .env for development; real environment variables (e.g. Space secrets) take precedence.
_env = ROOT / ".env"
if _env.is_file():
    for line in _env.read_text(encoding="utf-8").splitlines():
        key, sep, value = line.strip().partition("=")
        if sep and key and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))

# "-quickgelu" matches the activation the OpenAI weights were trained with.
MODEL_NAME = os.getenv("CLIP_MODEL", "ViT-B-32-quickgelu")
PRETRAINED = os.getenv("CLIP_PRETRAINED", "openai")
PHRASES_PATH = Path(os.getenv("PHRASES_PATH", ROOT / "config" / "phrases.json"))
API_KEY = os.getenv("ML_API_KEY", "")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
W_IMAGE = float(os.getenv("W_IMAGE", "0.5"))
W_TEXT = float(os.getenv("W_TEXT", "0.5"))
THRESHOLD = float(os.getenv("FUSION_THRESHOLD", "0.6"))
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_MB", "8")) * 1024 * 1024
TORCH_THREADS = int(os.getenv("TORCH_THREADS", "0"))  # 0 = torch default
