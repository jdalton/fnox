#ifndef FNOX_APPROVAL_PRESENTATION_H
#define FNOX_APPROVAL_PRESENTATION_H

#import <AppKit/AppKit.h>

namespace fnox {

constexpr CGFloat kFingerprintArtworkSize = 96;

inline NSRect AuthenticationHostFrame(NSSize contentSize, CGFloat y) {
  return NSMakeRect((contentSize.width - kFingerprintArtworkSize) / 2, y,
                    kFingerprintArtworkSize, kFingerprintArtworkSize);
}

inline void LayoutAuthenticationHost(
    NSView* authenticationHost, NSView* nativeAuthenticationView,
    NSView* shieldView, NSRect frame) {
  authenticationHost.frame = frame;
  nativeAuthenticationView.frame = authenticationHost.bounds;
  nativeAuthenticationView.alphaValue = 1;
  nativeAuthenticationView.hidden = NO;
  if (nativeAuthenticationView.superview != authenticationHost) {
    [nativeAuthenticationView removeFromSuperview];
    [authenticationHost addSubview:nativeAuthenticationView];
  }
  if (shieldView != nil) [shieldView removeFromSuperview];
}

inline void PrepareFingerprintForAuthentication(
    NSView* panelContent, NSView* authenticationHost,
    NSView* nativeAuthenticationView, NSView* shieldView,
    NSView* customFingerprintView, NSRect frame) {
  LayoutAuthenticationHost(authenticationHost, nativeAuthenticationView,
                           shieldView, frame);
  customFingerprintView.frame = frame;
  customFingerprintView.hidden = NO;
  customFingerprintView.alphaValue = 1;
  [panelContent addSubview:customFingerprintView
                positioned:NSWindowAbove
                relativeTo:authenticationHost];
}

inline bool PresentAuthenticatedFingerprint(
    NSView* panelContent, NSView* nativeAuthenticationView,
    NSView* customFingerprintView, NSRect frame, bool authenticated,
    bool cancelled) {
  if (!authenticated || cancelled) return false;
  if (customFingerprintView.superview != panelContent) return false;
  customFingerprintView.frame = frame;
  customFingerprintView.hidden = NO;
  customFingerprintView.alphaValue = 1;
  nativeAuthenticationView.alphaValue = 1;
  nativeAuthenticationView.hidden = NO;
  return true;
}

} // namespace fnox

#endif
