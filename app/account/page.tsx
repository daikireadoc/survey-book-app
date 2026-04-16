
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getMyOrganizationAndSubscription } from "../../lib/account";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loadedAt, setLoadedAt] = useState("");
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [remainingCases, setRemainingCases] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setLoadedAt(`${y}/${m}/${d} ${hh}:${mm}`);
    };

    const getSubscription = async () => {
      try {
        const { subscription } = await getMyOrganizationAndSubscription();
        setSubscriptionInfo(subscription);

        if (subscription?.trial_end_at) {
          const diff =
            new Date(subscription.trial_end_at).getTime() - Date.now();
          const days = Math.max(
            0,
            Math.ceil(diff / (1000 * 60 * 60 * 24))
          );
          setRemainingDays(days);
        } else {
          setRemainingDays(0);
        }

        const cases = Math.max(
          0,
          (subscription?.trial_case_limit ?? 0) -
            (subscription?.trial_case_used ?? 0)
        );
        setRemainingCases(cases);
      } catch (e) {
        console.error(e);
        setRemainingDays(0);
        setRemainingCases(0);
      }
    };

    getUser();
    getSubscription();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    location.href = "/";
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
          maxWidth: 1152,
          width: "100%",
          margin: "0 auto",
          padding: "32px 16px",
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              margin: 0,
              color: "var(--foreground)",
            }}
          >
            アカウント
          </h1>

          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            ログイン情報と利用状況を確認できます。
          </p>
        </div>

        <Section title="基本情報">
          <Field label="メールアドレス">
            <Value>{user?.email || "未ログイン"}</Value>
          </Field>

          <Field label="ユーザーID">
            <Value>{user?.id ? `${user.id.slice(0, 12)}...` : "未取得"}</Value>
          </Field>

          <Field label="ログイン状態">
            <Value>{user ? "ログイン中" : "未ログイン"}</Value>
          </Field>
        </Section>

        <Section title="利用情報">
          <Field label="現在プラン">
            <Value>
              {subscriptionInfo?.plan_status === "active"
                ? "有料プラン"
                : "無料トライアル"}
            </Value>
          </Field>

          <Field label="残り日数">
            <Value>{remainingDays !== null ? `${remainingDays}日` : "取得中"}</Value>
          </Field>

          <Field label="残り案件数">
            <Value>{remainingCases !== null ? `${remainingCases}件` : "取得中"}</Value>
          </Field>

          <Field label="最終アクセス">
            <Value>{loadedAt || "-"}</Value>
          </Field>
        </Section>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
  <Link
    href="/billing"
    className="button-base"
    style={{
      display: "inline-block",
      textDecoration: "none",
    }}
  >
    プラン管理を見る
  </Link>

  <button
    type="button"
    onClick={handleLogout}
    className="button-base"
  >
    ログアウト
  </button>
</div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              marginBottom: 8,
              color: "var(--foreground)",
            }}
          >
            メモ
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--muted)",
            }}
          >
            今後はここに「契約会社情報」や「請求情報」を追加予定です。
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
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
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: "var(--foreground)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface-strong)",
        color: "var(--foreground)",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}