#!/bin/bash
set -euo pipefail
script=$(cd "$(dirname "$0")/../.." && pwd)/scripts/enable-sudo-touch-id.sh
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fixture=$work/pam
mkdir "$fixture"
printf 'auth include sudo_local\nauth sufficient pam_smartcard.so\n' > "$fixture/sudo"
printf '# Local policy\n#auth sufficient pam_tid.so\nauth optional pam_custom.so\n' > "$fixture/sudo_local.template"
run() { "$script" --pam-dir "$fixture" "$@"; }
expect_status() {
  expected=$1; shift
  set +e
  "$@" > "$work/output" 2>&1
  actual=$?
  set -e
  [ "$actual" = "$expected" ] || { cat "$work/output"; echo "Expected $expected, got $actual" >&2; exit 1; }
}
expect_status 1 run --check
run --dry-run > "$work/plan"
[ ! -e "$fixture/sudo_local" ]
run --apply > "$work/apply"
run --check > /dev/null
[ "$(awk '$1=="auth" && $3=="pam_tid.so" {n++} END{print n}' "$fixture/sudo_local")" = 1 ]
grep -q 'pam_custom.so' "$fixture/sudo_local"
cp "$fixture/sudo_local" "$work/first"
run --apply > /dev/null
cmp "$fixture/sudo_local" "$work/first"
printf 'auth sufficient pam_tid.so\nauth sufficient pam_tid.so\n' > "$fixture/sudo_local"
expect_status 2 run --apply
printf 'auth required pam_tid.so\n' > "$fixture/sudo_local"
expect_status 2 run --apply
rm "$fixture/sudo_local"
ln -s "$fixture/sudo_local.template" "$fixture/sudo_local"
expect_status 2 run --apply
rm "$fixture/sudo_local"
printf 'auth optional pam_custom.so\n' > "$fixture/sudo_local"
cp "$fixture/sudo_local" "$work/before"
run --apply > /dev/null
cmp "$work/before" "$fixture"/sudo_local.fnox-backup.*
printf 'auth sufficient pam_smartcard.so\n' > "$fixture/sudo"
expect_status 2 run --apply
printf 'Passed: dry run, template, custom rules, idempotency, duplicates, unexpected policy, symlink, backup, missing include.\n'
