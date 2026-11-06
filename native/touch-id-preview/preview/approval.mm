#import <AppKit/AppKit.h>
#import <LocalAuthentication/LocalAuthentication.h>
#include "approval-prompt.h"
#include "approval-button-style.h"
#include <iostream>

static bool gFnoxPreviewAccepted = false;

bool FnoxPreviewAcceptTouchId() {
  gFnoxPreviewAccepted = true;
  return true;
}

@interface FnoxPreviewRibbon : NSView
@property(strong) NSImage* shield;
@end

@implementation FnoxPreviewRibbon
- (instancetype)initWithFrame:(NSRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    NSString* svg = @"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><circle cx='100' cy='100' r='96' fill='#202833'/><circle cx='100' cy='100' r='87' fill='none' stroke='#d4af37' stroke-width='18'/><path fill='#d4af37' fill-rule='evenodd' d='M44,34 L82,58 L118,58 L156,34 L150,100 L100,170 L50,100 Z M88.5,100.6 A17,17 0 1 1 111.5,100.6 L116,140 L84,140 Z'/><path fill='#202833' d='M62,80 L78,86 L68,94 Z M138,80 L122,86 L132,94 Z'/></svg>";
    self.shield = [[NSImage alloc] initWithData:[svg dataUsingEncoding:NSUTF8StringEncoding]];
    if (!self.shield) {
      [NSException raise:NSInternalInconsistencyException format:@"Preview shield could not be decoded"];
    }
  }
  return self;
}
- (NSView*)hitTest:(NSPoint)point {
  (void)point;
  return nil;
}
- (void)drawRect:(NSRect)dirtyRect {
  (void)dirtyRect;
  const BOOL dark = [[self.effectiveAppearance
      bestMatchFromAppearancesWithNames:@[NSAppearanceNameAqua,
                                          NSAppearanceNameDarkAqua]]
      isEqualToString:NSAppearanceNameDarkAqua];
  NSColor* ribbonColor = fnox::ThemeColor(fnox::kThemeRibbon, self.effectiveAppearance);
  NSColor* ribbonInk = fnox::ThemeColor(fnox::kThemePressed, self.effectiveAppearance);
  NSColor* ribbonEdge = fnox::ThemeColor(fnox::kThemeBorder, self.effectiveAppearance);
  [NSGraphicsContext saveGraphicsState];
  NSRectClip(self.bounds);
  NSAffineTransform* transform = [NSAffineTransform transform];
  [transform translateXBy:30 yBy:50];
  [transform rotateByDegrees:45];
  [transform concat];
  [NSGraphicsContext saveGraphicsState];
  NSShadow* ribbonShadow = [NSShadow new];
  ribbonShadow.shadowColor = [NSColor colorWithWhite:0 alpha:0.25];
  ribbonShadow.shadowOffset = NSMakeSize(0, -1);
  ribbonShadow.shadowBlurRadius = 4;
  if (dark) [ribbonShadow set];
  [ribbonColor setFill];
  NSRectFill(NSMakeRect(-75, -10, 150, 20));
  [NSGraphicsContext restoreGraphicsState];
  [ribbonEdge setStroke];
  NSBezierPath* border = [NSBezierPath bezierPathWithRect:NSMakeRect(-74.5, -9.5, 149, 19)];
  border.lineWidth = dark ? 2 : 1;
  [border stroke];
  NSShadow* textShadow = [NSShadow new];
  textShadow.shadowColor = [NSColor colorWithWhite:0 alpha:dark ? 0.35 : 0];
  textShadow.shadowOffset = NSMakeSize(0, -1);
  textShadow.shadowBlurRadius = 1;
  NSAttributedString* label = [[NSAttributedString alloc] initWithString:@"Preview" attributes:@{
    NSFontAttributeName: [NSFont boldSystemFontOfSize:9],
    NSForegroundColorAttributeName: ribbonInk,
    NSKernAttributeName: @0.48,
    NSShadowAttributeName: textShadow,
  }];
  const NSSize labelSize = label.size;
  const CGFloat shieldSize = 24;
  const CGFloat groupWidth = shieldSize + 4 + labelSize.width;
  const NSRect shieldRect = NSMakeRect(-groupWidth / 2, -shieldSize / 2,
                                       shieldSize, shieldSize);
  [NSGraphicsContext saveGraphicsState];
  if (dark) {
    NSShadow* logoShadow = [NSShadow new];
    logoShadow.shadowColor = [NSColor colorWithSRGBRed:10.0/255
        green:14.0/255 blue:26.0/255 alpha:0.65];
    logoShadow.shadowOffset = NSMakeSize(0, -1);
    logoShadow.shadowBlurRadius = 1.5;
    [logoShadow set];
  }
  [self.shield drawInRect:shieldRect];
  [NSGraphicsContext restoreGraphicsState];
  [label drawAtPoint:NSMakePoint(-groupWidth / 2 + shieldSize + 4,
                                 -labelSize.height / 2)];
  [NSGraphicsContext restoreGraphicsState];
}
@end

