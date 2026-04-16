
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("ログインに失敗しました: " + error.message);
        return;
      }

      router.push("/account");
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
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
          }}
        >
          ログイン
        </h1>

        {/* メール */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        {/* パスワード */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {/* ボタン */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="button-base"
        >
          {loading ? "ログイン中..." : "ログインする"}
        </button>
      </div>
    </div>
  );
}