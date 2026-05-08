
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        document.cookie = `user_email=${user.email}; path=/`;
        document.cookie = `user_id=${user.id}; path=/`;
        router.replace("/dashboard");
      }
    };

    checkUser();
  }, [router]);

  const handleLogin = async () => {
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

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
            placeholder="password"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-strong)",
              color: "var(--foreground)",
            }}
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