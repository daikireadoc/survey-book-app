
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const TABLE_NAME = "mansion_sales";
type SurveyBookRow = any;

const PAGES = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(
  (n) => `/templates/mansion/mansion_page-${n}.png`
);

/** ===== util ===== */
function sanitizeFileName(s: string) {
  return (s || "").replace(/[\\/:*?"<>|]/g, "").trim();
}

function sanitizeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayYmdJst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function makePdfFileName(row: SurveyBookRow) {
  const name = sanitizeFileName(row?.property_name ?? "物件名未設定");
  const date = todayYmdJst();
  return `${name}_売買_マンション_${date}.pdf`;
}

/** 値取得 */
function getValue(row: SurveyBookRow, key: string) {
  const v = row?.[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

function getExtraMoneyRows(row: SurveyBookRow) {
  const raw = row?.extra_money_rows;
  if (!raw) return [];

  if (Array.isArray(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getOtherExclusiveUseParts(row: SurveyBookRow) {
  const raw = row?.other_exclusive_use_parts;
  if (!raw) return [];

  if (Array.isArray(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getFormattedMoneyValue(row: SurveyBookRow, key: string) {
  const raw = getValue(row, key);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ja-JP");
}

/** 旧 shared ratio を分解 */
function splitLegacyShareRatio(raw: string) {
  const text = (raw || "").trim();
  if (!text) return { before: "", after: "" };

  const normalized = text.replace(/\s+/g, "");
  const match = normalized.match(/^(.+?)分の(.+)$/);

  if (match) {
    return {
      before: match[1] ?? "",
      after: match[2] ?? "",
    };
  }

  return { before: "", after: "" };
}

/** 共有持分 前後の表示値 */
function getShareRatioBefore(row: SurveyBookRow) {
  const direct = getValue(row, "mansion_share_ratio_before");
  if (direct) return direct;

  const legacy = getValue(row, "mansion_share_ratio");
  return splitLegacyShareRatio(legacy).before;
}

function getShareRatioAfter(row: SurveyBookRow) {
  const direct = getValue(row, "mansion_share_ratio_after");
  if (direct) return direct;

  const legacy = getValue(row, "mansion_share_ratio");
  return splitLegacyShareRatio(legacy).after;
}

function getAgentTelParts(row: SurveyBookRow) {
  const area = getValue(row, "agent_tel_area");
  const local = getValue(row, "agent_tel_local");
  const line = getValue(row, "agent_tel_line");

  // 新しい3分割保存がある場合はそれを優先
  if (area || local || line) {
    return { area, local, line };
  }

  // 旧データ fallback
  const raw = getValue(row, "agent_tel").replace(/\D/g, "");

  if (raw.length === 10) {
    return {
      area: raw.slice(0, 2),
      local: raw.slice(2, 6),
      line: raw.slice(6, 10),
    };
  }

  if (raw.length === 11) {
    return {
      area: raw.slice(0, 3),
      local: raw.slice(3, 7),
      line: raw.slice(7, 11),
    };
  }

  return { area: "", local: "", line: "" };
}

/** 取引態様の丸囲み判定 */
function getTransactionCircleTargets(row: SurveyBookRow) {
  const kindRaw = getValue(row, "transaction_kind");
  const roleRaw = getValue(row, "transaction_role");

  const kind =
    kindRaw === "sale" ? "売買" :
    kindRaw === "exchange" ? "交換" :
    kindRaw;

  const role =
    roleRaw === "principal" ? "当事者" :
    roleRaw === "agent" ? "代理" :
    roleRaw === "broker" ? "媒介" :
    roleRaw;

  return { kind, role };
}


function getDisplayValue(row: SurveyBookRow, key: string) {
  switch (key) {
    case "recipient_name": {
      return getValue(row, "recipient_name");
    }

    case "doc_year":
      return getValue(row, "doc_year");

    case "doc_month":
      return getValue(row, "doc_month");

    case "doc_day":
      return getValue(row, "doc_day");

    case "seller_info_block": {
      const address = getValue(row, "seller_address");
      const name = getValue(row, "seller_name");
      if (address && name) return `${address}　${name}`;
      return address || name || "";
    }

    case "site_area_measured": {
      return getValue(row, "site_area_measured");
    }

    case "private_road_price": {
      return getFormattedMoneyValue(row, "private_road_price");
    }

    case "agent_tel_area": {
      return getAgentTelParts(row).area;
    }

    case "agent_tel_local": {
      return getAgentTelParts(row).local;
    }

    case "agent_tel_line": {
      return getAgentTelParts(row).line;
    }

    case "mansion_share_ratio_before": {
      return getShareRatioBefore(row);
    }

    case "mansion_share_ratio_after": {
      return getShareRatioAfter(row);
    }

    case "building_rights_other_detail": {
      const type = getValue(row, "building_rights_type");
      if (type !== "その他") return "";
      return getValue(row, "building_rights_other_detail");
    }

    case "non_ownership_holder_burden_amount": {
      return getFormattedMoneyValue(row, "non_ownership_holder_burden_amount");
    }

    case "repair_reserve_accumulated_amount": {
      return getFormattedMoneyValue(row, "repair_reserve_accumulated_amount");
    }
    
    case "building_arrears_amount": {
      return getFormattedMoneyValue(row, "building_arrears_amount");
    }
    
    case "unit_arrears_amount": {
      return getFormattedMoneyValue(row, "unit_arrears_amount");
    }
    
    case "monthly_management_fee": {
      return getFormattedMoneyValue(row, "monthly_management_fee");
    }
    
    case "monthly_management_fee_arrears": {
      return getFormattedMoneyValue(row, "monthly_management_fee_arrears");
    }
    default:
      return getValue(row, key);

      case "loan_amount":
  return getFormattedMoneyValue(row, "loan_amount");

case "loan_guarantee_fee":
  return getFormattedMoneyValue(row, "loan_guarantee_fee");

case "loan_admin_fee":
  return getFormattedMoneyValue(row, "loan_admin_fee");

case "cash_price":
  return getFormattedMoneyValue(row, "cash_price");

case "installment_price":
  return getFormattedMoneyValue(row, "installment_price");

case "before_delivery_payment":
  return getFormattedMoneyValue(row, "before_delivery_payment");

case "installment_amount":
  return getFormattedMoneyValue(row, "installment_amount");
  }
}

/** ===== 枠内フィット ===== */
function FitText({
  text,
  style,
  minFontSize = 8,
  maxFontSize = 14,
}: {
  text: React.ReactNode;
  style: React.CSSProperties;
  minFontSize?: number;
  maxFontSize?: number;
}) {
  const [fs, setFs] = useState(maxFontSize);
  const ref = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFs(maxFontSize);
  }, [text, maxFontSize]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cur = maxFontSize;
    let tries = 0;

    const shrink = () => {
      tries++;
      if (!el) return;

      const over =
        el.scrollHeight > el.clientHeight + 1 ||
        el.scrollWidth > el.clientWidth + 1;

      if (!over) return;
      if (cur <= minFontSize) return;

      cur = Math.max(minFontSize, cur - 1);
      setFs(cur);

      if (tries < 20) {
        requestAnimationFrame(shrink);
      }
    };

    requestAnimationFrame(shrink);
  }, [text, minFontSize, maxFontSize]);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        fontSize: fs,
        color: "#000",
        fontWeight: 400,
        fontFamily: `"Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif`,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
        lineHeight: 1.2,
      }}
    >
      {text}
    </div>
  );
}

/** ===== 1枚目の配置定義 ===== */
type FieldSpec = {
  key: string;
  top: string;
  left: string;
  width: string;
  height: string;
  maxFontSize?: number;
  minFontSize?: number;
  align?: "left" | "center" | "right";
};

const FIELDS_PAGE1: FieldSpec[] = [
  // --- 宛名・日付 ---
  { key: "recipient_name", top: "51mm", left: "40mm", width: "36mm", height: "7mm", maxFontSize: 14 },
 { key: "doc_year", top: "39.2mm", left: "148mm", width: "12mm", height: "6mm", align: "center", maxFontSize: 14 },
  { key: "doc_month", top: "39.2mm", left: "162mm", width: "8mm", height: "6mm", align: "center", maxFontSize: 14 },
  { key: "doc_day", top: "39.2mm", left: "174mm", width: "8mm", height: "6mm", align: "center", maxFontSize: 14 },
  // --- 業者（商号等） ---
  { key: "biz_name", top: "74.5mm", left: "70mm", width: "70mm", height: "6mm", maxFontSize: 13 },
  { key: "biz_representative", top: "79mm", left: "70mm", width: "70mm", height: "6mm", maxFontSize: 13 },
  { key: "biz_office_address", top: "83mm", left: "70mm", width: "70mm", height: "6mm", maxFontSize: 13 },
  { key: "biz_license_no", top: "87mm", left: "70mm", width: "70mm", height: "6mm", maxFontSize: 13 },
  { key: "biz_license_date", top: "91mm", left: "70mm", width: "70mm", height: "6mm", maxFontSize: 13 },

  // --- 宅建士 ---
  { key: "agent_name", top: "103mm", left: "110mm", width: "70mm", height: "6mm", maxFontSize: 13 },
  { key: "agent_reg_no", top: "111mm", left: "121mm", width: "45mm", height: "6mm", maxFontSize: 13 },
  { key: "agent_office", top: "119mm", left: "110mm", width: "35mm", height: "10mm", maxFontSize: 11 },
  { key: "agent_tel_area", top: "123.5mm", left: "124mm", width: "8mm", height: "6mm", align: "center", maxFontSize: 11 },
  { key: "agent_tel_local", top: "123.5mm", left: "137mm", width: "14mm", height: "6mm", align: "center", maxFontSize: 11 },
  { key: "agent_tel_line", top: "123.5mm", left: "155mm", width: "14mm", height: "6mm", align: "center", maxFontSize: 11 },
  
  // --- 建物表示 ---
  { key: "property_name", top: "159mm", left: "80mm", width: "105mm", height: "7mm", maxFontSize: 14 },
  { key: "mansion_room_no", top: "167mm", left: "41mm", width: "14mm", height: "6mm", align: "center", maxFontSize: 13 },
  { key: "mansion_tower", top: "167mm", left: "81mm", width: "12mm", height: "6mm", align: "center", maxFontSize: 13 },
  { key: "mansion_floor", top: "167mm", left: "101mm", width: "14mm", height: "6mm", align: "center", maxFontSize: 13 },
  { key: "mansion_room_no", top: "167mm", left: "121mm", width: "16mm", height: "6mm", align: "center", maxFontSize: 13 },
  { key: "address", top: "175mm", left: "80mm", width: "105mm", height: "7mm", maxFontSize: 13 },

  // --- 専有面積 ---
  { key: "mansion_exclusive_area_m2", top: "183mm", left: "89mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 13 },
  { key: "registry_floor_area_m2", top: "183mm", left: "135mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 13 },

  // --- 敷地関係 ---
  { key: "mansion_site_right_type", top: "191mm", left: "120mm", width: "105mm", height: "6mm", maxFontSize: 13 },
  { key: "mansion_site_area_m2", top: "199mm", left: "87mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 13 },
  { key: "site_area_measured", top: "207mm", left: "87mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 13 },

  /** ===== 共有持分ここだけ変更 ===== */
  { key: "mansion_share_ratio_before", top: "203mm", left: "140mm", width: "12mm", height: "6mm", align: "right", maxFontSize: 13 },
  { key: "mansion_share_ratio_after", top: "203mm", left: "165mm", width: "12mm", height: "6mm", align: "center", maxFontSize: 13 },

  // --- 売主住所氏名 ---
  { key: "seller_info_block", top: "215mm", left: "83mm", width: "132mm", height: "8mm", maxFontSize: 12 },
];

const FIELDS_PAGE2: FieldSpec[] = [
 // ===== 1 登記記録 =====
 { key: "land_rights_related", top: "60mm", left: "106mm", width: "42mm", height: "16mm", maxFontSize: 9 },
 { key: "land_other_rights", top: "60mm", left: "147mm", width: "28mm", height: "16mm", maxFontSize: 9 },

 { key: "building_rights_related", top: "76mm", left: "106mm", width: "42mm", height: "16mm", maxFontSize: 9 },
 { key: "building_other_rights", top: "76mm", left: "147mm", width: "28mm", height: "16mm", maxFontSize: 9 },

  // ===== 2 都市計画法 =====

  { key: "urban_planning_summary", top: "115mm", left: "73mm", width: "110mm", height: "30mm", maxFontSize: 10 },

  // ===== 2 建築基準法 =====
  { key: "use_district", top: "152mm", left: "45mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "use_district_summary", top: "146mm", left: "80mm", width: "86mm", height: "18mm", maxFontSize: 10 },

  { key: "other_area_district", top: "175mm", left: "45mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "other_area_district_summary", top: "170mm", left: "80mm", width: "86mm", height: "18mm", maxFontSize: 10 },

  { key: "building_coverage", top: "183.2mm", left: "148mm", width: "12mm", height: "6mm", align: "center", maxFontSize: 10 },
  { key: "floor_area_ratio", top: "191mm", left: "148mm", width: "12mm", height: "6mm", align: "center", maxFontSize: 10 },

  { key: "road_relation", top: "200mm", left: "90mm", width: "110mm", height: "8mm", maxFontSize: 10 },
  { key: "private_road_restriction", top: "208mm", left: "90mm", width: "110mm", height: "8mm", maxFontSize: 10 },
];



const FIELDS_PAGE3: FieldSpec[] = [
  // ===== 法令制限 =====
  { key: "law_name_1", top: "40mm", left: "35mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "law_summary_1", top: "40mm", left: "85mm", width: "90mm", height: "6mm", maxFontSize: 10 },

  { key: "law_name_2", top: "44mm", left: "35mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "law_summary_2", top: "44mm", left: "85mm", width: "90mm", height: "6mm", maxFontSize: 10 },

  { key: "law_name_3", top: "48mm", left: "35mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "law_summary_3", top: "48mm", left: "85mm", width: "90mm", height: "6mm", maxFontSize: 10 },

  { key: "law_name_4", top: "52mm", left: "35mm", width: "40mm", height: "6mm", maxFontSize: 10 },
  { key: "law_summary_4", top: "52mm", left: "85mm", width: "90mm", height: "6mm", maxFontSize: 10 },

  // ===== 私道負担 =====
  { key: "private_road_area", top: "80mm", left: "50mm", width: "20mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "private_road_price", top: "88mm", left: "50mm", width: "20mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "private_road_note", top: "75mm", left: "105mm", width: "80mm", height: "26mm", maxFontSize: 10 },

  // ===== インフラ =====
  { key: "infra_note", top: "154mm", left: "43mm", width: "140mm", height: "12mm", maxFontSize: 10 },

  // ===== 未完成物件 =====
  { key: "structure_summary", top: "178mm", left: "65mm", width: "120mm", height: "16mm", maxFontSize: 10 },
  { key: "road_summary", top: "198mm", left: "65mm", width: "120mm", height: "16mm", maxFontSize: 10 },
];

const FIELDS_PAGE4: FieldSpec[] = [
  { key: "building_structure", top: "31mm", left: "65mm", width: "125mm", height: "18mm", maxFontSize: 10 },
  { key: "building_finish", top: "47mm", left: "65mm", width: "125mm", height: "18mm", maxFontSize: 10 },
  { key: "equipment_installation", top: "71mm", left: "65mm", width: "56mm", height: "28mm", maxFontSize: 10 },
  { key: "equipment_structure", top: "71mm", left: "122mm", width: "68mm", height: "28mm", maxFontSize: 10 },

  { key: "building_rights_measured_area", top: "120mm", left: "35mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "building_rights_registry_area", top: "120mm", left: "80mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "building_confirmation_area", top: "120mm", left: "135mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "building_rights_other_detail", top: "127.5mm", left: "135mm", width: "30mm", height: "6mm", maxFontSize: 10 },
  { key: "non_ownership_target_area", top: "136mm", left: "105mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "non_ownership_holder_burden_amount", top: "151.5mm", left: "110mm", width: "18mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "common_area_rules", top: "171mm", left: "30mm", width: "132mm", height: "20mm", maxFontSize: 10 },
  { key: "exclusive_use_restrictions", top: "203mm", left: "30mm", width: "132mm", height: "22mm", maxFontSize: 10 },
];
const FIELDS_PAGE5: FieldSpec[] = [
  { key: "parking_user_1", top: "32.5mm", left: "95mm", width: "45mm", height: "5mm", maxFontSize: 9 },
  { key: "parking_user_2", top: "32.5mm", left: "155mm", width: "45mm", height: "5mm", maxFontSize: 9 },

  { key: "parking_fee_exists_1", top: "36.5mm", left: "100mm", width: "20mm", height: "5mm", maxFontSize: 9 },
  { key: "parking_fee_exists_2", top: "36.5mm", left: "160mm", width: "20mm", height: "5mm", maxFontSize: 9 },

  { key: "parking_fee_recipient_1", top: "40.5mm", left: "95mm", width: "45mm", height: "5mm", maxFontSize: 9 },
  { key: "parking_fee_recipient_2", top: "40.5mm", left: "155mm", width: "45mm", height: "5mm", maxFontSize: 9 },

  { key: "fee_reduction_rules", top: "95mm", left: "27mm", width: "158mm", height: "24mm", maxFontSize: 10 },

  { key: "repair_reserve_rules", top: "130mm", left: "78mm", width: "115mm", height: "6mm", maxFontSize: 10 },

  { key: "repair_reserve_accumulated_amount", top: "139.5mm", left: "85mm", width: "24mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "building_arrears_amount", top: "147.5mm", left: "85mm", width: "24mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "unit_arrears_amount", top: "155.5mm", left: "85mm", width: "24mm", height: "6mm", align: "right", maxFontSize: 10 },

  { key: "monthly_management_fee", top: "179.5mm", left: "70mm", width: "24mm", height: "6mm", align: "right", maxFontSize: 10 },
  { key: "monthly_management_fee_arrears", top: "183.5mm", left: "70mm", width: "24mm", height: "6mm", align: "right", maxFontSize: 10 },

  { key: "management_company_name", top: "202mm", left: "82mm", width: "112mm", height: "12mm", maxFontSize: 10 },
  { key: "management_company_address", top: "217.5mm", left: "80mm", width: "112mm", height: "12mm", maxFontSize: 10 },

];

const FIELDS_PAGE6: FieldSpec[] = [
  { key: "maintenance_common", top: "35mm", left: "50mm", width: "132mm", height: "20mm", maxFontSize: 10 },
  { key: "maintenance_private", top: "51mm", left: "50mm", width: "132mm", height: "20mm", maxFontSize: 10 },

  { key: "page6_other", top: "78mm", left: "28mm", width: "158mm", height: "18mm", maxFontSize: 10 },

  { key: "building_survey_summary", top: "112mm", left: "107mm", width: "78mm", height: "18mm", maxFontSize: 10 },

  { key: "seismic_doc_name", top: "255mm", left: "68mm", width: "44mm", height: "6mm", maxFontSize: 9 },
];

const FIELDS_PAGE7: FieldSpec[] = [
  { key: "page7_notes", top: "32mm", left: "40mm", width: "158mm", height: "14mm", maxFontSize: 10 },

  { key: "hazard_map_location", top: "140mm", left: "85mm", width: "100mm", height: "22mm", maxFontSize: 10 },

  { key: "asbestos_record_content", top: "185mm", left: "107mm", width: "78mm", height: "20mm", maxFontSize: 10 },

  { key: "seismic_diagnosis_content", top: "233mm", left: "110mm", width: "78mm", height: "20mm", maxFontSize: 10 },
];

const FIELDS_PAGE8: FieldSpec[] = [
  { key: "contract_cancellation_terms", top: "68mm", left: "27mm", width: "158mm", height: "24mm", maxFontSize: 10 },
  { key: "penalty_terms", top: "104mm", left: "27mm", width: "158mm", height: "24mm", maxFontSize: 10 },

  { key: "incomplete_property_preservation_institution", top: "155mm", left: "58mm", width: "125mm", height: "10mm", maxFontSize: 12 },
  { key: "completed_property_preservation_institution", top: "191mm", left: "58mm", width: "125mm", height: "10mm", maxFontSize: 12},

  { key: "deposit_preservation_institution", top: "222mm", left: "77mm", width: "105mm", height: "8mm", maxFontSize: 12 },
];

const FIELDS_PAGE9: FieldSpec[] = [
  // 6 金銭貸借のあっせん（文字系だけ）
  { key: "loan_bank_name", top: "36.5mm", left: "110mm", width: "100mm", height: "4mm", maxFontSize: 9 },
  { key: "loan_period", top: "44.5mm", left: "110mm", width: "100mm", height: "4mm", maxFontSize: 9 },
  { key: "loan_interest_rate", top: "48.5mm", left: "110mm", width: "100mm", height: "4mm", maxFontSize: 9 },
  { key: "loan_repayment_method", top: "52.5mm", left: "110mm", width: "100mm", height: "4mm", maxFontSize: 9 },
  { key: "loan_other", top: "65mm", left: "110mm", width: "110mm", height: "4mm", maxFontSize: 9 },
  { key: "loan_failure_measures", top: "71mm", left: "78mm", width: "108mm", height: "14mm", maxFontSize: 9 },

  // 7 担保責任
  { key: "liability_measures_content", top: "110mm", left: "74mm", width: "108mm", height: "12mm", maxFontSize: 9 },

  // 8 割賦販売（文字系だけ）
  { key: "before_delivery_payment_timing", top: "155mm", left: "140mm", width: "24mm", height: "5mm", maxFontSize: 8 },
  { key: "before_delivery_payment_method", top: "155mm", left: "168mm", width: "18mm", height: "5mm", maxFontSize: 8 },

  { key: "installment_amount_timing", top: "163mm", left: "140mm", width: "24mm", height: "5mm", maxFontSize: 8 },
  { key: "installment_amount_method", top: "163mm", left: "168mm", width: "18mm", height: "5mm", maxFontSize: 8 },
];

const FIELDS_PAGE10: FieldSpec[] = [
  // (1) 非会員
  {
    key: "deposit_office_and_address",
    top: "43mm",
    left: "69mm",
    width: "118mm",
    height: "12mm",
    maxFontSize: 10,
  },

  // (2) 会員
  {
    key: "association_name",
    top: "64mm",
    left: "74mm",
    width: "108mm",
    height: "5mm",
    maxFontSize: 10,
  },
  {
    key: "association_address",
    top: "72mm",
    left: "74mm",
    width: "108mm",
    height: "5mm",
    maxFontSize: 10,
  },
  {
    key: "association_office_address",
    top: "80mm",
    left: "74mm",
    width: "108mm",
    height: "5mm",
    maxFontSize: 10,
  },
  {
    key: "association_deposit_office_and_address",
    top: "87mm",
    left: "74mm",
    width: "108mm",
    height: "10mm",
    maxFontSize: 10,
  },
];

function renderTransactionCircles(row: SurveyBookRow) {
  const { kind, role } = getTransactionCircleTargets(row);

  const circles: React.ReactNode[] = [];

  if (kind === "売買") {
    circles.push(
      <div
        key="circle-kind-sale"
        style={{
          position: "absolute",
          top: "139mm",
          left: "97.8mm",
          width: "12mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (kind === "交換") {
    circles.push(
      <div
        key="circle-kind-exchange"
        style={{
          position: "absolute",
          top: "139mm",
          left: "133.8mm",
          width: "12mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (role === "当事者") {
    circles.push(
      <div
        key="circle-role-principal"
        style={{
          position: "absolute",
          top: "143mm",
          left: "88.5mm",
          width: "16mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (role === "代理") {
    circles.push(
      <div
        key="circle-role-agent"
        style={{
          position: "absolute",
          top: "143mm",
          left: "113.3mm",
          width: "12mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (role === "媒介") {
    circles.push(
      <div
        key="circle-role-broker"
        style={{
          position: "absolute",
          top: "143mm",
          left: "139.8mm",
          width: "12mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}




function getUrbanPlanningAreaType(row: SurveyBookRow) {
  const raw = getValue(row, "urban_planning_area_type");

  if (raw === "urbanized") return "市街化区域";
  if (raw === "urbanization_control") return "市街化調整区域";
  if (raw === "non_line") return "非線引区域";
  if (raw === "quasi_urban_planning") return "準都市計画区域";
  if (raw === "other") return "その他";

  return raw;
}

function renderUrbanPlanningAreaType(row: SurveyBookRow) {
  const selected = getUrbanPlanningAreaType(row);

  const circles: React.ReactNode[] = [];

  if (selected === "市街化区域") {
    circles.push(
      <div
        key="circle-urbanized"
        style={{
          position: "absolute",
          top: "114mm",
          left: "31mm",
          width: "28mm",
          height: "5mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (selected === "市街化調整区域") {
    circles.push(
      <div
        key="circle-urbanization-control"
        style={{
          position: "absolute",
          top: "119mm",
          left: "31mm",
          width: "28mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (selected === "非線引区域") {
    circles.push(
      <div
        key="circle-non-line"
        style={{
          position: "absolute",
          top: "123mm",
          left: "31mm",
          width: "28mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (selected === "準都市計画区域") {
    circles.push(
      <div
        key="circle-quasi-urban-planning"
        style={{
          position: "absolute",
          top: "127mm",
          left: "31mm",
          width: "28mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (selected === "その他") {
    circles.push(
      <div
        key="circle-other"
        style={{
          position: "absolute",
          top: "131mm",
          left: "31mm",
          width: "28mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}


function renderPrivateRoadBurdenCircles(row: SurveyBookRow) {
  const value = getValue(row, "private_road_burden_exists");
  const circles: React.ReactNode[] = [];

  if (value === "有") {
    circles.push(
      <div
        key="circle-private-road-burden-yes"
        style={{
          position: "absolute",
          top: "67.5mm",
          left: "58mm",
          width: "8mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "無") {
    circles.push(
      <div
        key="circle-private-road-burden-no"
        style={{
          position: "absolute",
          top: "67.5mm",
          left: "79mm",
          width: "8mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderWaterSupplyTypeCircles(row: SurveyBookRow) {
  const value = getValue(row, "water_supply_type");
  const circles: React.ReactNode[] = [];

  if (value === "公営") {
    circles.push(
      <div
        key="circle-water-public"
        style={{
          position: "absolute",
          top: "119mm",
          left: "38.5mm",
          width: "9mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "私営") {
    circles.push(
      <div
        key="circle-water-private"
        style={{
          position: "absolute",
          top: "119mm",
          left: "50mm",
          width: "9mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "井戸") {
    circles.push(
      <div
        key="circle-water-well"
        style={{
          position: "absolute",
          top: "119mm",
          left: "61mm",
          width: "9mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderWaterFacilityScheduleTypeCircles(row: SurveyBookRow) {
  const value = getValue(row, "water_facility_schedule_type");
  const circles: React.ReactNode[] = [];

  if (value === "公営") {
    circles.push(
      <div
        key="circle-water-schedule-public"
        style={{
          position: "absolute",
          top: "119mm",
          left: "106.5mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "私営") {
    circles.push(
      <div
        key="circle-water-schedule-private"
        style={{
          position: "absolute",
          top: "119mm",
          left: "112.5mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "井戸") {
    circles.push(
      <div
        key="circle-water-schedule-well"
        style={{
          position: "absolute",
          top: "119mm",
          left: "118mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderGasTypeCircles(row: SurveyBookRow) {
  const value = getValue(row, "gas_type");
  const circles: React.ReactNode[] = [];

  if (value === "都市") {
    circles.push(
      <div
        key="circle-gas-city"
        style={{
          position: "absolute",
          top: "135mm",
          left: "38.5mm",
          width: "9mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "プロパン") {
    circles.push(
      <div
        key="circle-gas-propane"
        style={{
          position: "absolute",
          top: "135mm",
          left: "50mm",
          width: "16mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderGasFacilityScheduleTypeCircles(row: SurveyBookRow) {
  const value = getValue(row, "gas_facility_schedule_type");
  const circles: React.ReactNode[] = [];

  if (value === "都市") {
    circles.push(
      <div
        key="circle-gas-schedule-city"
        style={{
          position: "absolute",
          top: "135mm",
          left: "106.5mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "プロパン") {
    circles.push(
      <div
        key="circle-gas-schedule-propane"
        style={{
          position: "absolute",
          top: "135mm",
          left: "113mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}


function renderImmediateFacilityTexts(row: SurveyBookRow) {
  const electric = getValue(row, "electric_supply_available");
  const drainage = getValue(row, "drainage_supply_available");

  return (
    <>
      {electric && (
        <FitText
          text={electric}
          maxFontSize={10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: "126mm",
            left: "35mm",
            width: "22mm",
            height: "6mm",
            textAlign: "center",
          }}
        />
      )}

      {drainage && (
        <FitText
          text={drainage}
          maxFontSize={10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: "142mm",
            left: "35mm",
            width: "22mm",
            height: "6mm",
            textAlign: "center",
          }}
        />
      )}
    </>
  );
}

function renderFacilityScheduleDates(row: SurveyBookRow) {
  const defs = [
    { prefix: "water", top: "119.5mm" },
    { prefix: "electric", top: "127.5mm" },
    { prefix: "gas", top: "135.5mm" },
    { prefix: "drainage", top: "143.5mm" },
  ] as const;

  return (
    <>
      {defs.map((d) => {
        const year = getValue(row, `${d.prefix}_facility_schedule_year`);
        const month = getValue(row, `${d.prefix}_facility_schedule_month`);
        const day = getValue(row, `${d.prefix}_facility_schedule_day`);

        return (
          <React.Fragment key={d.prefix}>
            {year && (
              <FitText
                text={year}
                maxFontSize={10}
                minFontSize={8}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: "72mm",
                  width: "10mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}

            {month && (
              <FitText
                text={month}
                maxFontSize={10}
                minFontSize={8}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: "85mm",
                  width: "6mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}

            {day && (
              <FitText
                text={day}
                maxFontSize={10}
                minFontSize={8}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: "95mm",
                  width: "6mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function renderDrainageFacilityScheduleDetail(row: SurveyBookRow) {
  const detail = getValue(row, "drainage_facility_schedule_detail");
  if (!detail) return null;

  return (
    <FitText
      text={detail}
      maxFontSize={9}
      minFontSize={3}
      style={{
        position: "absolute",
        top: "143.5mm",
        left: "107mm",
        width: "14mm",
        height: "5mm",
        textAlign: "center",
      }}
    />
  );
}

function renderSpecialBurdenCircles(row: SurveyBookRow) {
  const defs = [
    {
      key: "water_special_burden_exists",
      yesTop: "119mm",
      yesLeft: "131.5mm",
      noTop: "119mm",
      noLeft: "139.5mm",
      prefix: "water",
    },
    {
      key: "electric_special_burden_exists",
      yesTop: "127mm",
      yesLeft: "131.5mm",
      noTop: "127mm",
      noLeft: "139.5mm",
      prefix: "electric",
    },
    {
      key: "gas_special_burden_exists",
      yesTop: "135mm",
      yesLeft: "131.5mm",
      noTop: "135mm",
      noLeft: "139.5mm",
      prefix: "gas",
    },
    {
      key: "drainage_special_burden_exists",
      yesTop: "143mm",
      yesLeft: "131.5mm",
      noTop: "143mm",
      noLeft: "139.5mm",
      prefix: "drainage",
    },
  ] as const;

  const circles: React.ReactNode[] = [];

  defs.forEach((d) => {
    const value = getValue(row, d.key);

    if (value === "有") {
      circles.push(
        <div
          key={`circle-${d.prefix}-special-burden-yes`}
          style={{
            position: "absolute",
            top: d.yesTop,
            left: d.yesLeft,
            width: "5mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }

    if (value === "無") {
      circles.push(
        <div
          key={`circle-${d.prefix}-special-burden-no`}
          style={{
            position: "absolute",
            top: d.noTop,
            left: d.noLeft,
            width: "5mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }
  });

  return circles;
}

function renderBuildingRightsTypeCircles(row: SurveyBookRow) {
  const value = getValue(row, "building_rights_type");
  const circles: React.ReactNode[] = [];

  if (value === "所有権") {
    circles.push(
      <div
        key="circle-building-rights-ownership"
        style={{
          position: "absolute",
          top: "127mm",
          left: "51.5mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "地上権") {
    circles.push(
      <div
        key="circle-building-rights-superficies"
        style={{
          position: "absolute",
          top: "127mm",
          left: "67mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "賃借権") {
    circles.push(
      <div
        key="circle-building-rights-lease"
        style={{
          position: "absolute",
          top: "127mm",
          left: "82mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "その他") {
    circles.push(
      <div
        key="circle-building-rights-other"
        style={{
          position: "absolute",
          top: "127mm",
          left: "97.5mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderNonOwnershipTargetAreaTypeCircles(row: SurveyBookRow) {
  const rightsType = getValue(row, "building_rights_type");
  if (!rightsType || rightsType === "所有権") return null;

  const value = getValue(row, "non_ownership_target_area_type");
  const circles: React.ReactNode[] = [];

  if (value === "登記簿") {
    circles.push(
      <div
        key="circle-non-ownership-target-area-registry"
        style={{
          position: "absolute",
          top: "135mm",
          left: "152.5mm",
          width: "13mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "実測") {
    circles.push(
      <div
        key="circle-non-ownership-target-area-measured"
        style={{
          position: "absolute",
          top: "135mm",
          left: "168mm",
          width: "9mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderNonOwnershipPeriod(row: SurveyBookRow) {
  const rightsType = getValue(row, "building_rights_type");
  if (!rightsType || rightsType === "所有権") return null;

  const year = getValue(row, "non_ownership_period_year");
  const month = getValue(row, "non_ownership_period_month");
  const day = getValue(row, "non_ownership_period_day");

  return (
    <>
      {year && (
        <FitText
          text={year}
          maxFontSize={10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: "143.5mm",
            left: "125mm",
            width: "10mm",
            height: "5mm",
            textAlign: "center",
          }}
        />
      )}

      {month && (
        <FitText
          text={month}
          maxFontSize={10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: "143.5mm",
            left: "141mm",
            width: "6mm",
            height: "5mm",
            textAlign: "center",
          }}
        />
      )}

      {day && (
        <FitText
          text={day}
          maxFontSize={10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: "143.5mm",
            left: "153mm",
            width: "6mm",
            height: "5mm",
            textAlign: "center",
          }}
        />
      )}
    </>
  );
}

function renderSpecialBurdenAmounts(row: SurveyBookRow) {
  const defs = [
    { key: "water_special_burden_amount", top: "119.5mm" },
    { key: "electric_special_burden_amount", top: "127.5mm" },
    { key: "gas_special_burden_amount", top: "135.5mm" },
    { key: "drainage_special_burden_amount", top: "143.5mm" },
  ];

  return (
    <>
      {defs.map((d) => {
        const val = getFormattedMoneyValue(row, d.key);
        if (!val) return null;

        return (
          <FitText
            key={d.key}
            text={val}
            maxFontSize={10}
            minFontSize={8}
            style={{
              position: "absolute",
              top: d.top,
              left: "135mm",
              width: "25mm",
              height: "6mm",
              textAlign: "right",
            }}
          />
        );
      })}
    </>
  );
}

function renderOtherExclusiveUseParts(row: SurveyBookRow) {
  const rows = getOtherExclusiveUseParts(row).slice(0, 8);
  const startTop = 48.2; // mm
  const rowHeight = 4; // mm

  return rows.map((item: any, index: number) => {
    const top = `${startTop + rowHeight * index}mm`;

    return (
      <React.Fragment key={`other-exclusive-${index}`}>
        {item?.part ? (
          <FitText
            text={String(item.part)}
            maxFontSize={9}
            minFontSize={7}
            style={{
              position: "absolute",
              top,
              left: "45mm",
              width: "37mm",
              height: "5mm",
            }}
          />
        ) : null}

        {item?.fee_exists ? (
          <FitText
            text={String(item.fee_exists)}
            maxFontSize={9}
            minFontSize={7}
            style={{
              position: "absolute",
              top,
              left: "92mm",
              width: "20mm",
              height: "5mm",
              textAlign: "center",
            }}
          />
        ) : null}

        {item?.fee_recipient ? (
          <FitText
            text={String(item.fee_recipient)}
            maxFontSize={9}
            minFontSize={7}
            style={{
              position: "absolute",
              top,
              left: "155mm",
              width: "45mm",
              height: "5mm",
            }}
          />
        ) : null}
      </React.Fragment>
    );
  });
}

function renderPage5Dates(row: SurveyBookRow) {
  const defs = [
    {
      prefix: "repair_reserve_accumulated",
      top: "139.5mm",
      yearLeft: "130mm",
      monthLeft: "147mm",
      dayLeft: "160mm",
    },
    {
      prefix: "building_arrears",
      top: "147.5mm",
      yearLeft: "130mm",
      monthLeft: "147mm",
      dayLeft: "160mm",
    },
    {
      prefix: "unit_arrears",
      top: "155.5mm",
      yearLeft: "130mm",
      monthLeft: "147mm",
      dayLeft: "160mm",
    },
    {
      prefix: "monthly_management_fee",
      top: "179.5mm",
      yearLeft: "125mm",
      monthLeft: "140mm",
      dayLeft: "155mm",
    },
    {
      prefix: "monthly_management_fee_arrears",
      top: "183.5mm",
      yearLeft: "125mm",
      monthLeft: "140mm",
      dayLeft: "155mm",
    },
  ] as const;

  return (
    <>
      {defs.map((d) => {
        const year = getValue(row, `${d.prefix}_year`);
        const month = getValue(row, `${d.prefix}_month`);
        const day = getValue(row, `${d.prefix}_day`);

        return (
          <React.Fragment key={d.prefix}>
            {year && (
              <FitText
                text={year}
                maxFontSize={9}
                minFontSize={7}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: d.yearLeft,
                  width: "10mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}

            {month && (
              <FitText
                text={month}
                maxFontSize={9}
                minFontSize={7}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: d.monthLeft,
                  width: "6mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}

            {day && (
              <FitText
                text={day}
                maxFontSize={9}
                minFontSize={7}
                style={{
                  position: "absolute",
                  top: d.top,
                  left: d.dayLeft,
                  width: "6mm",
                  height: "5mm",
                  textAlign: "center",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function renderPage6YesNoCircles(row: SurveyBookRow) {
  const defs = [
    {
      key: "building_survey_exists",
      yesTop: "103.5mm",
      yesLeft: "123.5mm",
      noTop: "103.5mm",
      noLeft: "164mm",
      width: "6mm",
    },
    {
      key: "confirmation_docs_exists",
      yesTop: "151mm",
      yesLeft: "143mm",
      noTop: "151mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "inspection_cert_exists",
      yesTop: "159mm",
      yesLeft: "143mm",
      noTop: "159mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "renovation_confirmation_docs_exists",
      yesTop: "175mm",
      yesLeft: "143mm",
      noTop: "175mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "renovation_inspection_cert_exists",
      yesTop: "187mm",
      yesLeft: "143mm",
      noTop: "187mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "survey_report_exists",
      yesTop: "202.5mm",
      yesLeft: "143mm",
      noTop: "202.5mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "performance_eval_exists",
      yesTop: "218.5mm",
      yesLeft: "143mm",
      noTop: "218.5mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "periodic_report_exists",
      yesTop: "234.5mm",
      yesLeft: "143mm",
      noTop: "234.5mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
    {
      key: "seismic_doc_exists",
      yesTop: "252.5mm",
      yesLeft: "143mm",
      noTop: "252.5mm",
      noLeft: "171.5mm",
      width: "6mm",
    },
  ] as const;

  const circles: React.ReactNode[] = [];

  defs.forEach((d) => {
    const value = getValue(row, d.key);

    if (value === "有") {
      circles.push(
        <div
          key={`${d.key}-yes`}
          style={{
            position: "absolute",
            top: d.yesTop,
            left: d.yesLeft,
            width: d.width,
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }

    if (value === "無") {
      circles.push(
        <div
          key={`${d.key}-no`}
          style={{
            position: "absolute",
            top: d.noTop,
            left: d.noLeft,
            width: d.width,
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }
  });

  return circles;
}

function renderPage7Circles(row: SurveyBookRow) {
  const defs = [
    {
      key: "developed_disaster_area",
      inTop: "59.5mm",
      inLeft: "46mm",
      outTop: "59.5mm",
      outLeft: "128.5mm",
      width: "35mm",
    },
    {
      key: "sediment_disaster_area",
      inTop: "79.5mm",
      inLeft: "46mm",
      outTop: "79.5mm",
      outLeft: "128.5mm",
      width: "35mm",
    },
    {
      key: "tsunami_disaster_area",
      inTop: "99.3mm",
      inLeft: "46mm",
      outTop: "99.3mm",
      outLeft: "128.5mm",
      width: "35mm",
    },
    {
      key: "hazard_flood_exists",
      yesTop: "131mm",
      yesLeft: "87.5mm",
      noTop: "131mm",
      noLeft: "105mm",
      width: "6mm",
    },
    {
      key: "hazard_inland_flood_exists",
      yesTop: "131mm",
      yesLeft: "123mm",
      noTop: "131mm",
      noLeft: "141mm",
      width: "6mm",
    },
    {
      key: "hazard_tide_exists",
      yesTop: "131mm",
      yesLeft: "160mm",
      noTop: "131mm",
      noLeft: "176.5mm",
      width: "6mm",
    },
    {
      key: "asbestos_record_exists",
      yesTop: "174.7mm",
      yesLeft: "120.2mm",
      noTop: "174.7mm",
      noLeft: "163mm",
      width: "6mm",
    },
    {
      key: "seismic_diagnosis_exists",
      yesTop: "222.5mm",
      yesLeft: "123mm",
      noTop: "222.5mm",
      noLeft: "164mm",
      width: "6mm",
    },
  ] as const;

  const circles: React.ReactNode[] = [];

  defs.forEach((d) => {
    const value = getValue(row, d.key);

    if ("inLeft" in d) {
      if (value === "区域内") {
        circles.push(
          <div
            key={`${d.key}-in`}
            style={{
              position: "absolute",
              top: d.inTop,
              left: d.inLeft,
              width: d.width,
              height: "4mm",
              border: "1.4px solid #000",
              borderRadius: "9999px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      }

      if (value === "区域外") {
        circles.push(
          <div
            key={`${d.key}-out`}
            style={{
              position: "absolute",
              top: d.outTop,
              left: d.outLeft,
              width: d.width,
              height: "4mm",
              border: "1.4px solid #000",
              borderRadius: "9999px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      }

      return;
    }

    if (value === "有") {
      circles.push(
        <div
          key={`${d.key}-yes`}
          style={{
            position: "absolute",
            top: d.yesTop,
            left: d.yesLeft,
            width: d.width,
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }

    if (value === "無") {
      circles.push(
        <div
          key={`${d.key}-no`}
          style={{
            position: "absolute",
            top: d.noTop,
            left: d.noLeft,
            width: d.width,
            height: "4mm",
            border: "1.4px solid #000",
            borderRadius: "9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      );
    }
  });

  return circles;
}

function renderPage7ContinuationCircles(row: SurveyBookRow) {
  const defs = [
    {
      key: "new_house_performance_eval_delivery_exists",
      yesTop: "31.5mm",
      yesLeft: "137.5mm",
      noTop: "31.5mm",
      noLeft: "169mm",
      width: "6mm",
      type: "yes_no",
    },
    {
      key: "design_housing_performance_eval_exists",
      yesTop: "39.5mm",
      yesLeft: "139.5mm",
      width: "35.5mm",
      type: "yes_only",
    },
    {
      key: "construction_housing_performance_eval_exists",
      yesTop: "47.5mm",
      yesLeft: "139.5mm",
      width: "35.5mm",
      type: "yes_only",
    },
  ] as const;

  const circles: React.ReactNode[] = [];

  defs.forEach((d) => {
    const value = getValue(row, d.key);

    if (
      (d.key === "design_housing_performance_eval_exists" ||
        d.key === "construction_housing_performance_eval_exists") &&
      getValue(row, "new_house_performance_eval_delivery_exists") !== "有"
    ) {
      return;
    }

    if (d.type === "yes_no") {
      if (value === "有") {
        circles.push(
          <div
            key={`${d.key}-yes`}
            style={{
              position: "absolute",
              top: d.yesTop,
              left: d.yesLeft,
              width: d.width,
              height: "4mm",
              border: "1.4px solid #000",
              borderRadius: "9999px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      }

      if (value === "無") {
        circles.push(
          <div
            key={`${d.key}-no`}
            style={{
              position: "absolute",
              top: d.noTop,
              left: d.noLeft,
              width: d.width,
              height: "4mm",
              border: "1.4px solid #000",
              borderRadius: "9999px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      }

      return;
    }

    if (d.type === "yes_only") {
      if (value === "有") {
        circles.push(
          <div
            key={`${d.key}-yes`}
            style={{
              position: "absolute",
              top: d.yesTop,
              left: d.yesLeft,
              width: d.width,
              height: "4mm",
              border: "1.4px solid #000",
              borderRadius: "9999px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      }
    }
  });

  return circles;
}

function renderPage8ExtraMoneyRows(row: SurveyBookRow) {
  const rows = getExtraMoneyRows(row).slice(0, 4);
  const startTop = 40.3;
  const rowHeight = 4;

  return rows.map((item: any, index: number) => {
    const top = `${startTop + rowHeight * index}mm`;

    const amountRaw = String(item?.amount ?? "");
    const digits = amountRaw.replace(/\D/g, "");
    const amount = digits ? Number(digits).toLocaleString("ja-JP") : "";
    const purpose = String(item?.purpose ?? "");

    return (
      <React.Fragment key={`page8-money-${index}`}>
        {amount && (
          <FitText
            text={amount}
            maxFontSize={9}
            minFontSize={7}
            style={{
              position: "absolute",
              top,
              left: "25mm",
              width: "34mm",
              height: "4mm",
              textAlign: "right",
            }}
          />
        )}

        {purpose && (
          <FitText
            text={purpose}
            maxFontSize={9}
            minFontSize={7}
            style={{
              position: "absolute",
              top,
              left: "100mm",
              width: "104mm",
              height: "4mm",
            }}
          />
        )}
      </React.Fragment>
    );
  });
}

function renderPage8MethodCircles(row: SurveyBookRow) {
  const circles: React.ReactNode[] = [];

  const incomplete = getValue(row, "incomplete_property_preservation_method");
  const completed = getValue(row, "completed_property_preservation_method");
  const deposit = getValue(row, "deposit_preservation_needed");

  // 4(1) 未完成物件
  if (incomplete === "保証委託契約") {
    circles.push(
      <div
        key="incomplete-guarantee-consignment"
        style={{
          position: "absolute",
          top: "143mm",
          left: "55mm",
          width: "70mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (incomplete === "保証保険契約") {
    circles.push(
      <React.Fragment key="incomplete-guarantee-insurance">
        {/* 上：右側が開いた横長半円 */}
        <div
          style={{
            position: "absolute",
            top: "143mm",
            left: "127mm",
            width: "58mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderRight: "none",
            borderRadius: "9999px 0 0 9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
  
        {/* 下：左側が開いた横長半円 */}
        <div
          style={{
            position: "absolute",
            top: "147mm",
            left: "57mm",
            width: "9mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderLeft: "none",
            borderRadius: "0 9999px 9999px 0",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      </React.Fragment>
    );
  }

  // 4(2) 完成物件
  if (completed === "保証委託契約") {
    circles.push(
      <div
        key="completed-guarantee-consignment"
        style={{
          position: "absolute",
          top: "178.5mm",
          left: "55mm",
          width: "70mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (completed === "保証保険契約") {
    circles.push(
      <React.Fragment key="completed-guarantee-insurance">
        {/* 上：右側が開いた横長半円 */}
        <div
          style={{
            position: "absolute",
            top: "178.5mm",
            left: "127mm",
            width: "58mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderRight: "none",
            borderRadius: "9999px 0 0 9999px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
  
        {/* 下：左側が開いた横長半円 */}
        <div
          style={{
            position: "absolute",
            top: "182.7mm",
            left: "57mm",
            width: "9mm",
            height: "4mm",
            border: "1.4px solid #000",
            borderLeft: "none",
            borderRadius: "0 9999px 9999px 0",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      </React.Fragment>
    );
  }

  if (completed === "手付金等寄託契約及び質権設定契約") {
    circles.push(
      <div
        key="completed-deposit-pledge"
        style={{
          position: "absolute",
          top: "182.5mm",
          left: "70mm",
          width: "105mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  // 5 講ずる / 講じない
  if (deposit === "講ずる") {
    circles.push(
      <div
        key="deposit-preservation-yes"
        style={{
          position: "absolute",
          top: "214.5mm",
          left: "90mm",
          width: "23mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (deposit === "講じない") {
    circles.push(
      <div
        key="deposit-preservation-no"
        style={{
          position: "absolute",
          top: "214.5mm",
          left: "124.5mm",
          width: "31mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderPage9Circles(row: SurveyBookRow) {
  const circles: React.ReactNode[] = [];

  const loan = getValue(row, "loan_mediation_exists");
  const liability = getValue(row, "liability_measures_exists");

  // 6 金銭貸借のあっせん 有 / 無
  if (loan === "有") {
    circles.push(
      <div
        key="loan-mediation-yes"
        style={{
          position: "absolute",
          top: "31.5mm",
          left: "114mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (loan === "無") {
    circles.push(
      <div
        key="loan-mediation-no"
        style={{
          position: "absolute",
          top: "31.5mm",
          left: "144.5mm",
          width: "6mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  // 7 担保責任 講ずる / 講じない
  if (liability === "講ずる") {
    circles.push(
      <div
        key="liability-yes"
        style={{
          position: "absolute",
          top: "99mm",
          left: "90mm",
          width: "22mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (liability === "講じない") {
    circles.push(
      <div
        key="liability-no"
        style={{
          position: "absolute",
          top: "99mm",
          left: "124.5mm",
          width: "31.5mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function renderPage9MoneyFields(row: SurveyBookRow) {
  const items = [
    // 6 金銭貸借のあっせん
    { key: "loan_amount", top: "40mm", left: "0mm", width: "120mm", height: "4mm" },
    { key: "loan_guarantee_fee", top: "56mm", left: "0mm", width: "120mm", height: "4mm" },
    { key: "loan_admin_fee", top: "60mm", left: "0mm", width: "120mm", height: "4mm" },

    // 8 割賦販売
    { key: "cash_price", top: "135.5mm", left: "-10mm", width: "180mm", height: "5mm" },
    { key: "installment_price", top: "143.5mm", left: "-10mm", width: "180mm", height: "5mm" },

    { key: "before_delivery_payment", top: "155.5mm", left: "65mm", width: "50mm", height: "5mm" },
    { key: "installment_amount", top: "163.5mm", left: "65mm", width: "50mm", height: "5mm" },
  ] as const;

  return items.map((f) => {
    const text = getDisplayValue(row, f.key);
    if (!text) return null;

    return (
      <FitText
        key={`p9-money-${f.key}`}
        text={text}
        maxFontSize={10}
        minFontSize={8}
        style={{
          position: "absolute",
          top: f.top,
          left: f.left,
          width: f.width,
          height: f.height,
          textAlign: "right",
        }}
      />
    );
  });
}

function renderSepticTankRequiredCircles(row: SurveyBookRow) {
  const value = getValue(row, "septic_tank_required");
  const circles: React.ReactNode[] = [];

  if (value === "有") {
    circles.push(
      <div
        key="circle-septic-required-yes"
        style={{
          position: "absolute",
          top: "147mm",
          left: "113mm",
          width: "5mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  if (value === "無") {
    circles.push(
      <div
        key="circle-septic-required-no"
        style={{
          position: "absolute",
          top: "147mm",
          left: "120.5mm",
          width: "5mm",
          height: "4mm",
          border: "1.4px solid #000",
          borderRadius: "9999px",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
    );
  }

  return circles;
}

function splitAddressLines(address: string, max = 11) {
  const text = (address || "").trim();
  if (!text) return ["", "", ""];

  const normalized = text.replace(/\s+/g, "");
  const lines: string[] = [];

  for (let i = 0; i < normalized.length; i += max) {
    lines.push(normalized.slice(i, i + max));
  }

  return [
    lines[0] ?? "",
    lines[1] ?? "",
    lines.slice(2).join("") ?? "",
  ];
}

function OwnerBlock({
  name,
  address,
  top,
}: {
  name: string;
  address: string;
  top: string;
}) {
  const [line1, line2, line3] = splitAddressLines(address, 11);

  return (
    <>
      {/* 名前 */}
      <FitText
        text={name}
        maxFontSize={11}
        minFontSize={8}
        style={{
          position: "absolute",
          top: `calc(${top} - 1mm)`, // ←ここで1mm上げる
          left: "73mm",
          width: "42mm",
          height: "5mm",
          textAlign: "left",
        }}
      />

      {/* 住所1行目 */}
      <FitText
        text={line1}
        maxFontSize={9}
        minFontSize={8}
        style={{
          position: "absolute",
          top: `calc(${top} + 2.8mm)`, // ←1mm上げてる
          left: "66mm",
          width: "58mm",
          height: "3.3mm",
          textAlign: "left",
        }}
      />

      {/* 住所2行目 */}
      <FitText
        text={line2}
        maxFontSize={9}
        minFontSize={8}
        style={{
          position: "absolute",
          top: `calc(${top} + 6.4mm)`, // ←1mm上げてる
          left: "66mm",
          width: "58mm",
          height: "3.3mm",
          textAlign: "left",
        }}
      />

      {/* 住所3行目 */}
      <FitText
        text={line3}
        maxFontSize={9}
        minFontSize={8}
        style={{
          position: "absolute",
          top: `calc(${top} + 10mm)`, // ←1mm上げてる
          left: "66mm",
          width: "58mm",
          height: "3.3mm",
          textAlign: "left",
        }}
      />
    </>
  );
}
/** PDF用1枚目オーバーレイ */



export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = (params as any)?.id as string | undefined;

  const [row, setRow] = useState<SurveyBookRow | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error || !data) {
          alert("データ取得に失敗: " + (error?.message ?? "not found"));
          router.replace("/cases");
          return;
        }

        setRow(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const subtitle = useMemo(() => {
    if (!row) return "";
    const name = row.property_name ?? "（物件名なし）";
    const addr = row.address ?? "";
    return `${name}${addr ? ` / ${addr}` : ""}`;
  }, [row]);


  

const exportPdf = useCallback(() => {
  if (!row) {
    alert("データがありません");
    return;
  }

  const title = sanitizeHtml(sanitizeFileName(makePdfFileName(row)));

  const pageNodes = Array.from(
    document.querySelectorAll('[data-print-page="true"]')
  ) as HTMLDivElement[];

  const pagesHtml = pageNodes
    .map((page) => `<div class="print-page">${page.outerHTML}</div>`)
    .join("");

  if (!pagesHtml.trim()) {
    alert("印刷対象が見つかりません");
    return;
  }

  const doc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }

    .print-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }

    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .print-page > div {
      width: 210mm !important;
      height: 297mm !important;
      position: relative !important;
      background: #fff !important;
      overflow: hidden !important;
    }

    .print-page img {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.addEventListener("load", () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("ポップアップがブロックされました。ブラウザ設定で許可してください。");
    return;
  }

  w.document.open();
  w.document.write(doc);
  w.document.close();
}, [row]);

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            重要事項説明書（売買・マンション）
          </h1>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
  <button
    type="button"
    onClick={() => router.push("/cases")}
    className="button-base"
  >
    戻る
  </button>

  <button
    type="button"
    onClick={exportPdf}
    className="button-base"
    disabled={loading || !row}
  >
    PDFで保存
  </button>
</div>
      </div>


      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ opacity: 0.8 }}>読み込み中...</div>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {PAGES.map((src, index) => {
              const pageNo = index + 1;

              return (


<div
  key={src}
  data-print-page="true"
  style={{
    position: "relative",
    width: "210mm",
    height: "297mm",
    background: "#fff",
    overflow: "hidden",
  }}
>
                  <img
                    src={src}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />

                  {row && (
                    <>
                      {pageNo === 1 && (
                        <>
                          {FIELDS_PAGE1.map((f) => {
                            const text = getDisplayValue(row, f.key);
                            if (!text) return null;

                            const ta = f.align ?? "left";

                            return (
                              <FitText
                                key={`p1-${f.key}-${f.top}-${f.left}`}
                                text={text}
                                maxFontSize={f.maxFontSize ?? 14}
                                minFontSize={f.minFontSize ?? 8}
                                style={{
                                  position: "absolute",
                                  top: f.top,
                                  left: f.left,
                                  width: f.width,
                                  height: f.height,
                                  textAlign: ta,
                                }}
                              />
                            );
                          })}

                          {renderTransactionCircles(row)}
                        </>
                      )}



{pageNo === 2 && (
  <>

{FIELDS_PAGE2.map((f) => {
  const text = getDisplayValue(row, f.key);
  if (!text) return null;

  const ta = f.align ?? "left";

  const isLongTextField =
  f.key === "urban_planning_summary" ||
  f.key === "use_district_summary" ||
  f.key === "other_area_district_summary" ||
  f.key === "land_rights_related" ||
  f.key === "land_other_rights" ||
  f.key === "building_rights_related" ||
  f.key === "building_other_rights";

  

  
if (isLongTextField) {
  const lines = String(text).split("\n");

  return (
    <div
      key={`p2-${f.key}-${f.top}-${f.left}`}
      style={{
        position: "absolute",
        top: f.top,
        left: f.left,
        width: f.width,
        height: f.height,
        textAlign: ta,
        fontSize: `${f.maxFontSize ?? 10}px`,
        color: "#000",
        fontWeight: 400,
        fontFamily: `"Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif`,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        lineHeight: 1.35,
        overflow: "hidden",
        padding: "1mm 1mm 0 0",
        boxSizing: "border-box",
      }}
    >
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

  return (
    <FitText
      key={`p2-${f.key}-${f.top}-${f.left}`}
      text={text}
      maxFontSize={f.maxFontSize ?? 14}
      minFontSize={f.minFontSize ?? 8}
      style={{
        position: "absolute",
        top: f.top,
        left: f.left,
        width: f.width,
        height: f.height,
        textAlign: ta,
      }}
    />
  );
})}

    <OwnerBlock
      name={getDisplayValue(row, "land_owner_name")}
      address={getDisplayValue(row, "land_owner_address")}
      top="60mm"
    />

    <OwnerBlock
      name={getDisplayValue(row, "building_owner_name")}
      address={getDisplayValue(row, "building_owner_address")}
      top="76mm"
    />

<FitText
  text={getDisplayValue(row, "building_coverage_calc_site_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "183.5mm",
    left: "103mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>

<FitText
  text={getDisplayValue(row, "building_coverage_calc_deduction_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "183.5mm",
    left: "125mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>



<FitText
  text={getDisplayValue(row, "building_coverage_calc_limit_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "183.5mm",
    left: "164mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>

<FitText
  text={getDisplayValue(row, "floor_area_ratio_calc_site_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "191mm",
    left: "103mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>

<FitText
  text={getDisplayValue(row, "floor_area_ratio_calc_deduction_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "191mm",
    left: "125mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>


<FitText
  text={getDisplayValue(row, "floor_area_ratio_calc_limit_area")}
  maxFontSize={10}
  minFontSize={8}
  style={{
    position: "absolute",
    top: "191mm",
    left: "164mm",
    width: "14mm",
    height: "5mm",
    textAlign: "center",
  }}
/>
    {renderUrbanPlanningAreaType(row)}
  </>
)}


{pageNo === 3 && (
  <>
    {FIELDS_PAGE3.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      const ta = f.align ?? "left";

      const isLongTextField =
        f.key === "law_summary_1" ||
        f.key === "law_summary_2" ||
        f.key === "law_summary_3" ||
        f.key === "law_summary_4" ||
        f.key === "private_road_note" ||
        f.key === "infra_note" ||
        f.key === "structure_summary" ||
        f.key === "road_summary";

      if (isLongTextField) {
        const lines = String(text).split("\n");

        return (
          <div
            key={`p3-${f.key}-${f.top}-${f.left}`}
            style={{
              position: "absolute",
              top: f.top,
              left: f.left,
              width: f.width,
              height: f.height,
              textAlign: ta,
              fontSize: `${f.maxFontSize ?? 10}px`,
              color: "#000",
              fontWeight: 400,
              fontFamily: `"Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif`,
              lineHeight: 1.35,
              overflow: "hidden",
              whiteSpace: "normal",
            }}
          >
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        );
      }

      return (
        <FitText
          key={`p3-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: ta,
          }}
        />
      );
    })}

   

{renderPrivateRoadBurdenCircles(row)}
{renderWaterSupplyTypeCircles(row)}
{renderImmediateFacilityTexts(row)}
{renderFacilityScheduleDates(row)}
{renderDrainageFacilityScheduleDetail(row)}
{renderWaterFacilityScheduleTypeCircles(row)}
{renderGasTypeCircles(row)}
{renderGasFacilityScheduleTypeCircles(row)}
{renderSpecialBurdenCircles(row)}
{renderSpecialBurdenAmounts(row)}
{renderSepticTankRequiredCircles(row)}
  </>
)}

{pageNo === 4 && (
  <>
    {FIELDS_PAGE4.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p4-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}

    {renderBuildingRightsTypeCircles(row)}
    {renderNonOwnershipTargetAreaTypeCircles(row)}
    {renderNonOwnershipPeriod(row)}
  </>
)}

{pageNo === 5 && (
  <>
    {FIELDS_PAGE5.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p5-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}
    {renderOtherExclusiveUseParts(row)}
    {renderPage5Dates(row)}
  </>
)}

{pageNo === 6 && (
  <>
    {FIELDS_PAGE6.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p6-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}

    {renderPage6YesNoCircles(row)}
  </>
)}

{pageNo === 7 && (
  <>
    {FIELDS_PAGE7.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p7-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}

    {renderPage7Circles(row)}
  </>
)}

{pageNo === 8 && (
  <>
    {renderPage7ContinuationCircles(row)}
  </>
)}

{pageNo === 9 && (
  <>
    {FIELDS_PAGE8.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p8-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}

    {renderPage8ExtraMoneyRows(row)}
    {renderPage8MethodCircles(row)}
  </>
)}

{pageNo === 10 && (
  <>
    {FIELDS_PAGE9.map((f) => {
      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p9-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}

    {renderPage9MoneyFields(row)}
    {renderPage9Circles(row)}
  </>
)}

{pageNo === 11 && (
  <>
    {FIELDS_PAGE10.map((f) => {
      const memberType = getValue(row, "guarantee_association_member_type");

      if (
        f.key === "deposit_office_and_address" &&
        memberType !== "non_member"
      ) {
        return null;
      }

      if (
        [
          "association_name",
          "association_address",
          "association_office_address",
          "association_deposit_office_and_address",
        ].includes(f.key) &&
        memberType !== "member"
      ) {
        return null;
      }

      const text = getDisplayValue(row, f.key);
      if (!text) return null;

      return (
        <FitText
          key={`p10-${f.key}-${f.top}-${f.left}`}
          text={text}
          maxFontSize={f.maxFontSize ?? 10}
          minFontSize={8}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.width,
            height: f.height,
            textAlign: f.align ?? "left",
          }}
        />
      );
    })}
  </>
)}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}



