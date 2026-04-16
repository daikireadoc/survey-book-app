
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyOrganizationAndSubscription } from "../lib/account";
import { isTrialExpired } from "../lib/trial";

export default function HomePage() {
  const router = useRouter();

  const handleNewCreateClick = async () => {
    try {
      const { subscription } = await getMyOrganizationAndSubscription();

      if (isTrialExpired(subscription)) {
        alert("無料トライアルの上限に達しています。有料プランへ移行してください。");
        router.push("/billing");
        return;
      }

      router.push("/new");
    } catch (e) {
      console.error(e);
      alert("利用状況の確認に失敗しました。");
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
      <h1
        style={{
          fontSize: 32,
          fontWeight: 900,
          margin: 0,
          color: "var(--foreground)",
        }}
      >
        ReaDoc
      </h1>

      <p
        style={{
          opacity: 0.8,
          marginTop: 10,
          marginBottom: 20,
          color: "var(--muted)",
        }}
      >
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
        background: "var(--surface)",
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

      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        {desc}
      </div>

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
        background: "var(--surface)",
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

      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        {desc}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={onClick}
          className="button-base"
          style={{
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          {button}
        </button>
      </div>
    </div>
  );
}