namespace fnox {
struct AuthorizationContext::Impl {
  LAContext* context = [LAContext new];
  bool cancelled = false;
};
AuthorizationContext::AuthorizationContext() : impl_(std::make_unique<Impl>()) {}
AuthorizationContext::~AuthorizationContext() = default;
LAContext* AuthorizationContext::NativeContext() { return impl_->context; }
void AuthorizationContext::Invalidate() { impl_->cancelled = true; }
bool AuthorizationContext::AuthenticateWithEvents(
    std::string_view, KeychainError&, const std::function<void()>& process_events) {
  while (!impl_->cancelled && !gFnoxPreviewAccepted) {
    process_events();
    if (!impl_->cancelled && !gFnoxPreviewAccepted) {
      [NSRunLoop.currentRunLoop runUntilDate:
          [NSDate dateWithTimeIntervalSinceNow:0.01]];
    }
  }
  return !impl_->cancelled && gFnoxPreviewAccepted;
}
}

int main() {
  @autoreleasepool {
    gFnoxPreviewAccepted = false;
    [NSApplication sharedApplication];
#ifdef FNOX_TOUCH_PREVIEW
    NSString* requestedAppearance = NSProcessInfo.processInfo.environment[@"FNOX_PREVIEW_APPEARANCE"];
    if ([requestedAppearance isEqualToString:@"dark"]) {
      NSApp.appearance = [NSAppearance appearanceNamed:NSAppearanceNameDarkAqua];
    } else if ([requestedAppearance isEqualToString:@"light"]) {
      NSApp.appearance = [NSAppearance appearanceNamed:NSAppearanceNameAqua];
    }
#endif
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [NSApp finishLaunching];
    [NSApp activateIgnoringOtherApps:YES];
    id observer = [NSNotificationCenter.defaultCenter
        addObserverForName:NSWindowDidBecomeKeyNotification object:nil
        queue:nil usingBlock:^(NSNotification* notification) {
      NSWindow* window = notification.object;
      NSView* content = window.contentView;
      for (NSView* child in content.subviews) {
        if ([child.identifier isEqualToString:@"FnoxPreviewRibbon"]) return;
      }
      FnoxPreviewRibbon* ribbon = [[FnoxPreviewRibbon alloc]
          initWithFrame:NSMakeRect(0, content.bounds.size.height - 80, 80, 80)];
      ribbon.identifier = @"FnoxPreviewRibbon";
      ribbon.autoresizingMask = NSViewMinYMargin;
      ribbon.accessibilityElement = YES;
      ribbon.accessibilityRole = NSAccessibilityStaticTextRole;
      ribbon.accessibilityLabel = @"Preview. Press Shift-Return to simulate Touch ID success. No credential access.";
      [content addSubview:ribbon positioned:NSWindowAbove relativeTo:nil];
    }];
    fnox::RunOptions options;
    options.credentials.push_back({"project:keel/GITHUB_TOKEN", "GITHUB_TOKEN"});
    options.executable.canonical_path = "/usr/local/bin/claude";
    options.working_directory.canonical_path = "/Users/jdalton/projects/keel";
    options.child_arguments = {"claude"};
    fnox::AuthorizationContext context;
    fnox::KeychainError error;
    const bool approved = fnox::ShowApprovalPrompt(options, std::string(64, 'a'), context,
        "Fnox credential proxy preview", error);
    [NSNotificationCenter.defaultCenter removeObserver:observer];
    if (!approved && error.status != fnox::KeychainStatus::kDenied) {
      std::cerr << "fnox preview failed: " << error.detail << '\n';
      return 1;
    }
  }
  return 0;
}
