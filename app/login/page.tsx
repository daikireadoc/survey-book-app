
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [companyCode, setCompanyCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-strong)",
    color: "var(--foreground)",
  };

  const checkSubscriptionActive = async (userId: string) => {
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .single();

    if (memberError || !member?.organization_id) {
      return {
        ok: false,
        message: "会社情報が見つかりません。",
      };
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", member.organization_id)
      .single();

    if (subscriptionError || !subscription) {
      return {
        ok: false,
        message: "契約情報が見つかりません。",
      };
    }

    const now = new Date();

    const isDemo = subscription.demo_mode === true;

    const isTrialValid =
      subscription.plan_status === "trial" &&
      subscription.trial_end_at &&
      new Date(subscription.trial_end_at) > now &&
      subscription.trial_case_used < subscription.trial_case_limit;

    const isActive = subscription.plan_status === "active";

    if (!isDemo && !isTrialValid && !isActive) {
      return {
        ok: false,
        message: "無料トライアルまたは契約期間が終了しています。",
      };
    }

    return {
      ok: true,
      message: "",
    };
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const result = await checkSubscriptionActive(user.id);

      if (!result.ok) {
        await supabase.auth.signOut();
        setErrorMessage(result.message);
        return;
      }

      document.cookie = `user_email=${user.email}; path=/`;
      document.cookie = `user_id=${user.id}; path=/`;

      router.replace("/dashboard");
    };

    checkUser();
  }, [router]);

  const handleLogin = async () => {
    try {
      setMessage("");
      setErrorMessage("");

      const normalizedCompanyCode = companyCode.trim().toLowerCase();
      const normalizedEmail = email.trim();

      if (!normalizedCompanyCode) {
        setErrorMessage("会社IDを入力してください。");
        return;
      }

      if (!/^[a-z0-9]{3,12}$/.test(normalizedCompanyCode)) {
        setErrorMessage("会社IDは半角英数字のみ・3〜12文字で入力してください。");
        return;
      }

      if (!normalizedEmail) {
        setErrorMessage("メールアドレスを入力してください。");
        return;
      }

      if (!password) {
        setErrorMessage("パスワードを入力してください。");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "メール認証が完了していません。確認メール内のリンクを開いてからログインしてください。"
          );
        } else if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_credentials")
        ) {
          setErrorMessage("メールアドレスまたはパスワードが正しくありません。");
        } else {
          setErrorMessage("ログインに失敗しました: " + error.message);
        }
        return;
      }

      const user = data.user;

      if (!user) {
        setErrorMessage("ログイン情報の取得に失敗しました。");
        return;
      }

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("company_code", normalizedCompanyCode)
        .single();

      if (organizationError || !organization) {
        await supabase.auth.signOut();
        setErrorMessage("会社IDが存在しません。");
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("user_id", user.id)
        .single();

      if (memberError || !member) {
        await supabase.auth.signOut();
        setErrorMessage("会社IDが一致していません。");
        return;
      }

      const result = await checkSubscriptionActive(user.id);

      if (!result.ok) {
        await supabase.auth.signOut();
        setErrorMessage(result.message);
        return;
      }

      document.cookie = `user_email=${user.email}; path=/`;
      document.cookie = `user_id=${user.id}; path=/`;

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          display: "grid",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
          ログイン
        </h1>

        {message && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(34, 197, 94, 0.35)",
              background: "rgba(34, 197, 94, 0.12)",
              color: "var(--foreground)",
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {message}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(239, 68, 68, 0.35)",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--foreground)",
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>会社ID</label>
          <input
            value={companyCode}
            onChange={(e) => {
              setCompanyCode(e.target.value.toLowerCase());
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="半角英数字のみ・3〜12文字"
            maxLength={12}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="test@example.com"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="password"
            style={inputStyle}
          />
        </div>

        <button onClick={handleLogin} disabled={loading} className="button-base">
          {loading ? "ログイン中..." : "ログインする"}
        </button>

        <button onClick={() => router.push("/signup")} className="button-base">
          アカウントを作成する
        </button>
      </div>
    </div>
  );
}