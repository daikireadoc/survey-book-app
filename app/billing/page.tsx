
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyOrganizationAndSubscription } from "../../lib/account";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [remainingDays, setRemainingDays] = useState<number>(0);
  const [remainingCases, setRemainingCases] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { subscription } = await getMyOrganizationAndSubscription();
        setSubscription(subscription);

        const end = subscription?.trial_end_at
          ? new Date(subscription.trial_end_at).getTime()
          : 0;

        const now = Date.now();

        const days = Math.max(
          0,
          Math.ceil((end - now) / (1000 * 60 * 60 * 24))
        );

        const cases = Math.max(
          0,
          (subscription?.trial_case_limit ?? 0) -
            (subscription?.trial_case_used ?? 0)
        );

        setRemainingDays(days);
        setRemainingCases(cases);
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, []);

  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";

  const isExpired =
    subscription &&
    subscription.plan_status === "trial" &&
    (
      subscription.trial_case_used >= subscription.trial_case_limit ||
      Date.now() > new Date(subscription.trial_end_at).getTime()
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 16px",
          display: "grid",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
          プラン管理
        </h1>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 20,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800 }}>現在の利用状況</div>
          <div>
            現在プラン：
            {subscription?.plan_status === "active"
              ? "有料プラン"
              : "無料トライアル"}
          </div>
          <div>残り日数：{remainingDays}日</div>
          <div>残り案件数：{remainingCases}件</div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 20,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800 }}>有料プラン</div>
          <div>月額 30,000円</div>
          <div>売買マンションモード利用可能</div>
          <div>重要事項説明書の自動生成</div>
          <div>入力データ保存</div>
          <div>継続サポートあり</div>

          {isExpired ? (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              無料トライアルは終了しています。継続利用には有料プランへの移行が必要です。
            </div>
          ) : (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              トライアル期間中でも、こちらから有料プランへ移行できます。
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="button-base"
              style={{
                display: "inline-block",
                textDecoration: "none",
                background: "var(--foreground)",
                color: "var(--background)",
                border: "1px solid var(--foreground)",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              有料プランへ進む
            </a>

            <Link
              href="/account"
              className="button-base"
              style={{
                display: "inline-block",
                textDecoration: "none",
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--foreground)";
                e.currentTarget.style.color = "var(--background)";
                e.currentTarget.style.border = "1px solid var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.border = "1px solid var(--border)";
              }}
            >
              アカウントへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}