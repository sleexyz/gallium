#!/bin/sh

yarn build-publish && aws s3 sync --delete ./dist s3://gallium.club
