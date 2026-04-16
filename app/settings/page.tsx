
"use client";

import { useEffect, useMemo, useState } from "react";

const SETTINGS_KEY = "surveybook:settings:v1";

type ThemeMode = "light" | "dark" | "system";

type SettingsState = {
  company_name: string;
  representative_name: string;
  office_address: string;
  license_number: string;
  license_date: string;

  agent_name: string;
  agent_reg_no: string;
  agent_office: string;
  agent_tel_area: string;
  agent_tel_local: string;
  agent_tel_line: string;

  transaction_kind: string;
  transaction_role: string;

  theme: ThemeMode;
};

const initialSettings: SettingsState = {
  company_name: "",
  representative_name: "",
  office_address: "",
  license_number: "",
  license_date: "",

  agent_name: "",
  agent_reg_no: "",
  agent_office: "",
  agent_tel_area: "",
  agent_tel_local: "",
  agent_tel_line: "",

  transaction_kind: "売買",
  transaction_role: "媒介",

  theme: "dark",
};

function resolveSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  if (mode === "light") {
    root.setAttribute("data-theme", "light");
    return;
  }

  if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
    return;
  }

  root.setAttribute("data-theme", resolveSystemTheme());
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsState>(initialSettings);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setForm((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch (e) {
      console.warn("settings load error", e);
    }
  }, []);

  useEffect(() => {
    applyTheme(form.theme);

    if (form.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [form.theme]);

  const isEmpty = useMemo(() => {
    const { theme, transaction_kind, transaction_role, ...rest } = form;

    const othersEmpty = Object.values(rest).every((v) => String(v).trim() === "");
    const defaultsSame =
      theme === initialSettings.theme &&
      transaction_kind === initialSettings.transaction_kind &&
      transaction_role === initialSettings.transaction_role;

    return othersEmpty && defaultsSame;
  }, [form]);

  const handleChange = (key: keyof SettingsState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(form));
      applyTheme(form.theme);

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setSavedAt(`${y}/${m}/${d} ${hh}:${mm}`);

      alert("設定を保存しました");
    } catch (e) {
      console.error(e);
      alert("設定の保存に失敗しました");
    }
  };

  const handleReset = () => {
    const ok = window.confirm("設定をリセットしますか？");
    if (!ok) return;

    setForm(initialSettings);
    localStorage.removeItem(SETTINGS_KEY);
    setSavedAt("");
    applyTheme(initialSettings.theme);
    alert("設定をリセットしました");
  };

  return (
    <div style={pageWrap}>
      <div style={innerWrap}>
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              margin: 0,
              color: "var(--foreground)",
            }}
          >
            設定
          </h1>

          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            会社情報や担当者情報を保存して、今後の入力をラクにします。
          </p>

          {savedAt ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              最終保存：{savedAt}
            </div>
          ) : null}
        </div>

        <Section title="表示設定">
          <Field label="テーマ">
            <Select
              value={form.theme}
              onChange={(v) => handleChange("theme", v as ThemeMode)}
              options={["light", "dark", "system"]}
              labels={{
                light: "ライト",
                dark: "ダーク",
                system: "自動（端末に合わせる）",
              }}
            />
          </Field>
        </Section>

        <Section title="会社情報">
          <Field label="会社名">
            <Input
              value={form.company_name}
              onChange={(v) => handleChange("company_name", v)}
              placeholder="例：株式会社〇〇不動産"
            />
          </Field>

          <Field label="代表者名">
            <Input
              value={form.representative_name}
              onChange={(v) => handleChange("representative_name", v)}
              placeholder="例：山田太郎"
            />
          </Field>

          <Field label="主たる事務所">
            <Input
              value={form.office_address}
              onChange={(v) => handleChange("office_address", v)}
              placeholder="例：大阪市北区〇〇..."
            />
          </Field>

          <Field label="免許証番号">
            <Input
              value={form.license_number}
              onChange={(v) => handleChange("license_number", v)}
              placeholder="例：大阪府知事（2）第123456号"
            />
          </Field>

          <Field label="免許年月日">
            <Input
              value={form.license_date}
              onChange={(v) => handleChange("license_date", v)}
              placeholder="例：2026年4月1日"
            />
          </Field>
        </Section>

        <Section title="説明担当者情報">
          <Field label="宅建士氏名">
            <Input
              value={form.agent_name}
              onChange={(v) => handleChange("agent_name", v)}
              placeholder="例：桃太郎"
            />
          </Field>

          <Field label="登録番号">
            <Input
              value={form.agent_reg_no}
              onChange={(v) => handleChange("agent_reg_no", v)}
              placeholder="例：123456"
            />
          </Field>

          <Field label="業務に従事する事務所">
            <Input
              value={form.agent_office}
              onChange={(v) => handleChange("agent_office", v)}
              placeholder="例：梅田営業所"
            />
          </Field>

          <Field label="電話番号">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, color: "var(--foreground)" }}>(</span>

              <input
                value={form.agent_tel_area}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  handleChange("agent_tel_area", v);
                }}
                placeholder="06"
                style={{ ...inputStyle, width: 80, textAlign: "center" }}
                inputMode="numeric"
              />

              <span style={{ fontSize: 18, color: "var(--foreground)" }}>)</span>

              <input
                value={form.agent_tel_local}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  handleChange("agent_tel_local", v);
                }}
                placeholder="1234"
                style={{ ...inputStyle, width: 90, textAlign: "center" }}
                inputMode="numeric"
              />

              <span style={{ fontSize: 18, color: "var(--foreground)" }}>-</span>

              <input
                value={form.agent_tel_line}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  handleChange("agent_tel_line", v);
                }}
                placeholder="5678"
                style={{ ...inputStyle, width: 90, textAlign: "center" }}
                inputMode="numeric"
              />
            </div>

            <div
              style={{
                fontSize: 12,
                marginTop: 6,
                color: "var(--muted)",
              }}
            >
              ※ 市外局番/携帯先頭は2〜3桁、中央と末尾は最大4桁で入力
            </div>
          </Field>
        </Section>

        <Section title="初期値">
          <Field label="取引の態様①">
            <Select
              value={form.transaction_kind}
              onChange={(v) => handleChange("transaction_kind", v)}
              options={["売買", "交換"]}
            />
          </Field>

          <Field label="取引の態様②">
            <Select
              value={form.transaction_role}
              onChange={(v) => handleChange("transaction_role", v)}
              options={["当事者", "代理", "媒介"]}
            />
          </Field>
        </Section>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={handleSave} className="button-base">
            保存する
          </button>

          <button type="button" onClick={handleReset} className="button-base">
            リセット
          </button>
        </div>

        <div style={memoCard}>
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
            この設定は今はこの端末のブラウザに保存されます。
            <br />
            次の段階で、新規作成ページに自動反映されます。
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {isEmpty ? "まだ設定は保存されていません" : "保存済みデータあり"}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionCard}>
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
    <label style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          paddingRight: "36px",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ color: "black" }}>
            {labels?.[opt] ?? opt}
          </option>
        ))}
      </select>

      <div
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: 12,
          color: "var(--foreground)",
          opacity: 0.8,
        }}
      >
        ▼
      </div>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--background)",
  color: "var(--foreground)",
};

const innerWrap: React.CSSProperties = {
  maxWidth: 1152,
  width: "100%",
  margin: "0 auto",
  padding: "32px 16px",
  display: "grid",
  gap: 16,
};

const sectionCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  padding: 20,
  backdropFilter: "blur(8px)",
  display: "grid",
  gap: 12,
};

const memoCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  color: "var(--foreground)",
  padding: "12px 16px",
  outline: "none",
};