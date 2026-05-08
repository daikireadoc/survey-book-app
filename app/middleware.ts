
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  if (
    url.pathname.startsWith("/billing") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next")
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await res.json();
    const sub = data?.[0];

    const now = new Date();

    const isTrialValid =
      sub?.plan_status === "trial" &&
      sub?.trial_end_at &&
      new Date(sub.trial_end_at) > now &&
      sub?.trial_case_used < sub?.trial_case_limit;

    const isActive = sub?.plan_status === "active";

    if (!isTrialValid && !isActive) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};