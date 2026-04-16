
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getMyOrganizationAndSubscription } from "../../lib/account";
import { isTrialExpired } from "../../lib/trial";

type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void | Promise<void>;
};

function applyTheme(mode: "light" | "dark" | "system") {
  const root = document.documentElement;

  if (mode === "light") {
    root.setAttribute("data-theme", "light");
    return;
  }

  if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
    return;
  }

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", isDark ? "dark" : "light");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("surveybook:settings:v1");

      if (!raw) {
        applyTheme("dark");
        return;
      }

      const parsed = JSON.parse(raw);
      applyTheme(parsed?.theme ?? "dark");
    } catch {
      applyTheme("dark");
    }
  }, []);

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

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "ホーム", href: "/" },
      { label: "新規作成", onClick: handleNewCreateClick },
      { label: "過去案件", href: "/cases" },
      { label: "アカウント", href: "/account" },
      { label: "設定", href: "/settings" },
    ],
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* ===== HEADER ===== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--background) 70%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          {/* メニューボタン */}
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              padding: "8px 12px",
              background: "transparent",
              color: "var(--foreground)",
              cursor: "pointer",
              transition: "0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--foreground)";
              e.currentTarget.style.color = "var(--background)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--foreground)";
            }}
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <div className="text-base font-bold">ReaDoc</div>
            <div className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
              beta
            </div>
          </div>

          <div className="ml-auto text-xs text-zinc-400">{pathname}</div>
        </div>
      </header>

      {/* ===== MENU ===== */}
      {open && (
        <div className="fixed inset-0 z-30">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: 280,
              borderRight: "1px solid var(--border)",
              background: "var(--background)",
              padding: 16,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold">メニュー</div>

              {/* 閉じるボタン */}
              <button
                onClick={() => setOpen(false)}
                style={{
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  padding: "6px 10px",
                  background: "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--foreground)";
                  e.currentTarget.style.color = "var(--background)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
              >
                ✕
              </button>
            </div>

            {/* メニュー項目 */}
            <nav className="grid gap-2">
              {navItems.map((item) => {
                const active = item.href ? pathname === item.href : false;

                return item.onClick ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={async () => {
                      setOpen(false);
                      await item.onClick?.();
                    }}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      padding: "12px 16px",
                      textDecoration: "none",
                      transition: "0.2s",
                      border: active
                        ? "1px solid var(--foreground)"
                        : "1px solid var(--border)",
                      background: active
                        ? "var(--foreground)"
                        : "transparent",
                      color: active
                        ? "var(--background)"
                        : "var(--foreground)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--foreground)";
                        e.currentTarget.style.color = "var(--background)";
                        e.currentTarget.style.border =
                          "1px solid var(--foreground)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--foreground)";
                        e.currentTarget.style.border =
                          "1px solid var(--border)";
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href ?? "#"}
                    onClick={() => setOpen(false)}
                    style={{
                      borderRadius: 12,
                      padding: "12px 16px",
                      textDecoration: "none",
                      transition: "0.2s",
                      border: active
                        ? "1px solid var(--foreground)"
                        : "1px solid var(--border)",
                      background: active
                        ? "var(--foreground)"
                        : "transparent",
                      color: active
                        ? "var(--background)"
                        : "var(--foreground)",
                      display: "block",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--foreground)";
                        e.currentTarget.style.color = "var(--background)";
                        e.currentTarget.style.border =
                          "1px solid var(--foreground)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--foreground)";
                        e.currentTarget.style.border =
                          "1px solid var(--border)";
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}