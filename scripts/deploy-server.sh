#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
host="${DEPLOY_HOST:-root@43.134.64.51}"
key="${DEPLOY_KEY:-$HOME/.ssh/tradeflow_deploy_ed25519}"
git diff --quiet && git diff --cached --quiet || { echo 'Commit source changes before releasing'; exit 1; }
commit="$(git rev-parse HEAD)"
release="${commit:0:7}-$(date -u +%Y%m%d%H%M%S)"
if [ "${SKIP_CHECK:-0}" != 1 ]; then npm run check; fi
test "$(git rev-parse HEAD)" = "$commit"
git diff --quiet && git diff --cached --quiet || { echo 'Source changed during build'; exit 1; }
test -f dist/index.html
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
RELEASE_ID="$release" RELEASE_COMMIT="$commit" node --input-type=module -e 'import {writeFileSync} from "node:fs"; writeFileSync("dist/release.json", JSON.stringify({release:process.env.RELEASE_ID,commit:process.env.RELEASE_COMMIT,builtAt:new Date().toISOString()}));'
COPYFILE_DISABLE=1 tar --no-xattrs --exclude='._*' -czf "$stage/site.tar.gz" -C dist .
ssh -o BatchMode=yes -i "$key" "$host" "mkdir -p /opt/shanyi-paipan/incoming/$release"
scp -q -i "$key" "$stage/site.tar.gz" deploy/server/nginx.conf deploy/server/docker-compose.yml "$host:/opt/shanyi-paipan/incoming/$release/"
ssh -o BatchMode=yes -i "$key" "$host" bash -s -- "$release" <<'REMOTE'
set -euo pipefail
release="$1"
root=/opt/shanyi-paipan
exec 9>"$root/deploy.lock"
flock -n 9 || { echo 'Another release is running'; exit 1; }
cd "$root"
incoming="$root/incoming/$release"
next="$root/releases/$release"
previous="$(readlink -f current)"
backup="$root/config-backups/$release"
mkdir -p "$next" "$backup"
cp nginx.conf docker-compose.yml "$backup/"
printf '%s\n' "$previous" > "$backup/previous-release"
tar -xzf "$incoming/site.tar.gz" -C "$next"
# Old open tabs can still request their hashed assets and citation editions.
cp -an "$previous/assets/." "$next/assets/"
cp -an "$previous/knowledge/classics/." "$next/knowledge/classics/"
image='nginx@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa'
docker run --rm --network none -v "$incoming/nginx.conf:/etc/nginx/conf.d/default.conf:ro" "$image" nginx -t
rollback() {
  echo 'Release failed; restoring previous release'
  cp "$backup/nginx.conf" "$backup/docker-compose.yml" "$root/"
  ln -sfn "$previous" "$root/current.rollback"
  mv -Tf "$root/current.rollback" "$root/current"
  docker compose up -d --force-recreate
}
trap rollback ERR
cp "$incoming/nginx.conf" "$incoming/docker-compose.yml" "$root/"
ln -sfn "$next" current.next
mv -Tf current.next current
docker compose up -d --force-recreate
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8002/release.json | grep -q "$release"; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:8002/release.json | grep -q "$release"
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8002/knowledge/classics/not-found.json)" = 404
curl -fsS -H 'Accept-Encoding: gzip' -D "$backup/headers.txt" http://127.0.0.1:8002/knowledge/classics/search.json -o /dev/null
grep -qi 'Content-Encoding: gzip' "$backup/headers.txt"
trap - ERR
rm -f "$incoming/site.tar.gz"
echo "Published $release on port 8002. Previous release: $previous"
REMOTE
