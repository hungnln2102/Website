#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker-compose)
  else
    echo "docker compose not found."
    exit 1
  fi
else
  echo "docker not found."
  exit 1
fi

if [ -d ".git" ]; then
  echo "Updating repository..."
  git fetch --all --prune
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if git show-ref --verify --quiet "refs/remotes/origin/${CURRENT_BRANCH}"; then
    git pull --ff-only
  else
    echo "No upstream for ${CURRENT_BRANCH}, skipping git pull."
  fi
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

COMPOSE_ARGS=(-f "$COMPOSE_FILE")
if [ -f "$ENV_FILE" ]; then
  COMPOSE_ARGS+=(--env-file "$ENV_FILE")
fi

echo "Deploying with ${COMPOSE_FILE}..."
"${DOCKER_COMPOSE[@]}" "${COMPOSE_ARGS[@]}" up -d --build --remove-orphans
"${DOCKER_COMPOSE[@]}" "${COMPOSE_ARGS[@]}" ps
