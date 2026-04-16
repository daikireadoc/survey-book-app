

"use client";

import { useMemo, useState } from "react";

type MainMode = "sale" | "rent";
type SubMode = "land_house" | "mansion" | "exchange";
type ModeState = { main: MainMode; sub: SubMode };

type ModeDraftState = {
  main: MainMode | null;
  sub: SubMode | null;
};

const steps = [
  { key: "mode", label: "Step 1 モード選択" },
  { key: "type", label: "Step 2 物件タイプ" },
  { key: "base", label: "Step 3 基本情報" },
] as const;

const NEW_DRAFT_KEY = "surveybook:newDraft:v1";

type NewDraft = {
  mode: ModeState;
  name: string;
  address: string;
  createdAt: string;
};

export default function NewSurveyWizardPage() {
  const [stepIndex, setStepIndex] = useState(0);

  const [mode, setMode] = useState<ModeDraftState>({
    main: null,
    sub: null,
  });

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const canGoNext = useMemo(() => {
    if (stepIndex === 0) return mode.main !== null;
    if (stepIndex === 1) return mode.sub !== null;
    if (stepIndex === 2) return name.trim().length > 0 && address.trim().length > 0;
    return false;
  }, [stepIndex, mode.main, mode.sub, name, address]);

  const next = () => {
    if (!canGoNext) return;
    setStepIndex((v) => Math.min(v + 1, steps.length - 1));
  };

  const back = () => {
    setStepIndex((v) => Math.max(v - 1, 0));
  };

  const resetAll = () => {
    setStepIndex(0);
    setMode({ main: null, sub: null });
    setName("");
    setAddress("");
    try {
      localStorage.removeItem(NEW_DRAFT_KEY);
    } catch {}
  };

  const currentModeText = useMemo(() => {
    const main = mode.main ?? "未選択";
    const sub = mode.sub ?? "未選択";
    return `${main} / ${sub}`;
  }, [mode.main, mode.sub]);

  const handleCreate = () => {
    if (!mode.main || !mode.sub) {
      alert("Step1/2 を選択してください");
      return;
    }

    if (name.trim() === "" || address.trim() === "") {
      alert("物件名・所在地を入力してください");
      return;
    }

    const draft: NewDraft = {
      mode: { main: mode.main, sub: mode.sub },
      name: name.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("localStorage set failed:", e);
      alert("下書き保存に失敗しました（ブラウザ設定を確認してください）");
      return;
    }

    window.location.href = "/create";
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
          maxWidth: 960,
          width: "100%",
          margin: "0 auto",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                margin: 0,
                color: "var(--foreground)",
              }}
            >
              新規作成
            </h1>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "var(--muted)",
              }}
            >
              最初にモードを選択してください（後から変更できます）
            </p>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="button-base"
          >
            フォームをリセット
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {steps.map((s, i) => {
            const active = i === stepIndex;
            return (
              <StepTab
                key={s.key}
                active={active}
                onClick={() => setStepIndex(i)}
              >
                {s.label}
              </StepTab>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 24,
            backdropFilter: "blur(8px)",
          }}
        >
          {stepIndex === 0 && (
            <Step1Mode
              value={mode.main}
              onChange={(v) => setMode((prev) => ({ ...prev, main: v, sub: null }))}
            />
          )}

          {stepIndex === 1 && (
            <Step2Type
              main={mode.main}
              value={mode.sub}
              onChange={(v) => setMode((prev) => ({ ...prev, sub: v }))}
            />
          )}

          {stepIndex === 2 && (
            <Step3BaseInfo
              modeText={currentModeText}
              name={name}
              address={address}
              onChangeName={setName}
              onChangeAddress={setAddress}
            />
          )}

          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0}
              className="button-base"
            >
              戻る
            </button>

            {stepIndex < 2 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canGoNext}
                className="button-base"
              >
                次へ
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canGoNext}
                className="button-base"
              >
                このモードで作成する
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 24,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            現在の選択
          </div>

          <div
            style={{
              marginTop: 8,
              display: "grid",
              gap: 4,
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            <div>モード: {currentModeText}</div>
            <div>物件名: {name.trim() ? name : "未入力"}</div>
            <div>所在地: {address.trim() ? address : "未入力"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1Mode({
  value,
  onChange,
}: {
  value: MainMode | null;
  onChange: (v: MainMode) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--foreground)",
        }}
      >
        取引の種類を選択
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "var(--muted)",
        }}
      >
        重要事項説明書の「法的な種類」をまず決めます。
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <SelectableCard
          title="売買（売買・交換）"
          description="売買・交換用の重要事項説明書を作成します。"
          tag="推奨"
          selected={value === "sale"}
          onClick={() => onChange("sale")}
        />

        <SelectableCard
          title="賃貸（準備中）"
          description="賃貸借契約向けの項目構成です（今後対応予定）"
          tag="準備中"
          selected={value === "rent"}
          disabled
          onClick={() => onChange("rent")}
        />
      </div>
    </div>
  );
}

