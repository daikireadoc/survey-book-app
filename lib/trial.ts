export function isTrialExpired(subscription: any) {
    if (!subscription) return true;
  
    const now = Date.now();
    const trialEnd = subscription?.trial_end_at
      ? new Date(subscription.trial_end_at).getTime()
      : 0;
  
    return (
      subscription.plan_status === "trial" &&
      (
        subscription.trial_case_used >= subscription.trial_case_limit ||
        now > trialEnd
      )
    );
  }