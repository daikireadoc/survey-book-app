
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "No userId" }, { status: 400 });
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .single();

    if (memberError || !member?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("organization_id", member.organization_id)
      .single();

    if (subscriptionError || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Stripe subscription not found" },
        { status: 400 }
      );
    }

    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", member.organization_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("cancel-subscription error:", e);
    return NextResponse.json({ error: "cancel failed" }, { status: 500 });
  }
}