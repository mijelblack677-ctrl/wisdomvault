#!/usr/bin/env bash
set -a
. /home/miracle/app/.env
set +a
NODE_ENV=production exec node dist/server/entry.mjs
