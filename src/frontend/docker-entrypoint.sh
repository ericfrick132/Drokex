#!/usr/bin/env sh
set -eu

# Determine listen port for Nginx (DigitalOcean sets PORT)
export NGINX_PORT="${NGINX_PORT:-${PORT:-3000}}"

# Default API upstream for local docker network; override in production
export API_UPSTREAM="${API_UPSTREAM:-http://drokex-api:5000}"

echo "[entrypoint] Using NGINX_PORT=$NGINX_PORT"
echo "[entrypoint] Using API_UPSTREAM=$API_UPSTREAM"

# Render nginx config from template
envsubst '${NGINX_PORT} ${API_UPSTREAM}' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'

