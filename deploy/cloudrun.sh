#!/usr/bin/env bash
# Deploys ml-service and backend to Google Cloud Run and points the Vercel frontend's /api rewrite at the
# backend. Builds run on Cloud Build from the Dockerfiles, so Docker is not needed locally.
#
# Usage (Git Bash on Windows, or any bash with the gcloud CLI logged in):
#   deploy/cloudrun.sh setup     one-time: enable APIs, create the photo bucket, grant permissions
#   deploy/cloudrun.sh ml        deploy ml-service
#   deploy/cloudrun.sh backend   deploy backend (needs ml-service deployed) and update frontend/vercel.json
#   deploy/cloudrun.sh all       all of the above, in order (default)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" # relative paths below keep gcloud happy with Windows path conversion

CONFIG=deploy/cloudrun.env
ML_SERVICE=smart-city-ml
API_SERVICE=smart-city-api
ENV_FILE=deploy/.env-vars.yaml # generated per deploy, git-ignored, removed on exit

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }
trap 'rm -f "$ENV_FILE"' EXIT

[[ -f "$CONFIG" ]] || die "$CONFIG not found. Copy deploy/cloudrun.env.example to it and fill it in."
set -a
# shellcheck source=/dev/null
source "$CONFIG"
set +a

command -v gcloud >/dev/null || die "gcloud CLI not found. Install it: https://cloud.google.com/sdk/docs/install"
[[ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)')" ]] || die "Run: gcloud auth login"

require() {
  local name
  for name in "$@"; do [[ -n "${!name:-}" ]] || die "$name is empty in $CONFIG"; done
}

require GCP_PROJECT GCP_REGION
GCS_BUCKET="${GCS_BUCKET:-$GCP_PROJECT-complaint-photos}"

gc() { gcloud --project "$GCP_PROJECT" --quiet "$@"; }
service_url() { gc run services describe "$1" --region "$GCP_REGION" --format='value(status.url)'; }

# Writes the named, non-empty variables as single-quoted YAML for --env-vars-file (safe for any characters).
# Empty ones are left out so the app's defaults apply.
write_env_file() {
  local name value
  : >"$ENV_FILE"
  for name in "$@"; do
    value="${!name:-}"
    [[ -n "$value" ]] || continue
    printf "%s: '%s'\n" "$name" "${value//\'/\'\'}" >>"$ENV_FILE"
  done
}

setup() {
  log "Enabling Cloud Run, Cloud Build, Artifact Registry and Cloud Storage APIs"
  gc services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com

  local number runtime_sa
  number="$(gc projects describe "$GCP_PROJECT" --format='value(projectNumber)')"
  runtime_sa="serviceAccount:$number-compute@developer.gserviceaccount.com"

  log "Allowing the default compute service account to build from source"
  gc projects add-iam-policy-binding "$GCP_PROJECT" --member="$runtime_sa" --role=roles/run.builder --condition=None >/dev/null

  log "Photo bucket gs://$GCS_BUCKET"
  if ! gc storage buckets describe "gs://$GCS_BUCKET" >/dev/null 2>&1; then
    gc storage buckets create "gs://$GCS_BUCKET" --location="$GCP_REGION" --uniform-bucket-level-access
  fi
  # Photos are shown in the portal by URL (random UUID names); the services write and delete them.
  gc storage buckets add-iam-policy-binding "gs://$GCS_BUCKET" --member=allUsers --role=roles/storage.objectViewer >/dev/null
  gc storage buckets add-iam-policy-binding "gs://$GCS_BUCKET" --member="$runtime_sa" --role=roles/storage.objectAdmin >/dev/null
}

deploy_ml() {
  require ML_API_KEY
  log "Deploying $ML_SERVICE (first build takes ~10 minutes: CPU torch + baked CLIP weights)"
  REQUIRE_API_KEY=true
  write_env_file REQUIRE_API_KEY ML_API_KEY
  # One inference at a time per instance (the model holds a lock), so keep concurrency low.
  CLOUDSDK_BUILDS_TIMEOUT=1800 gc run deploy "$ML_SERVICE" \
    --source=ml-service \
    --region="$GCP_REGION" \
    --allow-unauthenticated \
    --memory=2Gi --cpu=2 --cpu-boost \
    --concurrency=4 --timeout=60 \
    --min-instances=0 --max-instances=2 \
    --env-vars-file="$ENV_FILE"
  log "ml-service: $(service_url "$ML_SERVICE")/health"
}

deploy_backend() {
  require FRONTEND_URL ML_API_KEY MONGODB_URI JWT_SECRET GOOGLE_CLIENT_ID SMTP_HOST SMTP_USER SMTP_PASS
  ((${#JWT_SECRET} >= 32)) || die "JWT_SECRET must be at least 32 characters"

  ML_SERVICE_URL="$(service_url "$ML_SERVICE" 2>/dev/null)" || die "Deploy ml-service first: deploy/cloudrun.sh ml"

  NODE_ENV=production
  CLIENT_ORIGINS="$FRONTEND_URL"
  COOKIE_SAMESITE=lax # browsers reach the API through the Vercel /api rewrite, i.e. first-party
  TRUST_PROXY=2       # Vercel's proxy + Google's front end
  ML_TIMEOUT_MS="${ML_TIMEOUT_MS:-30000}" # room for an ml-service cold start
  write_env_file NODE_ENV CLIENT_ORIGINS COOKIE_SAMESITE TRUST_PROXY GCS_BUCKET \
    MONGODB_URI JWT_SECRET GOOGLE_CLIENT_ID \
    SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS \
    ML_SERVICE_URL ML_API_KEY ML_TIMEOUT_MS \
    RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET

  log "Deploying $API_SERVICE"
  gc run deploy "$API_SERVICE" \
    --source=backend \
    --region="$GCP_REGION" \
    --allow-unauthenticated \
    --memory=512Mi --cpu=1 \
    --concurrency=80 --timeout=60 \
    --min-instances=0 --max-instances=3 \
    --env-vars-file="$ENV_FILE"

  local api_url
  api_url="$(service_url "$API_SERVICE")"
  sed -i -E "s#\"destination\": \"https://[^\"]+/api/:path\*\"#\"destination\": \"$api_url/api/:path*\"#" frontend/vercel.json
  grep -q "$api_url/api/" frontend/vercel.json || die "Could not update frontend/vercel.json; set the /api destination to $api_url by hand"

  log "backend: $api_url/api/health"
  echo "frontend/vercel.json now proxies /api to $api_url. Commit and push it so Vercel redeploys."
}

case "${1:-all}" in
  setup) setup ;;
  ml) deploy_ml ;;
  backend) deploy_backend ;;
  all) setup && deploy_ml && deploy_backend ;;
  *) die "unknown command '$1' (use setup, ml, backend or all)" ;;
esac
