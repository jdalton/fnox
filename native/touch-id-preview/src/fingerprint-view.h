#import <AppKit/AppKit.h>

double FnoxFingerprintApprovalDuration(BOOL reduceMotion);

@interface FnoxFingerprintShieldView : NSView
@end

@interface FnoxFingerprintView : NSView
- (void)animateNudge;
- (void)animateSuccess;
@end
