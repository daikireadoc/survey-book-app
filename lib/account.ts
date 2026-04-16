
import { supabase } from "./supabaseClient";

export async function getMyOrganizationAndSubscription() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("ログインしていません");
  }

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) {
    throw new Error("organization_members が見つかりません");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", member.organization_id)
    .single();

  if (subscriptionError || !subscription) {
    throw new Error("subscriptions が見つかりません");
  }

  return {
    user,
    organizationId: member.organization_id,
    subscription,
  };
}