
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [companyCode, setCompanyCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
      }
    };

    checkUser();
  }, [router]);

  const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-strong)",
    color: "var(--foreground)",
  };

  const handleSignup = async () => {
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

      if (password.length < 6) {
        setErrorMessage("パスワードは6文字以上で入力してください。");
        return;
      }

      if (password !== passwordConfirm) {
        setErrorMessage("確認用パスワードが一致していません。");
        return;
      }

      setLoading(true);

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("company_code", normalizedCompanyCode)
        .single();

      if (organizationError || !organization) {
        setErrorMessage("会社IDが存在しません。");
        return;
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organization.id)
        .single();

      if (subscriptionError || !subscription) {
        setErrorMessage("この会社の契約情報が見つかりません。");
        return;
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
        setErrorMessage(
          "この会社は現在利用できません。無料トライアルまたは契約期間が終了しています。"
        );
        return;
      }

      const { count, error: countError } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      if (countError) {
        setErrorMessage("利用人数の確認に失敗しました。");
        return;
      }

      const maxUsers = subscription.max_users ?? 5;

      if (!isDemo && count !== null && count >= maxUsers) {
        setErrorMessage(
          "この会社は契約人数の上限に達しています。管理者にお問い合わせください。"
        );
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: "https://survey-book-app.vercel.app/login",
        },
      });

      if (error) {
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          setErrorMessage(
            "このメールアドレスは既に登録されています。ログインしてください。"
          );
        } else {
          setErrorMessage("アカウント作成に失敗しました: " + error.message);
        }
        return;
      }

      const user = data.user;

      if (user) {
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            organization_id: organization.id,
            user_id: user.id,
            role: "member",
          });

        if (memberError) {
          console.error(memberError);
          setErrorMessage(
            "アカウントは作成されましたが、会社への紐付けに失敗しました。管理者にお問い合わせください。"
          );
          return;
        }

        document.cookie = `user_email=${user.email}; path=/`;
        document.cookie = `user_id=${user.id}; path=/`;
      }

      setMessage(
        "アカウント作成を受け付けました。確認メールが届いている場合は、メール内のリンクを開いてからログインしてください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const showLoginShortcut = errorMessage.includes("既に登録");

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
          アカウント作成
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
              display: "grid",
              gap: 10,
            }}
          >
            <div>{errorMessage}</div>

            {showLoginShortcut && (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="button-base"
              >
                ログインへ
              </button>
            )}
          </div>
        )}

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            会社ID
          </label>
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
            placeholder="6文字以上"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            パスワード（確認）
          </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="もう一度入力"
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="button-base"
        >
          {loading ? "作成中..." : "アカウントを作成する"}
        </button>

        <button onClick={() => router.push("/login")} className="button-base">
          ログイン画面へ戻る
        </button>
      </div>
    </div>
  );
}