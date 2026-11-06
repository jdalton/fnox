# Fnox Touch ID preview

A standalone macOS UI prototype for the [Touch ID proposal](../../docs/proposals/macos-touch-id-approval.md). This is a visual preview with simulated approval and sample request details. It does not fetch credentials, authorize Keychain reads, or run a credential proxy.

## Build and run

Requires macOS, Xcode command-line tools with the macOS 26 SDK for the glass view, CMake 3.25+, and Node.js with TypeScript stripping support (22.6+). The glass presentation requires macOS 26; older systems use the ordinary panel fallback.

From the repository root:

```sh
cmake -S native/touch-id-preview -B /tmp/fnox-touch-id-build -DCMAKE_BUILD_TYPE=Debug
cmake --build /tmp/fnox-touch-id-build --target fnox-touch-id-preview --parallel 4
open /tmp/fnox-touch-id-build/fnox-touch-id-preview.app
```

Press **Shift+Return** to simulate approval and play the success animation. Cancel or Escape dismisses the panel. Details opens the sample metadata; its label buttons copy the corresponding values. Relaunch after approval to replay it.

The preview follows the system appearance. For a specific appearance, run the executable directly:

```sh
FNOX_PREVIEW_APPEARANCE=light /tmp/fnox-touch-id-build/fnox-touch-id-preview.app/Contents/MacOS/fnox-touch-id-preview
# Use dark instead of light to preview dark mode.
```

## Color tuning

Please tweak the colors to taste. `theme.mts` holds the dark palette, the OKLab lightness conversion for light mode, and contrast rules for text and borders. Both native controls and the fingerprint use the generated theme. Changing colors does not require changing animation timing or geometry.

`animation.mts` contains the animation timing and palette roles. `preview/approval.mm` draws the preview ribbon. Generated animation and theme headers belong in the CMake build directory.

See [THEME.md](THEME.md) for the exact formula, role offsets, contrast checks, and limitations.

## Production boundary

The preview supplies a fake authorization context. Shift+Return only demonstrates the presentation; it is not biometric authentication. The production design must bind approval to the requested operation and have the operating system enforce access to the protected Keychain item using the same `LAContext`.

Fnox already has a macOS Developer ID signing/notarization workflow. A distributable native helper still needs a stable signing identity, an agreed bundle/entitlement design, packaging, and notarization. This target has not been integrated with that release workflow.

The native UI and animation sources include MIT-licensed code, with the original copyright and terms retained in [LICENSE](LICENSE).
