#!/bin/sh
# Keeps factory files out of pull requests to EXXETA/exxperts. Runs from pre-push and rejects a branch that carries them
# when it is bound for EXXETA: it is named exxeta/*, it has an open PR there, or EXXETA_GUARD_ALL=1 (the clean clone).
set -eu
UPSTREAM_URL=https://github.com/EXXETA/exxperts
FACTORY_PATHS='^(\.agents/|\.factory/|\.githooks/|\.claude/|docs/adr/|docs/tasks/|docs/reviews/|docs/reports/|docs/handoffs/|docs/(coordinator|dev-workflow|review-protocol|architect-protocol|debt|controller-rules)\.md|tools/|factory\.config\.json|AGENTS\.md|CODING_STANDARDS\.md|design/|graphify-out/|\.graphify|CLAUDE\.md)'
fetched=no
status=0
while read -r _local_ref local_sha remote_ref _remote_sha; do
  case "$local_sha" in *[!0]*) ;; *) continue ;; esac
  branch=${remote_ref#refs/heads/}
  bound=${EXXETA_GUARD_ALL:-0}
  case "$branch" in exxeta/*) bound=1 ;; esac
  if [ "$bound" != 1 ] && [ "$branch" != main ]; then
    # Fail closed: without an answer from GitHub the branch may still feed an open PR.
    open=$(gh pr list --repo EXXETA/exxperts --author bussard76 --head "$branch" --state open --json number --jq length) || {
      echo "[exxeta-guard] cannot ask GitHub whether $branch has an open PR on EXXETA/exxperts; push rejected." >&2; exit 1; }
    [ "$open" = 0 ] || bound=1
  fi
  [ "$bound" = 1 ] || continue
  if [ "$fetched" = no ]; then git fetch -q "$UPSTREAM_URL" main; base=$(git rev-parse FETCH_HEAD); fetched=yes; fi
  found=$(git diff --name-only "$base...$local_sha" | grep -E "$FACTORY_PATHS" || true)
  if [ -n "$found" ]; then
    echo "[exxeta-guard] $branch is bound for EXXETA/exxperts but carries factory files; push rejected:" >&2
    echo "$found" | head -10 >&2
    echo "Branch from upstream/main and keep main and the factory branches out of it." >&2
    status=1
  fi
done
exit "$status"
