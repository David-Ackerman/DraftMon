#!/usr/bin/env bash
set -euo pipefail

export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
github=David-Ackerman/DraftMon
remote="https://github.com/$github.git"
base=/var/lib/draftmon-deploy
repository="$base/repository"
releases="$base/releases"
current="$base/current"
api_unit=draftmon-api.service
web_unit=draftmon-web.service
api_override="/etc/systemd/system/$api_unit.d/90-deploy.conf"
web_override="/etc/systemd/system/$web_unit.d/90-deploy.conf"

install -d -m 0755 "$base"
exec 9> "$base/lock"
flock -n 9 || exit 0

as_app() {
  runuser -u draftmon -- "$@" 9>&-
}

main_revision() {
  as_app git ls-remote --exit-code "$remote" refs/heads/main | cut -f1
}

approved() {
  curl -fsS --max-time 15 --retry 2 \
    -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$github/commits/$1/statuses?per_page=100" |
    node -e '
      const statuses = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
      const approval = statuses.find(({context}) => context === "draftmon/gcp-ready");
      if (!approval || approval.state !== "success" || approval.creator?.login !== "github-actions[bot]") {
        process.exitCode = 10;
      }
    '
}

build_release() {
  as_app bash -s -- "$1" "$2" "$base" <<'BUILD'
set -euo pipefail
cd "$1"
if [[ ! -e apps/web/public/ads.txt && -r "$3/ads.txt" ]]; then
  cp "$3/ads.txt" apps/web/public/ads.txt
fi
printf '%s\n' "$2" > apps/web/public/deploy-version.txt
pnpm install --frozen-lockfile --reporter=append-only
export API_URL=http://127.0.0.1:4000 NEXT_PUBLIC_SITE_URL=https://draftmon-league.app
export NEXT_TELEMETRY_DISABLED=1 CI=1
node --env-file-if-exists="$3/web-build.env" -e '
  const build = require("node:child_process").spawnSync("pnpm", [
    "--recursive", "--workspace-concurrency=1", "run", "build"
  ], {stdio: "inherit"});
  if (build.error) throw build.error;
  process.exitCode = build.status ?? 1;
'
BUILD
}

assign_current() {
  ln -sfn -- "$1" "$base/next" && mv -Tf -- "$base/next" "$current"
}

install_overrides() {
  install -d -- "$(dirname "$api_override")" "$(dirname "$web_override")" &&
    printf '[Service]\nWorkingDirectory=%s/apps/api\n' "$current" > "$api_override" &&
    printf '[Service]\nWorkingDirectory=%s/apps/web\n' "$current" > "$web_override"
}

restart_app() {
  systemctl daemon-reload && systemctl restart "$api_unit" "$web_unit"
}

verify_release() {
  local deployed
  for attempt in {1..20}; do
    if deployed=$(curl -fsS --max-time 3 http://127.0.0.1:3000/deploy-version.txt) &&
      [[ "$deployed" == "$1" ]] &&
      curl -fsSo /dev/null --max-time 3 http://127.0.0.1:4000/healthz &&
      curl -fsSo /dev/null --max-time 3 http://127.0.0.1:3000/api/auth/session &&
      curl -fsSo /dev/null --max-time 3 http://127.0.0.1:3000/ads.txt &&
      curl -fsSo /dev/null --max-time 3 http://127.0.0.1:3000/; then
      return 0
    fi
    sleep 2
  done
  return 1
}

prune_releases() {
  local dir
  for dir in "$releases"/*; do
    if [[ -d "$dir" && ${dir##*/} =~ ^[0-9a-f]{40}$ && "$dir" != "$1" && "$dir" != "$2" ]]; then
      as_app git -C "$repository" worktree remove --force "$dir" ||
        printf 'Could not prune %s\n' "$dir" >&2
    fi
  done
}

revision=$(main_revision)
[[ "$revision" =~ ^[0-9a-f]{40}$ ]]
release="$releases/$revision"
previous=$(readlink "$current" || true)
fallback=$(readlink "$base/previous" || true)
[[ "$release" != "$previous" ]] || exit 0
if [[ "${1:-}" != '--retry' && -f "$base/failed" && $(cat "$base/failed") == "$revision" ]]; then
  exit 0
fi
if approved "$revision"; then
  echo "GitHub approved $revision."
else
  status=$?
  if [[ "$status" == 10 ]]; then
    echo "Waiting for deployment approval for $revision."
    exit 0
  fi
  exit "$status"
fi

install -d -o draftmon -g draftmon "$repository" "$releases"
if [[ ! -d "$repository/objects" ]]; then as_app git init --bare "$repository"; fi
as_app git -C "$repository" fetch --no-tags "$remote" refs/heads/main
[[ $(as_app git -C "$repository" rev-parse FETCH_HEAD) == "$revision" ]] || exit 0
if [[ -d "$release" ]]; then as_app git -C "$repository" worktree remove --force "$release"; fi
as_app git -C "$repository" worktree add --detach "$release" "$revision"

if ! build_release "$release" "$revision"; then
  printf '%s\n' "$revision" > "$base/failed"
  prune_releases "$previous" "$fallback"
  exit 1
fi
if [[ $(main_revision) != "$revision" ]]; then
  echo 'main advanced during the build.'
  as_app git -C "$repository" worktree remove --force "$release"
  exit 0
fi

if assign_current "$release" && install_overrides && restart_app && verify_release "$revision"; then
  rm -f -- "$base/failed"
  if [[ -n "$previous" ]]; then ln -sfn -- "$previous" "$base/previous"; fi
  prune_releases "$release" "$previous"
  echo "Published $revision."
else
  printf '%s\n' "$revision" > "$base/failed"
  echo "Verification failed for $revision. Restoring the previous application release." >&2
  if [[ -n "$previous" ]]; then
    assign_current "$previous"
  else
    rm -f -- "$api_override" "$web_override" "$current"
  fi
  restart_app
  prune_releases "$previous" "$fallback"
  exit 1
fi
