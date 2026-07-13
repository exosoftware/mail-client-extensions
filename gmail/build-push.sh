#!/bin/sh
####################################
# build-push
# A local image builder and pusher
####################################
set -e

# Run from the script's own directory so the build context (and the
# Dockerfile) resolve no matter where the script is called from.
cd "$(dirname "$0")"

REPO="ghcr.io/exosoftware/mail-client-extensions"
TAG="${1:-latest}"

IMAGE_NAME="$REPO:$TAG"

echo "Building $IMAGE_NAME"
docker build --tag "$IMAGE_NAME" .

echo "Pushing $IMAGE_NAME"
docker image push "$IMAGE_NAME"
