# Proposal: optional Touch ID setup for sudo

**Status:** proposal for maintainer feedback; no PAM changes or new command are implemented.

[iTerm2's Touch ID installer](https://github.com/gnachman/iTerm2/blob/56071501a0503d414dd5b4a4586e2d7d8a9e9cbe/Resources/install-touchid-sudo.sh) enables Apple's existing Touch ID authentication module for sudo. Fnox could adopt its transparent, opt-in setup pattern as an optional macOS convenience, starting with a read-only diagnostic in `fnox doctor`.

## What iTerm2 does

The installer displays its own contents before re-executing under sudo. It uses `/etc/pam.d/sudo_local`, falls back to `sudo_local.template` when present, and enables or appends an `auth sufficient pam_tid.so` entry. It then writes the file with mode 0644. Existing active entries are retained, so rerunning the basic setup does not append another entry when one is already recognized.

The [Swift helper](https://github.com/gnachman/iTerm2/blob/56071501a0503d414dd5b4a4586e2d7d8a9e9cbe/sources/TryingTooHard/iTermTouchIDHelper.swift) separately checks whether biometric authentication can be evaluated and whether `sudo_local` contains an uncommented `pam_tid.so` reference. It opens a dedicated terminal window to run the installer, allowing the user to see the request for administrator authorization.

These are separate checks: a configured module is not proof that Touch ID works in the current terminal session, and the ability to evaluate a biometric policy is not proof that sudo will choose it.

## Possible Fnox enhancement

Start with a macOS-only, read-only `fnox doctor` check. Report whether the local sudo PAM stack includes `sudo_local`, whether an active Touch ID entry exists there, and whether the current process can evaluate biometric authentication. Distinguish unavailable hardware, unavailable session, missing configuration, and unknown status. Do not promise success based only on a substring match in a file.

If there is demand, add an explicit setup action that:

1. Shows the exact planned file change before requesting administrator authorization.
2. Confirms the system sudo configuration actually includes `sudo_local` and that the Apple module/template exists. If prerequisites are missing, explains the limitation instead of editing the system sudo stack automatically.
3. Preserves existing PAM rules and their ordering. Refuses ambiguous configurations rather than rewriting them blindly.
4. Avoids duplicate active entries; treats repeated setup as a no-op when the desired rule already exists.
5. Checks for unexpected file types/symlinks, preserves a backup, and writes through a temporary file in the destination directory with root ownership and appropriate permissions before atomic replacement.
6. Provides an exact rollback path that removes only Fnox's change, without discarding subsequent administrator changes.
7. Leaves interactive verification to the user and reports configured versus verified status separately.

Do not perform this setup during ordinary installation, secret reads, or startup. A command name and default placement should be agreed with the maintainer before implementation.

## Relationship to credential approval

This configures sudo's authentication path. It does not create a Fnox credential vault, protect arbitrary provider reads, or establish a scoped credential lease. The OS owns the Touch ID prompt. Sudo owns its authorization policy and authentication timestamp; Fnox must not treat a valid sudo timestamp as permission to disclose secrets.

For a native Fnox Keychain feature, the protected Keychain operation still needs OS-enforced access control bound to its authentication context. For a credential proxy, approval still needs explicit destination, operation, scope, and expiry. A short-lived in-memory credential lease is separate from sudo authentication caching.

## Signing and session constraints

A shell installer enabling Apple's existing PAM module does not require a custom Fnox Touch ID helper or a new Developer ID certificate just to display sudo's OS-owned prompt. It does require administrator authorization to change the PAM configuration. Any native Fnox UI or helper distributed alongside it has its own signing and notarization requirements.

Terminal session attachment matters. iTerm2 has historical reports of Touch ID failing when sessions survive logout; background terminals, multiplexers, and remote sessions need separate validation. Do not automatically install additional PAM modules or weaken remote-session protections to hide such failures.

Reference: [iTerm2 report about persistent sessions and sudo Touch ID](https://gitlab.com/gnachman/iterm2/-/issues/7618). This is historical evidence of the session constraint, not a claim that current iTerm2 versions have the same defect.

## Implementation checks before shipping

Test the diagnostic and planner against fixture files covering absent files, commented and active entries, whitespace, duplicates, existing custom modules, symlinks, and malformed configurations. Test setup/rollback against temporary directories rather than the developer's live PAM configuration. Then manually validate the installed path on supported macOS versions and terminal/session types, including cancellation and password fallback.

This proposal was prepared by inspecting the pinned iTerm2 source above. No installer was run and no local PAM configuration was changed.

## Maintainer questions

- Does sudo Touch ID setup belong in Fnox, or should `doctor` only link to OS/terminal setup guidance?
- If a setup action belongs here, should Fnox own the local change or invoke a separately maintained installer?
- Which macOS and terminal-session combinations should be supported and documented?
