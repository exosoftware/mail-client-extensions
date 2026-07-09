#!/bin/sh
####################################
# build-push
# A local image builder and pusher
####################################

REPO="ghcr.io/exosoftware/gmail-addon"
TAG="${1:-latest}"

IMAGE_NAME="$REPO:$TAG"

echo "Building $IMAGE_NAME"
docker build --tag "$IMAGE_NAME" .

echo "Pushing $IMAGE_NAME"
docker image push "$IMAGE_NAME"
