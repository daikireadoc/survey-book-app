
export function isTrialExpired(subscription: any) {
    if (!subscription) return true;
  
    // デモアカウントは常に利用OK
    if (subscription?.demo_mode === true) {
      return false;
    }
  
    // 有料プランは利用OK
    if (subscription.plan_status === "active") {
      return false;
    }
  
    // トライアル以外は期限切れ扱い
    if (subscription.plan_status !== "trial") {
      return true;
    }
  
    const now = Date.now();
  
    const trialEnd = subscription?.trial_end_at
      ? new Date(subscription.trial_end_at).getTime()
      : 0;
  
    const used = subscription?.trial_case_used ?? 0;
    const limit = subscription?.trial_case_limit ?? 0;
  
    // 30日切れ or 3案件到達なら終了
    return now > trialEnd || used >= limit;
  }