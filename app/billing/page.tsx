
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

  const standardStripeLink =
    "https://buy.stripe.com/bJe3cxealaEhcSq6w36Na00";
  const corporateStripeLink =
    "https://buy.stripe.com/3cIeVf4zLfYB05E6w36Na01";

  const isActive = subscription?.plan_status === "active";
  const isStandard = subscription?.paid_plan_type === "standard";
  const isCorporate = subscription?.paid_plan_type === "corporate";
  const isDemo = subscription?.demo_mode === true;

  const currentPlanLabel = isDemo
    ? "デモアカウント"
    : isActive
    ? isCorporate
      ? "法人プラン"
      : "スタンダードプラン"
    : "無料トライアル";

  const isExpired =
    subscription &&
    subscription.plan_status === "trial" &&
    subscription.demo_mode !== true &&
    (subscription.trial_case_used >= subscription.trial_case_limit ||
      Date.now() > new Date(subscription.trial_end_at).getTime());

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 20,
    display: "grid",
    gap: 12,
  };

  const noteStyle: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-strong)",
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.7,
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 16px",
    textDecoration: "none",
    background: "var(--foreground)",
    color: "var(--background)",
    border: "1px solid var(--foreground)",
    borderRadius: 12,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    transition: "0.2s ease",
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    opacity: 0.45,
    cursor: "not-allowed",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 16px",
    textDecoration: "none",
    background: "transparent",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    transition: "0.2s ease",
  };

  const handleHoverIn = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.opacity = "0.85";
    e.currentTarget.style.transform = "translateY(-1px)";
  };

  const handleHoverOut = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.opacity = "1";
    e.currentTarget.style.transform = "translateY(0)";
  };

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
          maxWidth: 960,
          margin: "0 auto",
          padding: "32px 16px 56px",
          display: "grid",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
          プラン管理
        </h1>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800 }}>現在の利用状況</div>
          <div>現在プラン：{currentPlanLabel}</div>

          {!isActive && !isDemo && (
            <>
              <div>残り日数：{remainingDays}日</div>
              <div>残り案件数：{remainingCases}件</div>
            </>
          )}

          {isActive && (
            <div style={noteStyle}>
              現在、有料プランが有効です。トライアル制限なくご利用いただけます。
            </div>
          )}

          {isDemo && (
            <div style={noteStyle}>
              デモアカウントのため、トライアル期限・案件数制限なくご利用いただけます。
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>無料トライアル</div>
          <div>最大30日間 または 3案件まで無料でご利用いただけます。</div>

          {isExpired ? (
            <div style={noteStyle}>
              無料トライアルは終了しています。継続利用には有料プランへの移行が必要です。
            </div>
          ) : (
            <div style={noteStyle}>
              トライアル期間中でも、こちらから有料プランへ移行できます。
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>
              スタンダードプラン
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>月額 ¥30,000</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              初めての導入におすすめ
            </div>

            <div style={{ display: "grid", gap: 8, lineHeight: 1.8 }}>
              <div>・売買マンションモード利用可能</div>
              <div>・重要事項説明書の自動生成</div>
              <div>・入力データ保存</div>
              <div>・サポート対応あり</div>
            </div>

            <div style={noteStyle}>
              〜5人規模の事業者様向けプランです。クレジットカード決済でそのままお申し込みいただけます。
            </div>

            {isActive && isStandard ? (
              <button disabled className="button-base" style={disabledButtonStyle}>
                現在利用中
              </button>
            ) : (
              <a
                href={standardStripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="button-base"
                style={primaryButtonStyle}
                onMouseEnter={handleHoverIn}
                onMouseLeave={handleHoverOut}
              >
                スタンダードで始める
              </a>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>法人プラン</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>月額 ¥30,000〜</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              6人以上のご利用向け
            </div>

            <div style={{ display: "grid", gap: 8, lineHeight: 1.8 }}>
              <div>・1モード ¥30,000（最大5ユーザーまで）</div>
              <div>・6人目以降は 1ユーザーごとに ¥10,000 / 月</div>
              <div>・継続的な機能アップデート</div>
              <div>・優先サポートあり</div>
            </div>

            <div style={noteStyle}>
              決済画面では、追加ユーザー数を調整できます。
              <br />
              5名様までは追加ユーザー数を「0」にしてください。
              <br />
              6名様以上の場合は、6人目以降の人数を入力してください。
            </div>

            {isActive && isCorporate ? (
              <button
                className="button-base"
                style={primaryButtonStyle}
                onClick={() => {
                  alert(
                    "人数追加機能は現在準備中です。追加をご希望の場合は個別にご連絡ください。"
                  );
                }}
                onMouseEnter={handleHoverIn}
                onMouseLeave={handleHoverOut}
              >
                人数を追加する
              </button>
            ) : (
              <a
                href={corporateStripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="button-base"
                style={primaryButtonStyle}
                onMouseEnter={handleHoverIn}
                onMouseLeave={handleHoverOut}
              >
                法人プランで導入する
              </a>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800 }}>補足</div>
          <div style={{ lineHeight: 1.9 }}>
            <div>・すべて月額制（自動更新）</div>
            <div>・クレジットカード決済対応</div>
            <div>・いつでも解約可能（次回更新前まで）</div>
            <div>
              ・現在は正式リリース前のため特別価格でご案内しております
            </div>
            <div>
              ・今後、提供機能やサポート内容に応じて価格が変更となる可能性があります
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/account"
            className="button-base"
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--foreground)";
              e.currentTarget.style.color = "var(--background)";
              e.currentTarget.style.border = "1px solid var(--foreground)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.border = "1px solid var(--border)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            アカウントへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}