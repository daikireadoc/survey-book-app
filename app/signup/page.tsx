
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

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

  const handleSignup = async () => {
    try {
      setMessage("");
      setErrorMessage("");

      if (!email.trim()) {
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

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
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

      setMessage(
        "入力内容を受け付けました。未登録の場合は確認メールをご確認ください。すでに登録済の場合はログインをお試しください。"
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
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-strong)",
              color: "var(--foreground)",
            }}
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
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-strong)",
              color: "var(--foreground)",
            }}
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
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-strong)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="button-base"
        >
          {loading ? "作成中..." : "アカウントを作成する"}
        </button>

        <button
          onClick={() => router.push("/login")}
          className="button-base"
        >
          ログイン画面へ戻る
        </button>
      </div>
    </div>
  );
}