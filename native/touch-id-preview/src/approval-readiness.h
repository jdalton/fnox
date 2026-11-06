#ifndef FNOX_APPROVAL_READINESS_H
#define FNOX_APPROVAL_READINESS_H

namespace fnox {

struct ApprovalPresentationState {
  bool application_active = false;
  bool panel_key = false;
  bool panel_visible = false;
  bool authentication_host_attached = false;
  bool authentication_host_visible = false;
  bool authentication_view_attached = false;
  bool authentication_view_visible = false;
};

enum class ApprovalReadinessStatus {
  kWaiting,
  kReady,
  kCancelled,
  kUnavailable,
};

class ApprovalReadinessGate final {
public:
  ApprovalReadinessStatus Observe(const ApprovalPresentationState& presentation,
                                  bool cancelled, bool timed_out);

private:
  ApprovalReadinessStatus status_ = ApprovalReadinessStatus::kWaiting;
};

} // namespace fnox

#endif
