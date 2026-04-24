
export function isTrialExpired(subscription: any) {
    if (!subscription) return true;
  
    if (subscription?.demo_mode === true) {
      return false;
    }
  
    if (subscription.plan_status === "active") {
      return false;
    }
  
    if (subscription.plan_status !== "trial") {
      return true;
    }
  
    const now = Date.now();
  
    const trialEnd = subscription?.trial_end_at
      ? new Date(subscription.trial_end_at).getTime()
      : 0;
  
    const used = subscription?.trial_case_used ?? 0;
    const limit = subscription?.trial_case_limit ?? 0;
  
    return now > trialEnd || used >= limit;
  }