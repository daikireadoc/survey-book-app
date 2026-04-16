
import { supabase } from "./supabaseClient";

export async function incrementTrialCaseUsed(
    organizationId: string
  ) {
    // 現在の値をDBから取得
    const { data, error: fetchError } = await supabase
      .from("subscriptions")
      .select("trial_case_used")
      .eq("organization_id", organizationId)
      .single();
  
    if (fetchError) throw fetchError;
  
    const current = data?.trial_case_used ?? 0;
  
    // +1して更新
    const { error } = await supabase
      .from("subscriptions")
      .update({
        trial_case_used: current + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
  
    if (error) throw error;
  }