#!/usr/bin/env bash
# Release products.aiknol.com to the shared Hetzner box.
#
#   ./deploy.sh
#
# Run from a workstation, in the repository root. There is nothing to build
# on the server and nothing for it to run beyond a Caddy container serving
# static files — so unlike the other products on this box, a release is
# just "copy the files, (re)start the container, wire up the edge".
#
# The site itself is generated (node build/generate.js) rather than
# hand-written, and this script does not regenerate it — that is a separate,
# reviewable step. Run it first if build/products.js changed and commit the
# result before deploying.
set -euo pipefail

HOST="root@89.167.8.178"
KEY="/Users/dev/projects/Products/GoSumo/keys/hetzner_deploy_ed25519"
REMOTE_ROOT="/opt/products-site"

# One connection, reused for every ssh/rsync call below — a bare ssh per
# health-check poll would otherwise pay a full handshake each time.
CTL="/tmp/products-site-deploy-$$.sock"
SSH_OPTS=(-i "$KEY" -o BatchMode=yes -o ControlMaster=auto -o ControlPath="$CTL" -o ControlPersist=60s)
ssh_() { ssh "${SSH_OPTS[@]}" "$HOST" "$@"; }
cleanup() { ssh "${SSH_OPTS[@]}" -O exit "$HOST" 2>/dev/null || true; }
trap cleanup EXIT

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33mwarning: %s\033[0m\n' "$*" >&2; }
die() { printf '\033[31merror: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$(dirname "${BASH_SOURCE[0]}")"

[ -f index.html ] && [ -f deploy/docker-compose.yml ] && [ -f deploy/Caddyfile ] \
    || die "run this from the products-site repository root"
command -v rsync >/dev/null || die "rsync is not installed"
[ -r "$KEY" ] || die "deploy key not found or unreadable: $KEY"

log "Checking connectivity"
ssh_ -o ConnectTimeout=8 true || die "cannot reach $HOST as root with $KEY"

log "Staging static files"
ssh_ "mkdir -p $REMOTE_ROOT/public"

# Everything Caddy needs to serve, and nothing else — no build/, no deploy/,
# no README. --delete keeps a removed product page from lingering on disk
# after its .html file is gone from the repo.
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" \
    --include='*.html' --include='main.js' --include='styles.css' \
    --include='robots.txt' --include='sitemap.xml' --exclude='*' \
    ./ "$HOST:$REMOTE_ROOT/public/"

rsync -az -e "ssh ${SSH_OPTS[*]}" \
    deploy/docker-compose.yml deploy/Caddyfile deploy/caddy-site-block.conf \
    "$HOST:$REMOTE_ROOT/"

log "Starting the container"
ssh_ "cd $REMOTE_ROOT && docker compose up -d --remove-orphans"

log "Checking container health"
attempt=0
until [ "$(ssh_ "docker inspect -f '{{.State.Health.Status}}' products-site 2>/dev/null" || true)" = "healthy" ]; do
    attempt=$((attempt + 1))
    [ "$attempt" -le 30 ] || die "products-site did not become healthy within 30s; docker logs products-site --tail 100"
    sleep 1
done
echo "container healthy after ${attempt}s"

log "Wiring up the edge"
# Idempotent: strip any previously appended block for this host between the
# markers, squeeze the blank line it leaves behind, then append the current
# block with a single separating blank line. Safe to run on every release,
# and safe to run before Caddy has ever heard of this host.
ssh_ bash -s <<'REMOTE'
set -euo pipefail
CF=/opt/knol/Caddyfile
BLOCK=/opt/products-site/caddy-site-block.conf
BACKUP="$CF.bak-pre-products-site-$(date +%s)"
cp "$CF" "$BACKUP"

awk '
  /^# >>> products\.aiknol\.com >>>$/ { skip=1 }
  !skip { print }
  /^# <<< products\.aiknol\.com <<<$/ { skip=0 }
' "$CF" | cat -s > "$CF.tmp"
{ cat "$CF.tmp"; echo; cat "$BLOCK"; } > "$CF.new"
rm -f "$CF.tmp"
mv "$CF.new" "$CF"

if ! docker exec knol-caddy caddy validate --config /etc/caddy/Caddyfile; then
    echo "caddy validate failed — restoring the previous Caddyfile" >&2
    cp "$BACKUP" "$CF"
    exit 1
fi
docker exec knol-caddy caddy reload --config /etc/caddy/Caddyfile
REMOTE

log "Checking the origin directly"
# The public hostname needs DNS pointed at this box before Caddy can obtain a
# certificate for it — see README/DNS notes. That is outside this script, so
# the origin check below is what actually proves the release worked; the
# public one is best-effort and only warns.
if ssh_ "curl -fsS --max-time 5 http://127.0.0.1 -H 'Host: products.aiknol.com' -o /dev/null"; then
    echo "origin is serving products.aiknol.com through knol-caddy"
else
    warn "knol-caddy did not serve products.aiknol.com locally — check: docker logs knol-caddy --tail 100"
fi

if curl -fsS --max-time 8 https://products.aiknol.com/robots.txt -o /dev/null 2>/dev/null; then
    echo "https://products.aiknol.com/ is publicly reachable"
else
    warn "https://products.aiknol.com/ is not reachable from here — likely DNS not yet pointed at 89.167.8.178"
fi

log "Deployed"
