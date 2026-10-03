import io
import json
import threading

import imagehash
import open_clip
import torch
import torch.nn.functional as F
from PIL import Image, ImageOps

from . import settings as S

GENERIC = "_generic"
JUNK = "_junk"


class ClipService:
    """Zero-shot CLIP check: photo and description must both match the chosen category.

    Categories without image_prompts / text_phrases accept anything that is not junk.
    """

    def __init__(self):
        if S.TORCH_THREADS > 0:
            torch.set_num_threads(S.TORCH_THREADS)
        cfg = json.loads(S.PHRASES_PATH.read_text(encoding="utf-8"))
        self.categories = cfg["categories"]

        self.model, _, self.preprocess = open_clip.create_model_and_transforms(S.MODEL_NAME, pretrained=S.PRETRAINED)
        self.model.eval()
        self.tokenizer = open_clip.get_tokenizer(S.MODEL_NAME)
        self.scale = self.model.logit_scale.exp().item()
        self._lock = threading.Lock()  # one inference at a time; torch already uses all cores

        image_groups = [(k, c["image_prompts"]) for k, c in self.categories.items()]
        image_groups += [(GENERIC, cfg["generic_image_prompts"]), (JUNK, cfg["junk_image_prompts"])]
        self.image_labels = [k for k, prompts in image_groups for _ in prompts]
        self.image_feats = self._text([p for _, prompts in image_groups for p in prompts])

        text_groups = [(k, c["text_phrases"]) for k, c in self.categories.items() if c["text_phrases"]]
        text_groups.append((JUNK, cfg["junk_text_phrases"]))
        self.text_labels = [k for k, _ in text_groups]
        self.text_feats = [self._text(phrases) for _, phrases in text_groups]

    @torch.inference_mode()
    def _text(self, texts):
        return F.normalize(self.model.encode_text(self.tokenizer(texts)), dim=-1)

    @torch.inference_mode()
    def _image(self, img):
        return F.normalize(self.model.encode_image(self.preprocess(img).unsqueeze(0)), dim=-1)

    @staticmethod
    def _group_probs(logits, labels, exclude=None):
        """Softmax over prompts not labelled `exclude`, summed per label."""
        idx = [i for i, label in enumerate(labels) if label != exclude]
        groups = {}
        for i, p in zip(idx, logits[idx].softmax(dim=-1).tolist()):
            groups[labels[i]] = groups.get(labels[i], 0.0) + p
        return groups

    def validate(self, image_bytes: bytes, text: str, category: str) -> dict:
        img = Image.open(io.BytesIO(image_bytes))
        img.draft("RGB", (448, 448))  # faster JPEG decode; CLIP only needs 224px
        img = ImageOps.exif_transpose(img).convert("RGB")  # phone photos carry rotation in EXIF
        with self._lock:
            return self._score(img, text, category)

    @torch.inference_mode()
    def _score(self, img, text: str, category: str) -> dict:
        # Image: the chosen category must win among category + junk prompts (open categories: not junk).
        logits = self.scale * (self._image(img) @ self.image_feats.T)[0]
        if self.categories[category]["image_prompts"]:
            groups = self._group_probs(logits, self.image_labels, exclude=GENERIC)
            image_score = groups[category]
            image_match = max(groups, key=groups.get) == category
        else:
            image_score = 1 - self._group_probs(logits, self.image_labels).get(JUNK, 0.0)
            image_match = image_score >= 0.5

        # Text: best-matching phrase per bank, softmax across banks.
        t = self._text([text])
        probs = (self.scale * torch.stack([(t @ f.T).max() for f in self.text_feats])).softmax(dim=-1).tolist()
        predicted = self.text_labels[max(range(len(probs)), key=probs.__getitem__)]
        if category in self.text_labels:
            text_score = probs[self.text_labels.index(category)]
            text_match = predicted == category
        else:
            text_score = 1 - probs[self.text_labels.index(JUNK)]
            text_match = predicted != JUNK

        fusion = (S.W_IMAGE * image_score + S.W_TEXT * text_score) / (S.W_IMAGE + S.W_TEXT)
        return {
            "image_score": round(image_score, 4),
            "text_score": round(text_score, 4),
            "fusion_score": round(fusion, 4),
            "predicted_category": None if predicted == JUNK else predicted,
            "image_match": bool(image_match),
            "text_match": bool(text_match),
            "valid": bool(fusion >= S.THRESHOLD and image_match and text_match),
            "phash": str(imagehash.phash(img)),
        }
