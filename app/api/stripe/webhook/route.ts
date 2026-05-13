
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STANDARD_PAYMENT_LINK = "https://buy.stripe.com/aFacN79U527Lf0ybQn6Na04";
const CORPORATE_PAYMENT_LINK = "https://buy.stripe.com/4gMdRb5DP5jXf0y2fN6Na03";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error("Missing environment variables");
    return new Response("Missing environment variables", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (!email) {
      return new Response("No email", { status: 200 });
    }

    const paymentLink =
      typeof session.payment_link === "string" ? session.payment_link : "";

    const isCorporate = paymentLink === CORPORATE_PAYMENT_LINK;
    const paidPlanType = isCorporate ? "corporate" : "standard";

    // standardは5人固定
    // corporateは一旦6人 + 追加人数
    // ※追加人数の取得はStripeのLine Itemsから取る
    let maxUsers = 5;

if (isCorporate) {
  maxUsers = 6;
}

    if (isCorporate && session.id) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 10 }
        );

        const additionalUsers =
          lineItems.data.reduce((sum, item) => {
            const quantity = item.quantity ?? 0;

            // 50000円の基本料金ではなく、追加ユーザー用の行だけ拾う想定
            // もし法人リンクが「数量=追加人数」だけで作ってるならこのままでOK
            return sum + quantity;
          }, 0) ?? 0;

        maxUsers = 6 + additionalUsers;
      } catch (e) {
        console.error("Failed to fetch line items:", e);
        maxUsers = 5;
      }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", email, profileError);
      return new Response("Profile not found", { status: 200 });
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", profile.id)
      .single();

    if (memberError || !member) {
      console.error("Member not found:", profile.id, memberError);
      return new Response("Member not found", { status: 200 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_status: "active",
        paid_plan_type: paidPlanType,
        max_users: maxUsers,
        paid_started_at: new Date().toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", member.organization_id);

    if (updateError) {
      console.error("Subscription update error:", updateError);
      return new Response("Subscription update error", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}