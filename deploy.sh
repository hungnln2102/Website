#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "  Deployment Script for Website Project"
echo "========================================="
echo ""

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker is not installed!"
    exit 1
fi

# Check Docker Compose
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Docker Compose is not installed!"
    exit 1
fi

echo "Checking Git repository..."
if [ -d ".git" ]; then
    # Step 1: Handle local changes to avoid conflicts
    echo "Stashing local changes to avoid pull conflicts..."
    git stash push -m "deploy-auto-stash" || true
    
    # Step 2: Pull latest code
    echo "Pulling latest code from Git..."
    git fetch --all --prune
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $CURRENT_BRANCH"
    
    if git show-ref --verify --quiet "refs/remotes/origin/${CURRENT_BRANCH}"; then
        git pull origin "$CURRENT_BRANCH"
        echo "Successfully pulled latest code."
    else
        echo "No remote branch found, using local code."
    fi
    
    # Step 3: Pop stashed changes (optional, but keep it clean)
    # git stash pop || true
else
    echo "Not a Git repository, using current files."
fi
echo ""

# Step 4: Check configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=""

# Function to check if a file has an ACTIVE (uncommented) DATABASE_URL
is_valid_env() {
    [ -f "$1" ] && grep -vq '^#' "$1" | grep -q "DATABASE_URL="
}

echo "Searching for valid .env file..."

if is_valid_env ".env"; then
    ENV_FILE=".env"
elif is_valid_env "my-store/apps/server/.env"; then
    ENV_FILE="my-store/apps/server/.env"
elif is_valid_env "my-store/.env"; then
    ENV_FILE="my-store/.env"
fi

if [ -z "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        echo "❌ Found .env at root, but it is missing an active DATABASE_URL."
    fi
    echo "❌ Error: Could not find a valid .env file with DATABASE_URL."
    echo "Searched in:"
    echo "  - ./.env"
    echo "  - ./my-store/apps/server/.env"
    echo "  - ./my-store/.env"
    echo ""
    echo "Please ensure DATABASE_URL=postgresql://... is present and NOT commented out."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: Docker compose file not found: $COMPOSE_FILE"
    exit 1
fi

echo "✅ Using env file: $ENV_FILE"
echo ""

# Step 5: Stop and Restart
echo "Stopping old containers..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" down 2>/dev/null || true
echo ""

# Step 5: Build and start application containers
echo "🚀 Building and starting application containers..."
echo "   (This may take a few minutes...)"
echo ""

if [ -f "$ENV_FILE" ]; then
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans
else
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --build --remove-orphans
fi

echo ""
echo "✅ Deployment Finished Successfully!"
echo "========================================="
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps
echo "========================================="
echo ""
echo "Tips:"
echo "- To view logs: docker compose logs -f"
echo "- To restart:   docker compose restart"
