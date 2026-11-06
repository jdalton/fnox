#include "approval-readiness.h"

namespace fnox {

ApprovalReadinessStatus ApprovalReadinessGate::Observe(
    const ApprovalPresentationState& presentation, bool cancelled,
    bool timed_out) {
  if (status_ != ApprovalReadinessStatus::kWaiting) {
    return status_;
  }
  if (cancelled) {
    status_ = ApprovalReadinessStatus::kCancelled;
  } else if (timed_out) {
    status_ = ApprovalReadinessStatus::kUnavailable;
  } else if (presentation.application_active && presentation.panel_key &&
             presentation.panel_visible &&
             presentation.authentication_host_attached &&
             presentation.authentication_host_visible &&
             presentation.authentication_view_attached &&
             presentation.authentication_view_visible) {
    status_ = ApprovalReadinessStatus::kReady;
  }
  return status_;
}

} // namespace fnox
