
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getMyOrganizationAndSubscription } from "../../lib/account";
import { isTrialExpired } from "../../lib/trial";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  const handleNewCreateClick = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { subscription } = await getMyOrganizationAndSubscription();

      if (isTrialExpired(subscription)) {
        router.push("/billing");
        return;
      }

      router.push("/new");
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: "0 auto",
        color: "var(--foreground)",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>ReaDoc</h1>

      <p style={{ opacity: 0.8, marginTop: 10, marginBottom: 20 }}>
        調査ブック入力 → 重要事項説明書作成までを一気通貫で。
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <CardButton
          title="新規作成"
          desc="モードを選んで新しい案件を作成します。"
          button="新規作成へ"
          onClick={handleNewCreateClick}
        />

        <CardLink
          title="過去案件"
          desc="保存済み一覧・入力・重要事項説明書ドラフト作成。"
          href="/cases"
          button="過去案件へ"
        />

        <CardLink
          title="アカウント"
          desc="ログイン中のメールアドレス確認やログアウトができます。"
          href="/account"
          button="アカウントへ"
        />

        <CardLink
          title="設定"
          desc="今後の表示設定やアプリ設定をここにまとめます。"
          href="/settings"
          button="設定へ"
        />

        <div style={{ gridColumn: "1 / -1" }}>
          <CardLink
            title="プラン管理"
            desc="現在の無料トライアル状況や有料プランを確認できます。"
            href="/billing"
            button="プランを見る"
          />
        </div>
      </div>
    </div>
  );
}

function CardLink({
  title,
  desc,
  href,
  button,
}: {
  title: string;
  desc: string;
  href: string;
  button: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{desc}</div>

      <div style={{ marginTop: 12 }}>
        <Link
          href={href}
          className="button-base"
          style={{
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          {button}
        </Link>
      </div>
    </div>
  );
}

function CardButton({
  title,
  desc,
  button,
  onClick,
}: {
  title: string;
  desc: string;
  button: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{desc}</div>

      <div style={{ marginTop: 12 }}>
        <button onClick={onClick} className="button-base">
          {button}
        </button>
      </div>
    </div>
  );
}