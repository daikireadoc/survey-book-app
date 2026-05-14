
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 通していいページ・API・静的ファイル
  if (
    pathname.startsWith("/billing") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const userEmail = req.cookies.get("user_email")?.value;
  const userId = req.cookies.get("user_id")?.value;

  // デモアカウント
  if (userEmail === "dahuihouteng145@gmail.com") {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const memberRes = await fetch(
      `${baseUrl}/rest/v1/organization_members?user_id=eq.${userId}&select=organization_id`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!memberRes.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const members = await memberRes.json();
    const organizationId = members?.[0]?.organization_id;

    if (!organizationId) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    const subRes = await fetch(
      `${baseUrl}/rest/v1/subscriptions?organization_id=eq.${organizationId}&select=*`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!subRes.ok) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    const subs = await subRes.json();
    const sub = subs?.[0];

    if (!sub) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    // canceled は明示的にNG
    if (sub.plan_status === "canceled") {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    const now = new Date();

    const isDemo = sub.demo_mode === true;

    const isTrialValid =
      sub.plan_status === "trial" &&
      sub.trial_end_at &&
      new Date(sub.trial_end_at) > now &&
      sub.trial_case_used < sub.trial_case_limit;

    const isActive = sub.plan_status === "active";

    if (!isDemo && !isTrialValid && !isActive) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|manifest.json).*)"],
};