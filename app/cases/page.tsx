
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const TABLE_NAME = "mansion_sales";

type ListRow = {
  id: string;
  created_at: string;
  property_name: string | null;
  address: string | null;
  notes: string | null;
  deal_type: string | null;
  property_type: string | null;
};

type SortKey = "created_desc" | "created_asc" | "name_asc" | "name_desc";

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${dd} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function safeText(s: string | null | undefined) {
  return (s ?? "").trim();
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
    <div style={{ position: "relative", width: "100%" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface-strong)",
          color: "var(--foreground)",
          padding: "10px 40px 10px 12px",
          fontSize: 14,
          lineHeight: 1.4,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          outline: "none",
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
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: 12,
          color: "var(--foreground)",
          display: "flex",
          alignItems: "center",
        }}
      >
        ▼
      </div>
    </div>
  );
}

export default function CasesPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("id, created_at, property_name, address, notes, deal_type, property_type")
        .order("created_at", { ascending: false });

      if (error) {
        setErr(error.message);
        return;
      }

      const list = (data ?? []) as ListRow[];
      setRows(list);

      setSelectedId((prev) => {
        if (!prev) return list[0]?.id ?? null;
        const stillExists = list.some((r) => r.id === prev);
        return stillExists ? prev : list[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filteredSorted = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    let list = rows;
    if (keyword) {
      list = rows.filter((r) => {
        const a = safeText(r.property_name).toLowerCase();
        const b = safeText(r.address).toLowerCase();
        const c = safeText(r.notes).toLowerCase();
        const d = `${safeText(r.deal_type)} ${safeText(r.property_type)}`.toLowerCase();
        return a.includes(keyword) || b.includes(keyword) || c.includes(keyword) || d.includes(keyword);
      });
    }

    const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });

    const sorted = [...list].sort((x, y) => {
      if (sortKey === "created_desc") return y.created_at.localeCompare(x.created_at);
      if (sortKey === "created_asc") return x.created_at.localeCompare(y.created_at);

      const xn = safeText(x.property_name);
      const yn = safeText(y.property_name);
      if (sortKey === "name_asc") return collator.compare(xn, yn);
      if (sortKey === "name_desc") return collator.compare(yn, xn);
      return 0;
    });

    return sorted;
  }, [rows, q, sortKey]);

  useEffect(() => {
    if (!selectedId) return;
    const exists = filteredSorted.some((r) => r.id === selectedId);
    if (!exists) setSelectedId(filteredSorted[0]?.id ?? null);
  }, [filteredSorted, selectedId]);

  const goEdit = useCallback(() => {
    if (!selected) return;
    router.push(`/create?id=${encodeURIComponent(selected.id)}`);
  }, [router, selected]);

  const removeCase = useCallback(async () => {
    if (!selected) return;

    const name = selected.property_name ?? "（物件名なし）";
    const ok = window.confirm(`「${name}」を削除します。よろしいですか？`);
    if (!ok) return;

    setLoading(true);
    setErr("");
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", selected.id);

      if (error) {
        setErr(error.message);
        return;
      }

      setSelectedId(null);
      await fetchRows();
    } finally {
      setLoading(false);
    }
  }, [selected, fetchRows]);

  const goMansionSale = useCallback(() => {
    if (!selected) return;

    const isMansionSale = selected.deal_type === "sale" && selected.property_type === "mansion";
    if (!isMansionSale) {
      alert("重要事項説明書は、今は「売買 / マンション」のみ対応です。");
      return;
    }

    router.push(`/mansion-preview/${selected.id}`);
  }, [router, selected]);

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
          maxWidth: 1152,
          width: "100%",
          margin: "0 auto",
          padding: "32px 16px",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">過去案件（保存一覧）</h1>
            <p className="mt-1 text-sm text-zinc-400">検索・並び替え・編集・削除・重要事項説明書</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/new")}
              className="button-base"
            >
              新規作成へ
            </button>

            <button
              type="button"
              onClick={fetchRows}
              className="button-base"
              disabled={loading}
            >
              更新
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          <div
            style={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 16,
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="grid gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="検索（物件名/住所/メモ/モード）"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-strong)",
                  color: "var(--foreground)",
                  padding: "12px 16px",
                  outline: "none",
                }}
              />

<div className="flex items-center gap-2">
  <Select
    value={sortKey}
    onChange={(v) => setSortKey(v as SortKey)}
    options={["created_desc", "created_asc", "name_asc", "name_desc"]}
    labels={{
      created_desc: "新しい順",
      created_asc: "古い順",
      name_asc: "物件名 A→Z",
      name_desc: "物件名 Z→A",
    }}
  />
</div>

              {err && (
                <div className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
                  {err}
                </div>
              )}

              <div className="text-xs text-zinc-400">
                件数：{filteredSorted.length}
                {loading ? "（処理中…）" : ""}
              </div>

              <div
                style={{
                  maxHeight: 560,
                  overflow: "auto",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                {filteredSorted.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-400">該当なし</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {filteredSorted.map((r) => {
                      const active = r.id === selectedId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: 12,
                            transition: "0.2s",
                            background: active ? "var(--surface-strong)" : "transparent",
                            color: "var(--foreground)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <div className="text-sm font-semibold">{r.property_name ?? "（物件名なし）"}</div>
                          <div className="mt-1 text-xs text-zinc-400">{r.address ?? "（住所なし）"}</div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{fmtDate(r.created_at)}</span>
                            <span>
                              {r.deal_type ?? "-"} / {r.property_type ?? "-"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 20,
              backdropFilter: "blur(8px)",
            }}
          >
            {!selected ? (
              <div className="text-sm text-zinc-400">左から案件を選択してください</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold">{selected.property_name ?? "（物件名なし）"}</div>
                    <div className="mt-1 text-sm text-zinc-400">{selected.address ?? "（住所なし）"}</div>
                    <div className="mt-2 text-xs text-zinc-500">
                      作成：{fmtDate(selected.created_at)} / モード：{selected.deal_type ?? "-"} /{" "}
                      {selected.property_type ?? "-"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={goEdit}
                      className="button-base"
                      disabled={loading}
                    >
                      編集する
                    </button>

                    <button
                      type="button"
                      onClick={removeCase}
                      className="button-base"
                      disabled={loading}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-strong)",
                    padding: 16,
                  }}
                >
                  <div className="text-sm font-semibold">メモ</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                    {selected.notes?.trim() ? selected.notes : "（なし）"}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={goMansionSale}
                    className="button-base"
                    disabled={loading}
                  >
                    重要事項説明書を作成
                  </button>
                </div>

                <div className="mt-4 text-sm text-zinc-500">
                  このボタンで、新しい12枚フォーマットのページへ移動します。PDF保存は移動先ページの「PDFで保存」から行います。
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}