function Step2Type({
  main,
  value,
  onChange,
}: {
  main: MainMode | null;
  value: SubMode | null;
  onChange: (v: SubMode) => void;
}) {
  const disabledAll = main === null;

  return (
    <div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--foreground)",
        }}
      >
        物件タイプを選択
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "var(--muted)",
        }}
      >
        売買の中でも、物件タイプで入力項目・文章が変わります。
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 12,
        }}
      >

<SelectableCard
  title="土地・戸建（準備中）"
  description="今後対応予定"
  tag="sale"
  selected={false}
  disabled={true}
  onClick={() => {}}
/>

        <SelectableCard
          title="区分所有建物（マンション）"
          description="区分所有（マンション）売買に対応"
          tag="sale"
          selected={value === "mansion"}
          disabled={disabledAll}
          onClick={() => onChange("mansion")}
        />
      </div>

      {disabledAll && (
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "#dc2626",
          }}
        >
          先に Step 1 でモードを選択してね
        </div>
      )}
    </div>
  );
}

function Step3BaseInfo({
  modeText,
  name,
  address,
  onChangeName,
  onChangeAddress,
}: {
  modeText: string;
  name: string;
  address: string;
  onChangeName: (v: string) => void;
  onChangeAddress: (v: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--foreground)",
        }}
      >
        基本情報を入力
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface-strong)",
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--foreground)",
          }}
        >
          選択モード
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          {modeText}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          このモードで「調査ブック入力フォーム」と「重要事項説明書ドラフト」の構成が切り替わります。
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            物件名（必須）
          </div>

          <input
            style={fieldInputStyle}
            placeholder="例：サンライズマンション"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
          />
        </div>

        <div>
          <div
            style={{
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            所在地（必須）
          </div>

          <input
            style={fieldInputStyle}
            placeholder="例：東京都新宿区西新宿〇-〇-〇"
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function StepTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const inverted = active || hovered;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 9999,
        border: inverted ? "1px solid var(--foreground)" : "1px solid var(--border)",
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 700,
        transition: "0.2s",
        background: inverted ? "var(--foreground)" : "transparent",
        color: inverted ? "var(--background)" : "var(--foreground)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SelectableCard({
  title,
  description,
  tag,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  tag?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const inverted = selected || (hovered && !disabled);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        borderRadius: 16,
        border: inverted ? "1px solid var(--foreground)" : "1px solid var(--border)",
        padding: 16,
        textAlign: "left",
        transition: "0.2s",
        background: inverted ? "var(--foreground)" : "transparent",
        color: inverted ? "var(--background)" : "var(--foreground)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: inverted ? "var(--background)" : "var(--foreground)",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 14,
              color: inverted ? "var(--background)" : "var(--muted)",
              opacity: inverted ? 0.8 : 1,
            }}
          >
            {description}
          </div>
        </div>

        {tag && (
          <div
            style={{
              borderRadius: 9999,
              border: inverted ? "1px solid var(--background)" : "1px solid var(--border)",
              padding: "4px 12px",
              fontSize: 12,
              color: inverted ? "var(--background)" : "var(--foreground)",
              whiteSpace: "nowrap",
              opacity: inverted ? 0.9 : 1,
            }}
          >
            {tag}
          </div>
        )}
      </div>
    </button>
  );
}

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  color: "var(--foreground)",
  padding: "12px 16px",
  outline: "none",
};