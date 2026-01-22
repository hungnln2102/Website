#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
ENV_FILE="${ENV_FILE:-.env}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
USE_LOCAL_BUILD="${USE_LOCAL_BUILD:-0}"
SKIP_CADDY="${SKIP_CADDY:-0}"
POSTGRES_PORT="${POSTGRES_PORT:-}"

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

can_resolve_host() {
  local host="$1"
  if command -v getent >/dev/null 2>&1; then
    getent hosts "$host" >/dev/null 2>&1
    return $?
  fi
  if command -v nslookup >/dev/null 2>&1; then
    nslookup "$host" >/dev/null 2>&1
    return $?
  fi
  if command -v ping >/dev/null 2>&1; then
    ping -c1 -W1 "$host" >/dev/null 2>&1
    return $?
  fi
  return 0
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -q ":${port}$"
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return $?
  fi
  return 1
}

if [ "$USE_LOCAL_BUILD" != "1" ] && ! can_resolve_host "github.com"; then
  echo "github.com not reachable, switching to local build context."
  USE_LOCAL_BUILD=1
  SKIP_GIT_PULL=1
fi

if [ "$SKIP_GIT_PULL" != "1" ] && [ -d ".git" ]; then
  echo "Updating repository..."
  if ! git fetch --all --prune; then
    echo "git fetch failed, skipping git pull and using local build context."
    USE_LOCAL_BUILD=1
    SKIP_GIT_PULL=1
  fi
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if git show-ref --verify --quiet "refs/remotes/origin/${CURRENT_BRANCH}"; then
    if ! git pull --ff-only; then
      echo "git pull failed, using local build context."
      USE_LOCAL_BUILD=1
    fi
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

if [ "$SKIP_CADDY" != "1" ] && port_in_use 443; then
  echo "Port 443 is already in use. Skipping Caddy service."
  SKIP_CADDY=1
fi

if [ -z "$POSTGRES_PORT" ] && port_in_use 5432; then
  POSTGRES_PORT=5433
  export POSTGRES_PORT
  echo "Port 5432 is in use. Using POSTGRES_PORT=5433."
fi

if [ "$USE_LOCAL_BUILD" = "1" ]; then
  export BUILD_CONTEXT="my-store"
  export SERVER_DOCKERFILE="apps/server/Dockerfile"
  export WEB_DOCKERFILE="apps/web/Dockerfile"
fi

echo "Deploying with ${COMPOSE_FILE}..."
SERVICES=()
if [ "$SKIP_CADDY" = "1" ]; then
  SERVICES=(postgres api web)
fi
"${DOCKER_COMPOSE[@]}" "${COMPOSE_ARGS[@]}" up -d --build --remove-orphans "${SERVICES[@]}"
"${DOCKER_COMPOSE[@]}" "${COMPOSE_ARGS[@]}" ps
