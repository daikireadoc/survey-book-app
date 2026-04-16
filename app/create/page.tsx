
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { getMyOrganizationAndSubscription } from "../../lib/account";
import { incrementTrialCaseUsed } from "../../lib/subscription";

/** ===== モード（/new から受け取る） ===== */
type MainMode = "sale" | "rent";
type SubMode = "land_house" | "mansion" | "exchange";
type ModeState = { main: MainMode; sub: SubMode };

const NEW_DRAFT_KEY = "surveybook:newDraft:v1";
const SETTINGS_KEY = "surveybook:settings:v1";

type SavedSettings = {
  company_name?: string;
  representative_name?: string;
  office_address?: string;
  license_number?: string;
  license_date?: string;

  agent_name?: string;
  agent_reg_no?: string;
  agent_office?: string;
  agent_tel_area?: string;
  agent_tel_local?: string;
  agent_tel_line?: string;

  transaction_kind?: string;
  transaction_role?: string;
};

const TABLE_NAME = "mansion_sales";
const URBAN_PLANNING_AREA_TYPE_OPTIONS = [
  "市街化区域",
  "市街化調整区域",
  "非線引区域",
  "準都市計画区域",
  "その他",
];
/** ===== DB row ===== */
type SurveyBookRow = {
  id: string;
  created_at: string;

  property_name: string | null;
  address: string | null;

  recipient_name: string | null;
  doc_year: string | null;
  doc_month: string | null;
  doc_day: string | null;

  deal_type: string | null;
  property_type: string | null;

  biz_name: string | null;
  biz_license_no: string | null;
  biz_license_date: string | null;
  biz_office_address: string | null;
  biz_representative: string | null;
  biz_tel: string | null;

  agent_name: string | null;
  agent_reg_no: string | null;
  agent_office: string | null;
  agent_tel: string | null;

  transaction_kind: string | null;
  transaction_role: string | null;

  mansion_tower: string | null;
  mansion_floor: string | null;
  mansion_room_no: string | null;

  mansion_exclusive_area_m2: string | null;
  registry_floor_area_m2: string | null;
  site_area_measured: string | null;

  mansion_site_right_type: string | null;
  mansion_site_area_m2: string | null;

  mansion_share_ratio_before: string | null;
  mansion_share_ratio_after: string | null;

  seller_name: string | null;
  seller_address: string | null;

  notes: string | null;

land_owner_name: string | null;
land_owner_address: string | null;
building_owner_name: string | null;
building_owner_address: string | null;

urban_planning_area_type: string | null;
urban_planning_summary: string | null;

use_district: string | null;
use_district_summary: string | null;

other_area_district: string | null;
other_area_district_summary: string | null;

building_coverage: string | null;
floor_area_ratio: string | null;

road_relation: string | null;
private_road_restriction: string | null;
};

type OtherExclusiveUsePartRow = {
  part: string;
  fee_exists: string;
  fee_recipient: string;
};

type ExtraMoneyRow = {
  amount: string;
  purpose: string;
};

/** ===== Form state ===== */
type FormState = {
  property_name: string;
  address: string;

  recipient_name: string;
  doc_year: string;
  doc_month: string;
  doc_day: string;

  deal_type: string;
  property_type: string;

  biz_name: string;
  biz_license_no: string;
  biz_license_date: string;
  biz_office_address: string;
  biz_representative: string;
  biz_tel: string;

  agent_name: string;
  agent_reg_no: string;
  agent_office: string;
  agent_tel_area: string;
  agent_tel_local: string;
  agent_tel_line: string;

  transaction_kind: string;
  transaction_role: string;

  mansion_tower: string;
  mansion_floor: string;
  mansion_room_no: string;

  mansion_exclusive_area_m2: string;
  registry_floor_area_m2: string;
  site_area_measured: string;

  mansion_site_right_type: string;
  mansion_site_area_m2: string;

  mansion_share_ratio_before: string;
  mansion_share_ratio_after: string;

  seller_name: string;
  seller_address: string;


land_owner_name: string;
land_owner_address: string;
building_owner_name: string;
building_owner_address: string;

land_rights_related: string;
land_other_rights: string;
building_rights_related: string;
building_other_rights: string;


urban_planning_area_type: string;
urban_planning_summary: string;

use_district: string;
use_district_summary: string;

other_area_district: string;
other_area_district_summary: string;

building_coverage: string;
floor_area_ratio: string;
building_coverage_calc_site_area: string;
building_coverage_calc_deduction_area: string;
building_coverage_calc_limit_area: string;

floor_area_ratio_calc_site_area: string;
floor_area_ratio_calc_deduction_area: string;
floor_area_ratio_calc_limit_area: string;
road_relation: string;
private_road_restriction: string;


law_name_1: string;
law_summary_1: string;
law_name_2: string;
law_summary_2: string;
law_name_3: string;
law_summary_3: string;
law_name_4: string;
law_summary_4: string;

private_road_burden_exists: string;
private_road_area: string;
private_road_price: string;
private_road_note: string;

water_supply_type: string;
water_facility_schedule_year: string;
water_facility_schedule_month: string;
water_facility_schedule_day: string;
water_facility_schedule_type: string;
water_special_burden_exists: string;
water_special_burden_amount: string;

electric_supply_available: string;
electric_facility_schedule_year: string;
electric_facility_schedule_month: string;
electric_facility_schedule_day: string;
electric_special_burden_exists: string;
electric_special_burden_amount: string;

gas_type: string;
gas_facility_schedule_year: string;
gas_facility_schedule_month: string;
gas_facility_schedule_day: string;
gas_facility_schedule_type: string;
gas_special_burden_exists: string;
gas_special_burden_amount: string;

drainage_supply_available: string;
drainage_facility_schedule_year: string;
drainage_facility_schedule_month: string;
drainage_facility_schedule_day: string;
drainage_facility_schedule_detail: string;
drainage_special_burden_exists: string;
drainage_special_burden_amount: string;
septic_tank_required: string;

infra_note: string;

structure_summary: string;
road_summary: string;

building_structure: string;
building_finish: string;
equipment_installation: string;
equipment_structure: string;

building_rights_measured_area: string;
building_rights_registry_area: string;
building_confirmation_area: string;
building_rights_type: string;
building_rights_other_detail: string;

non_ownership_target_area_type: string;
non_ownership_target_area: string;
non_ownership_period_year: string;
non_ownership_period_month: string;
non_ownership_period_day: string;
non_ownership_holder_burden_amount: string;
common_area_rules: string;
exclusive_use_restrictions: string;

parking_user_1: string;
parking_user_2: string;
parking_fee_exists_1: string;
parking_fee_exists_2: string;
parking_fee_recipient_1: string;
parking_fee_recipient_2: string;

other_exclusive_use_parts: OtherExclusiveUsePartRow[];

fee_reduction_rules: string;

repair_reserve_rules: string;

repair_reserve_accumulated_amount: string;
repair_reserve_accumulated_year: string;
repair_reserve_accumulated_month: string;
repair_reserve_accumulated_day: string;

building_arrears_amount: string;
building_arrears_year: string;
building_arrears_month: string;
building_arrears_day: string;

unit_arrears_amount: string;
unit_arrears_year: string;
unit_arrears_month: string;
unit_arrears_day: string;

monthly_management_fee: string;
monthly_management_fee_year: string;
monthly_management_fee_month: string;
monthly_management_fee_day: string;

monthly_management_fee_arrears: string;
monthly_management_fee_arrears_year: string;
monthly_management_fee_arrears_month: string;
monthly_management_fee_arrears_day: string;

management_company_name: string;
management_company_address: string;

maintenance_common: string;
maintenance_private: string;
page6_other: string;

building_survey_exists: string;
building_survey_summary: string;

confirmation_docs_exists: string;
inspection_cert_exists: string;

renovation_confirmation_docs_exists: string;
renovation_inspection_cert_exists: string;

survey_report_exists: string;
performance_eval_exists: string;
periodic_report_exists: string;

seismic_doc_exists: string;
seismic_doc_name: string;

page7_notes: string;

developed_disaster_area: string;
sediment_disaster_area: string;
tsunami_disaster_area: string;

hazard_flood_exists: string;
hazard_inland_flood_exists: string;
hazard_tide_exists: string;
hazard_map_location: string;

asbestos_record_exists: string;
asbestos_record_content: string;

seismic_diagnosis_exists: string;
seismic_diagnosis_content: string;

new_house_performance_eval_delivery_exists: string;
design_housing_performance_eval_exists: string;
construction_housing_performance_eval_exists: string;

extra_money_rows: ExtraMoneyRow[];

contract_cancellation_terms: string;
penalty_terms: string;

incomplete_property_preservation_method: string;
incomplete_property_preservation_institution: string;

completed_property_preservation_method: string;
completed_property_preservation_institution: string;

deposit_preservation_needed: string;
deposit_preservation_institution: string;

loan_mediation_exists: string;
loan_bank_name: string;
loan_amount: string;
loan_period: string;
loan_interest_rate: string;
loan_repayment_method: string;
loan_guarantee_fee: string;
loan_admin_fee: string;
loan_other: string;
loan_failure_measures: string;

liability_measures_exists: string;
liability_measures_content: string;

cash_price: string;
installment_price: string;
before_delivery_payment: string;
before_delivery_payment_timing: string;
before_delivery_payment_method: string;
installment_amount: string;
installment_amount_timing: string;
installment_amount_method: string;

guarantee_association_member_type: string;

deposit_office_and_address: string;

association_name: string;
association_address: string;
association_office_address: string;
association_deposit_office_and_address: string;
};

const initialForm: FormState = {
  property_name: "",
  address: "",

  recipient_name: "",
  doc_year: "",
  doc_month: "",
  doc_day: "",

  deal_type: "",
  property_type: "",

  biz_name: "",
  biz_license_no: "",
  biz_license_date: "",
  biz_office_address: "",
  biz_representative: "",
  biz_tel: "",

  agent_name: "",
  agent_reg_no: "",
  agent_office: "",
  agent_tel_area: "",
  agent_tel_local: "",
  agent_tel_line: "",

  transaction_kind: "売買",
  transaction_role: "媒介",

  mansion_tower: "",
  mansion_floor: "",
  mansion_room_no: "",

  mansion_exclusive_area_m2: "",
  registry_floor_area_m2: "",
  site_area_measured: "",

  mansion_site_right_type: "",
  mansion_site_area_m2: "",

  mansion_share_ratio_before: "",
  mansion_share_ratio_after: "",

  seller_name: "",
  seller_address: "",

  

land_owner_name: "",
land_owner_address: "",
building_owner_name: "",
building_owner_address: "",
land_rights_related: "",
land_other_rights: "",
building_rights_related: "",
building_other_rights: "",

urban_planning_area_type: "",
urban_planning_summary: "",

use_district: "",
use_district_summary: "",

other_area_district: "",
other_area_district_summary: "",

building_coverage: "",
floor_area_ratio: "",
building_coverage_calc_site_area: "",
building_coverage_calc_deduction_area: "",
building_coverage_calc_limit_area: "",

floor_area_ratio_calc_site_area: "",
floor_area_ratio_calc_deduction_area: "",
floor_area_ratio_calc_limit_area: "",
road_relation: "",
private_road_restriction: "",


law_name_1: "",
law_summary_1: "",
law_name_2: "",
law_summary_2: "",
law_name_3: "",
law_summary_3: "",
law_name_4: "",
law_summary_4: "",

private_road_burden_exists: "",
private_road_area: "",
private_road_price: "",
private_road_note: "",

water_supply_type: "",
water_facility_schedule_year: "",
water_facility_schedule_month: "",
water_facility_schedule_day: "",
water_facility_schedule_type: "",
water_special_burden_exists: "",
water_special_burden_amount: "",

electric_supply_available: "",
electric_facility_schedule_year: "",
electric_facility_schedule_month: "",
electric_facility_schedule_day: "",
electric_special_burden_exists: "",
electric_special_burden_amount: "",

gas_type: "",
gas_facility_schedule_year: "",
gas_facility_schedule_month: "",
gas_facility_schedule_day: "",
gas_facility_schedule_type: "",
gas_special_burden_exists: "",
gas_special_burden_amount: "",

drainage_supply_available: "",
drainage_facility_schedule_year: "",
drainage_facility_schedule_month: "",
drainage_facility_schedule_day: "",
drainage_facility_schedule_detail: "",
drainage_special_burden_exists: "",
drainage_special_burden_amount: "",
septic_tank_required: "",

infra_note: "",

structure_summary: "",
road_summary: "",

building_structure: "",
building_finish: "",
equipment_installation: "",
equipment_structure: "",

building_rights_measured_area: "",
building_rights_registry_area: "",
building_confirmation_area: "",
building_rights_type: "",
building_rights_other_detail: "",

non_ownership_target_area_type: "",
non_ownership_target_area: "",
non_ownership_period_year: "",
non_ownership_period_month: "",
non_ownership_period_day: "",
non_ownership_holder_burden_amount: "",
common_area_rules: "",
exclusive_use_restrictions: "",

parking_user_1: "",
parking_user_2: "",
parking_fee_exists_1: "",
parking_fee_exists_2: "",
parking_fee_recipient_1: "",
parking_fee_recipient_2: "",

other_exclusive_use_parts: [],

fee_reduction_rules: "",

repair_reserve_rules: "",

repair_reserve_accumulated_amount: "",
repair_reserve_accumulated_year: "",
repair_reserve_accumulated_month: "",
repair_reserve_accumulated_day: "",

building_arrears_amount: "",
building_arrears_year: "",
building_arrears_month: "",
building_arrears_day: "",

unit_arrears_amount: "",
unit_arrears_year: "",
unit_arrears_month: "",
unit_arrears_day: "",

monthly_management_fee: "",
monthly_management_fee_year: "",
monthly_management_fee_month: "",
monthly_management_fee_day: "",

monthly_management_fee_arrears: "",
monthly_management_fee_arrears_year: "",
monthly_management_fee_arrears_month: "",
monthly_management_fee_arrears_day: "",

management_company_name: "",
management_company_address: "",

maintenance_common: "",
maintenance_private: "",
page6_other: "",

building_survey_exists: "",
building_survey_summary: "",

confirmation_docs_exists: "",
inspection_cert_exists: "",

renovation_confirmation_docs_exists: "",
renovation_inspection_cert_exists: "",

survey_report_exists: "",
performance_eval_exists: "",
periodic_report_exists: "",

seismic_doc_exists: "",
seismic_doc_name: "",

page7_notes: "",

developed_disaster_area: "",
sediment_disaster_area: "",
tsunami_disaster_area: "",

hazard_flood_exists: "",
hazard_inland_flood_exists: "",
hazard_tide_exists: "",
hazard_map_location: "",

asbestos_record_exists: "",
asbestos_record_content: "",

seismic_diagnosis_exists: "",
seismic_diagnosis_content: "",

new_house_performance_eval_delivery_exists: "",
design_housing_performance_eval_exists: "",
construction_housing_performance_eval_exists: "",

extra_money_rows: [{ amount: "", purpose: "" }],

contract_cancellation_terms: "",
penalty_terms: "",

incomplete_property_preservation_method: "",
incomplete_property_preservation_institution: "",

completed_property_preservation_method: "",
completed_property_preservation_institution: "",

deposit_preservation_needed: "",
deposit_preservation_institution: "",

loan_mediation_exists: "",
loan_bank_name: "",
loan_amount: "",
loan_period: "",
loan_interest_rate: "",
loan_repayment_method: "",
loan_guarantee_fee: "",
loan_admin_fee: "",
loan_other: "",
loan_failure_measures: "",

liability_measures_exists: "",
liability_measures_content: "",

cash_price: "",
installment_price: "",
before_delivery_payment: "",
before_delivery_payment_timing: "",
before_delivery_payment_method: "",
installment_amount: "",
installment_amount_timing: "",
installment_amount_method: "",

guarantee_association_member_type: "",

deposit_office_and_address: "",

association_name: "",
association_address: "",
association_office_address: "",
association_deposit_office_and_address: "",
};

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatNumberWithCommas(value: string) {
  const digits = sanitizeDigits(value);
  if (!digits) return "";
  return Number(digits).toLocaleString("ja-JP");
}

function sanitizeDecimal(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) return cleaned;

  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function NumericInput({
  value,
  onChange,
  placeholder,
  decimal = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={value}
      onChange={(e) =>
        onChange(decimal ? sanitizeDecimal(e.target.value) : sanitizeDigits(e.target.value))
      }
      placeholder={placeholder}
      style={input}
    />
  );
}

function MoneyInput({
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
      type="text"
      inputMode="numeric"
      value={formatNumberWithCommas(value)}
      onChange={(e) => onChange(sanitizeDigits(e.target.value))}
      placeholder={placeholder}
      style={input}
    />
  );
}


function DatePartInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength: number;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(sanitizeDigits(e.target.value).slice(0, maxLength))}
      placeholder={placeholder}
      style={{
        ...input,
        width: maxLength === 4 ? 72 : 52,
        textAlign: "center",
      }}
    />
  );
}


function ScheduleDateInputs({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
}: {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <DatePartInput
        value={year}
        onChange={onYearChange}
        placeholder="2026"
        maxLength={4}
      />
      <span>年</span>

      <DatePartInput
        value={month}
        onChange={onMonthChange}
        placeholder="3"
        maxLength={2}
      />
      <span>月</span>

      <DatePartInput
        value={day}
        onChange={onDayChange}
        placeholder="10"
        maxLength={2}
      />
      <span>日</span>
    </div>
  );
}

function modeToText(mode: ModeState | null) {
  if (!mode) return "未選択";
  return `${mode.main} / ${mode.sub}`;
}


function formToPayload(form: FormState) {
  return {
    property_name: form.property_name || null,
    address: form.address || null,

    recipient_name: form.recipient_name || null,
    doc_year: form.doc_year || null,
    doc_month: form.doc_month || null,
    doc_day: form.doc_day || null,

    deal_type: form.deal_type || null,
    property_type: form.property_type || null,

    biz_name: form.biz_name || null,
    biz_license_no: form.biz_license_no || null,
    biz_license_date: form.biz_license_date || null,
    biz_office_address: form.biz_office_address || null,
    biz_representative: form.biz_representative || null,
    biz_tel: form.biz_tel || null,

    agent_name: form.agent_name || null,
agent_reg_no: form.agent_reg_no || null,
agent_office: form.agent_office || null,
agent_tel_area: form.agent_tel_area || null,
agent_tel_local: form.agent_tel_local || null,
agent_tel_line: form.agent_tel_line || null,

    transaction_kind: form.transaction_kind || null,
    transaction_role: form.transaction_role || null,

    mansion_tower: form.mansion_tower || null,
    mansion_floor: form.mansion_floor || null,
    mansion_room_no: form.mansion_room_no || null,

    mansion_exclusive_area_m2: form.mansion_exclusive_area_m2 || null,
    registry_floor_area_m2: form.registry_floor_area_m2 || null,
    site_area_measured: form.site_area_measured || null,

    mansion_site_right_type: form.mansion_site_right_type || null,
    mansion_site_area_m2: form.mansion_site_area_m2 || null,

    mansion_share_ratio_before: form.mansion_share_ratio_before || null,
    mansion_share_ratio_after: form.mansion_share_ratio_after || null,

    seller_name: form.seller_name || null,
    seller_address: form.seller_address || null,

    

land_owner_name: form.land_owner_name || null,
land_owner_address: form.land_owner_address || null,
building_owner_name: form.building_owner_name || null,
building_owner_address: form.building_owner_address || null,
land_rights_related: form.land_rights_related || null,
land_other_rights: form.land_other_rights || null,
building_rights_related: form.building_rights_related || null,
building_other_rights: form.building_other_rights || null,

urban_planning_area_type: form.urban_planning_area_type || null,
urban_planning_summary: form.urban_planning_summary || null,

use_district: form.use_district || null,
use_district_summary: form.use_district_summary || null,

other_area_district: form.other_area_district || null,
other_area_district_summary: form.other_area_district_summary || null,

building_coverage: form.building_coverage || null,
floor_area_ratio: form.floor_area_ratio || null,
building_coverage_calc_site_area: form.building_coverage_calc_site_area || null,
building_coverage_calc_deduction_area: form.building_coverage_calc_deduction_area || null,
building_coverage_calc_limit_area: form.building_coverage_calc_limit_area || null,

floor_area_ratio_calc_site_area: form.floor_area_ratio_calc_site_area || null,
floor_area_ratio_calc_deduction_area: form.floor_area_ratio_calc_deduction_area || null,
floor_area_ratio_calc_limit_area: form.floor_area_ratio_calc_limit_area || null,
road_relation: form.road_relation || null,
private_road_restriction: form.private_road_restriction || null,


law_name_1: form.law_name_1 || null,
law_summary_1: form.law_summary_1 || null,
law_name_2: form.law_name_2 || null,
law_summary_2: form.law_summary_2 || null,
law_name_3: form.law_name_3 || null,
law_summary_3: form.law_summary_3 || null,
law_name_4: form.law_name_4 || null,
law_summary_4: form.law_summary_4 || null,

private_road_burden_exists: form.private_road_burden_exists || null,
private_road_area: form.private_road_area || null,
private_road_price: form.private_road_price || null,
private_road_note: form.private_road_note || null,

water_supply_type: form.water_supply_type || null,
water_facility_schedule_year: form.water_facility_schedule_year || null,
water_facility_schedule_month: form.water_facility_schedule_month || null,
water_facility_schedule_day: form.water_facility_schedule_day || null,
water_facility_schedule_type: form.water_facility_schedule_type || null,
water_special_burden_exists: form.water_special_burden_exists || null,
water_special_burden_amount:
  form.water_special_burden_exists === "有"
    ? form.water_special_burden_amount || null
    : null,

electric_supply_available: form.electric_supply_available || null,
electric_facility_schedule_year: form.electric_facility_schedule_year || null,
electric_facility_schedule_month: form.electric_facility_schedule_month || null,
electric_facility_schedule_day: form.electric_facility_schedule_day || null,
electric_special_burden_exists: form.electric_special_burden_exists || null,
electric_special_burden_amount:
  form.electric_special_burden_exists === "有"
    ? form.electric_special_burden_amount || null
    : null,

gas_type: form.gas_type || null,
gas_facility_schedule_year: form.gas_facility_schedule_year || null,
gas_facility_schedule_month: form.gas_facility_schedule_month || null,
gas_facility_schedule_day: form.gas_facility_schedule_day || null,
gas_facility_schedule_type: form.gas_facility_schedule_type || null,
gas_special_burden_exists: form.gas_special_burden_exists || null,
gas_special_burden_amount:
  form.gas_special_burden_exists === "有"
    ? form.gas_special_burden_amount || null
    : null,

drainage_supply_available: form.drainage_supply_available || null,
drainage_facility_schedule_year: form.drainage_facility_schedule_year || null,
drainage_facility_schedule_month: form.drainage_facility_schedule_month || null,
drainage_facility_schedule_day: form.drainage_facility_schedule_day || null,
drainage_facility_schedule_detail: form.drainage_facility_schedule_detail || null,
drainage_special_burden_exists: form.drainage_special_burden_exists || null,
drainage_special_burden_amount:
  form.drainage_special_burden_exists === "有"
    ? form.drainage_special_burden_amount || null
    : null,
septic_tank_required: form.septic_tank_required || null,

infra_note: form.infra_note || null,

structure_summary: form.structure_summary || null,
road_summary: form.road_summary || null,

building_structure: form.building_structure || null,
building_finish: form.building_finish || null,
equipment_installation: form.equipment_installation || null,
equipment_structure: form.equipment_structure || null,

building_rights_measured_area: form.building_rights_measured_area || null,
building_rights_registry_area: form.building_rights_registry_area || null,
building_confirmation_area: form.building_confirmation_area || null,
building_rights_type: form.building_rights_type || null,
building_rights_other_detail:
  form.building_rights_type === "その他"
    ? form.building_rights_other_detail || null
    : null,
    non_ownership_target_area_type:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_target_area_type || null
      : null,
  
  non_ownership_target_area:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_target_area || null
      : null,
  
  non_ownership_period_year:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_period_year || null
      : null,
  
  non_ownership_period_month:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_period_month || null
      : null,
  
  non_ownership_period_day:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_period_day || null
      : null,
  
  non_ownership_holder_burden_amount:
    form.building_rights_type && form.building_rights_type !== "所有権"
      ? form.non_ownership_holder_burden_amount || null
      : null,

 common_area_rules: form.common_area_rules || null,
exclusive_use_restrictions: form.exclusive_use_restrictions || null,

parking_user_1: form.parking_user_1 || null,
parking_user_2: form.parking_user_2 || null,
parking_fee_exists_1: form.parking_fee_exists_1 || null,
parking_fee_exists_2: form.parking_fee_exists_2 || null,
parking_fee_recipient_1: form.parking_fee_recipient_1 || null,
parking_fee_recipient_2: form.parking_fee_recipient_2 || null,

other_exclusive_use_parts:
  form.other_exclusive_use_parts.length > 0
    ? form.other_exclusive_use_parts
        .filter((row) => row.part || row.fee_exists || row.fee_recipient)
        .map((row) => ({
          part: row.part || "",
          fee_exists: row.fee_exists || "",
          fee_recipient: row.fee_recipient || "",
        }))
    : null,

    fee_reduction_rules: form.fee_reduction_rules || null,

repair_reserve_rules: form.repair_reserve_rules || null,

repair_reserve_accumulated_amount: form.repair_reserve_accumulated_amount || null,
repair_reserve_accumulated_year: form.repair_reserve_accumulated_year || null,
repair_reserve_accumulated_month: form.repair_reserve_accumulated_month || null,
repair_reserve_accumulated_day: form.repair_reserve_accumulated_day || null,

building_arrears_amount: form.building_arrears_amount || null,
building_arrears_year: form.building_arrears_year || null,
building_arrears_month: form.building_arrears_month || null,
building_arrears_day: form.building_arrears_day || null,

unit_arrears_amount: form.unit_arrears_amount || null,
unit_arrears_year: form.unit_arrears_year || null,
unit_arrears_month: form.unit_arrears_month || null,
unit_arrears_day: form.unit_arrears_day || null,

monthly_management_fee: form.monthly_management_fee || null,
monthly_management_fee_year: form.monthly_management_fee_year || null,
monthly_management_fee_month: form.monthly_management_fee_month || null,
monthly_management_fee_day: form.monthly_management_fee_day || null,

monthly_management_fee_arrears: form.monthly_management_fee_arrears || null,
monthly_management_fee_arrears_year: form.monthly_management_fee_arrears_year || null,
monthly_management_fee_arrears_month: form.monthly_management_fee_arrears_month || null,
monthly_management_fee_arrears_day: form.monthly_management_fee_arrears_day || null,

management_company_name: form.management_company_name || null,
management_company_address: form.management_company_address || null,

maintenance_common: form.maintenance_common || null,
maintenance_private: form.maintenance_private || null,
page6_other: form.page6_other || null,

building_survey_exists: form.building_survey_exists || null,
building_survey_summary:
  form.building_survey_exists === "有"
    ? form.building_survey_summary || null
    : null,

confirmation_docs_exists: form.confirmation_docs_exists || null,
inspection_cert_exists: form.inspection_cert_exists || null,

renovation_confirmation_docs_exists:
  form.renovation_confirmation_docs_exists || null,
renovation_inspection_cert_exists:
  form.renovation_inspection_cert_exists || null,

survey_report_exists: form.survey_report_exists || null,
performance_eval_exists: form.performance_eval_exists || null,
periodic_report_exists: form.periodic_report_exists || null,

seismic_doc_exists: form.seismic_doc_exists || null,
seismic_doc_name:
  form.seismic_doc_exists === "有" ? form.seismic_doc_name || null : null,
  page7_notes: form.page7_notes || null,

developed_disaster_area: form.developed_disaster_area || null,
sediment_disaster_area: form.sediment_disaster_area || null,
tsunami_disaster_area: form.tsunami_disaster_area || null,

hazard_flood_exists: form.hazard_flood_exists || null,
hazard_inland_flood_exists: form.hazard_inland_flood_exists || null,
hazard_tide_exists: form.hazard_tide_exists || null,
hazard_map_location: form.hazard_map_location || null,

asbestos_record_exists: form.asbestos_record_exists || null,
asbestos_record_content:
  form.asbestos_record_exists === "有"
    ? form.asbestos_record_content || null
    : null,

seismic_diagnosis_exists: form.seismic_diagnosis_exists || null,
seismic_diagnosis_content:
  form.seismic_diagnosis_exists === "有"
    ? form.seismic_diagnosis_content || null
    : null,

    new_house_performance_eval_delivery_exists:
  form.new_house_performance_eval_delivery_exists || null,

design_housing_performance_eval_exists:
  form.new_house_performance_eval_delivery_exists === "有"
    ? form.design_housing_performance_eval_exists || null
    : null,

construction_housing_performance_eval_exists:
  form.new_house_performance_eval_delivery_exists === "有"
    ? form.construction_housing_performance_eval_exists || null
    : null,

    extra_money_rows:
  form.extra_money_rows.length > 0
    ? form.extra_money_rows
        .filter((row) => row.amount || row.purpose)
        .map((row) => ({
          amount: row.amount || "",
          purpose: row.purpose || "",
        }))
    : null,

contract_cancellation_terms: form.contract_cancellation_terms || null,
penalty_terms: form.penalty_terms || null,

incomplete_property_preservation_method:
  form.incomplete_property_preservation_method || null,
incomplete_property_preservation_institution:
  form.incomplete_property_preservation_institution || null,

completed_property_preservation_method:
  form.completed_property_preservation_method || null,
completed_property_preservation_institution:
  form.completed_property_preservation_institution || null,

deposit_preservation_needed: form.deposit_preservation_needed || null,
deposit_preservation_institution:
  form.deposit_preservation_needed === "講ずる"
    ? form.deposit_preservation_institution || null
    : null,

    loan_mediation_exists: form.loan_mediation_exists || null,
loan_bank_name:
  form.loan_mediation_exists === "有" ? form.loan_bank_name || null : null,
loan_amount:
  form.loan_mediation_exists === "有" ? form.loan_amount || null : null,
loan_period:
  form.loan_mediation_exists === "有" ? form.loan_period || null : null,
loan_interest_rate:
  form.loan_mediation_exists === "有" ? form.loan_interest_rate || null : null,
loan_repayment_method:
  form.loan_mediation_exists === "有" ? form.loan_repayment_method || null : null,
loan_guarantee_fee:
  form.loan_mediation_exists === "有" ? form.loan_guarantee_fee || null : null,
loan_admin_fee:
  form.loan_mediation_exists === "有" ? form.loan_admin_fee || null : null,
loan_other:
  form.loan_mediation_exists === "有" ? form.loan_other || null : null,
loan_failure_measures:
  form.loan_mediation_exists === "有" ? form.loan_failure_measures || null : null,

liability_measures_exists: form.liability_measures_exists || null,
liability_measures_content:
  form.liability_measures_exists === "講ずる"
    ? form.liability_measures_content || null
    : null,

    cash_price: form.cash_price || null,
    installment_price: form.installment_price || null,
    before_delivery_payment: form.before_delivery_payment || null,
    before_delivery_payment_timing:
      form.before_delivery_payment_timing || null,
    before_delivery_payment_method:
      form.before_delivery_payment_method || null,
    installment_amount: form.installment_amount || null,
    installment_amount_timing:
      form.installment_amount_timing || null,
    installment_amount_method:
      form.installment_amount_method || null,

      guarantee_association_member_type:
  form.guarantee_association_member_type || null,

deposit_office_and_address:
  form.guarantee_association_member_type === "non_member"
    ? form.deposit_office_and_address || null
    : null,

association_name:
  form.guarantee_association_member_type === "member"
    ? form.association_name || null
    : null,

association_address:
  form.guarantee_association_member_type === "member"
    ? form.association_address || null
    : null,

association_office_address:
  form.guarantee_association_member_type === "member"
    ? form.association_office_address || null
    : null,

association_deposit_office_and_address:
  form.guarantee_association_member_type === "member"
    ? form.association_deposit_office_and_address || null
    : null,
  };
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [draftMode, setDraftMode] = useState<ModeState | null>(null);
  const [savedRow, setSavedRow] = useState<SurveyBookRow | null>(null);

  const currentMode = useMemo<ModeState | null>(() => draftMode ?? null, [draftMode]);

  const isMansionSale =
    (currentMode?.main === "sale" && currentMode?.sub === "mansion") ||
    (form.deal_type === "sale" && form.property_type === "mansion");

  const isSaveDisabled = useMemo(() => {
    if (!isMansionSale) return true;
    return (
      loading ||
      form.property_name.trim() === "" ||
      form.address.trim() === ""
    );
  }, [loading, form.property_name, form.address, isMansionSale]);

  const handleChange = useCallback(
    (key: keyof FormState, value: string) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const addExtraMoneyRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      extra_money_rows: [...prev.extra_money_rows, { amount: "", purpose: "" }],
    }));
  }, []);
  
  const updateExtraMoneyRow = useCallback(
    (index: number, key: keyof ExtraMoneyRow, value: string) => {
      setForm((prev) => {
        const next = [...prev.extra_money_rows];
        const current = next[index];
        if (!current) return prev;
  
        next[index] = { ...current, [key]: value };
  
        return {
          ...prev,
          extra_money_rows: next,
        };
      });
    },
    []
  );
  
  const removeExtraMoneyRow = useCallback((index: number) => {
    setForm((prev) => {
      const next = prev.extra_money_rows.filter((_, i) => i !== index);
      return {
        ...prev,
        extra_money_rows: next.length > 0 ? next : [{ amount: "", purpose: "" }],
      };
    });
  }, []);

  const addOtherExclusiveUsePartRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      other_exclusive_use_parts: [
        ...prev.other_exclusive_use_parts,
        { part: "", fee_exists: "", fee_recipient: "" },
      ],
    }));
  }, []);
  
  const updateOtherExclusiveUsePartRow = useCallback(
    (
      index: number,
      key: keyof OtherExclusiveUsePartRow,
      value: string
    ) => {
      setForm((prev) => {
        const next = [...prev.other_exclusive_use_parts];
        const current = next[index];
  
        if (!current) return prev;
  
        const updated = { ...current, [key]: value };
  
        if (key === "part" && !value) {
          updated.fee_exists = "";
          updated.fee_recipient = "";
        }
  
        if (key === "fee_exists" && value === "無") {
          updated.fee_recipient = "";
        }
  
        next[index] = updated;
  
        return {
          ...prev,
          other_exclusive_use_parts: next,
        };
      });
    },
    []
  );
  
  const removeOtherExclusiveUsePartRow = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      other_exclusive_use_parts: prev.other_exclusive_use_parts.filter(
        (_, i) => i !== index
      ),
    }));
  }, []);

  const handleSpecialBurdenChange = useCallback(
    (
      existsKey:
        | "water_special_burden_exists"
        | "electric_special_burden_exists"
        | "gas_special_burden_exists"
        | "drainage_special_burden_exists",
      amountKey:
        | "water_special_burden_amount"
        | "electric_special_burden_amount"
        | "gas_special_burden_amount"
        | "drainage_special_burden_amount",
      value: string
    ) => {
      setForm((prev) => ({
        ...prev,
        [existsKey]: value,
        [amountKey]: value === "有" ? prev[amountKey] : "",
      }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setSavedRow(null);
    setDraftMode(null);
  }, []);

  /** 編集モード */
  useEffect(() => {
    if (!editId) return;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("id", editId)
          .maybeSingle();

        if (error) {
          alert("読み込みに失敗しました: " + error.message);
          router.replace("/cases");
          return;
        }

        if (!data) {
          alert("該当データが見つかりません");
          router.replace("/cases");
          return;
        }

        const row = data as any;

        
        setForm((prev) => {
          const next: any = { ...prev };
        
          (Object.keys(prev) as (keyof FormState)[]).forEach((k) => {
            if (k === "other_exclusive_use_parts") {
              const raw = row[k];
          
              if (Array.isArray(raw)) {
                next[k] = raw;
              } else if (!raw) {
                next[k] = [];
              } else {
                try {
                  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                  next[k] = Array.isArray(parsed) ? parsed : [];
                } catch {
                  next[k] = [];
                }
              }
          
              return;
            }
          
            if (k === "extra_money_rows") {
              const raw = row[k];
          
              if (Array.isArray(raw)) {
                next[k] = raw;
              } else if (!raw) {
                next[k] = [{ amount: "", purpose: "" }];
              } else {
                try {
                  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                  next[k] = Array.isArray(parsed) ? parsed : [{ amount: "", purpose: "" }];
                } catch {
                  next[k] = [{ amount: "", purpose: "" }];
                }
              }
          
              return;
            }
          
            next[k] = row[k] ?? "";
          });
        
          if (!next.transaction_kind) next.transaction_kind = "売買";
          if (!next.transaction_role) next.transaction_role = "媒介";
        
          if (!next.agent_tel_area && !next.agent_tel_local && !next.agent_tel_line && row.agent_tel) {
            const rawTel = String(row.agent_tel).replace(/\D/g, "");
        
            if (rawTel.length === 10) {
              next.agent_tel_area = rawTel.slice(0, 2);
              next.agent_tel_local = rawTel.slice(2, 6);
              next.agent_tel_line = rawTel.slice(6, 10);
            } else if (rawTel.length === 11) {
              next.agent_tel_area = rawTel.slice(0, 3);
              next.agent_tel_local = rawTel.slice(3, 7);
              next.agent_tel_line = rawTel.slice(7, 11);
            }
          }
        
          return next as FormState;
        });

        setDraftMode({
          main: (row.deal_type ?? "sale") as MainMode,
          sub: (row.property_type ?? "mansion") as SubMode,
        });

        setSavedRow(row as SurveyBookRow);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, router]);

/** 新規モード */
useEffect(() => {
  if (editId) return;

  try {
    const rawDraft = localStorage.getItem(NEW_DRAFT_KEY);
    const rawSettings = localStorage.getItem(SETTINGS_KEY);

    let parsedDraft:
      | {
          mode?: ModeState;
          name?: string;
          address?: string;
        }
      | null = null;

    let parsedSettings: SavedSettings | null = null;

    if (rawDraft) {
      parsedDraft = JSON.parse(rawDraft);
    }

    if (rawSettings) {
      parsedSettings = JSON.parse(rawSettings) as SavedSettings;
    }

    if (!parsedDraft) {
      router.replace("/new");
      return;
    }

    const m = parsedDraft.mode;

    setForm((prev) => ({
      ...prev,

      // /new からの内容
      deal_type: m?.main ?? prev.deal_type,
      property_type: m?.sub ?? prev.property_type,
      property_name: parsedDraft?.name ?? prev.property_name,
      address: parsedDraft?.address ?? prev.address,

      // settings からの初期値
      biz_name: parsedSettings?.company_name ?? prev.biz_name,
      biz_representative:
        parsedSettings?.representative_name ?? prev.biz_representative,
      biz_office_address:
        parsedSettings?.office_address ?? prev.biz_office_address,
      biz_license_no:
        parsedSettings?.license_number ?? prev.biz_license_no,
      biz_license_date:
        parsedSettings?.license_date ?? prev.biz_license_date,

      agent_name: parsedSettings?.agent_name ?? prev.agent_name,
      agent_reg_no: parsedSettings?.agent_reg_no ?? prev.agent_reg_no,
      agent_office: parsedSettings?.agent_office ?? prev.agent_office,

      agent_tel_area:
        parsedSettings?.agent_tel_area ?? prev.agent_tel_area,
      agent_tel_local:
        parsedSettings?.agent_tel_local ?? prev.agent_tel_local,
      agent_tel_line:
        parsedSettings?.agent_tel_line ?? prev.agent_tel_line,

      transaction_kind:
        parsedSettings?.transaction_kind ?? prev.transaction_kind,
      transaction_role:
        parsedSettings?.transaction_role ?? prev.transaction_role,
    }));

    if (m) {
      setDraftMode(m);
    }

    localStorage.removeItem(NEW_DRAFT_KEY);
  } catch (e) {
    console.warn("draft/settings parse error", e);
    localStorage.removeItem(NEW_DRAFT_KEY);
    router.replace("/new");
  }
}, [router, editId]);

  const handleSave = useCallback(async () => {
    if (!isMansionSale) {
      alert("マンション売買モード以外は準備中です");
      return;
    }

    setLoading(true);
    try {
      const withMode: FormState = {
        ...form,
        deal_type: currentMode?.main ?? form.deal_type,
        property_type: currentMode?.sub ?? form.property_type,
      };

      const payload = formToPayload(withMode);

const { user, organizationId, subscription } =
  await getMyOrganizationAndSubscription();

  console.log("editId:", editId);
console.log("plan_status:", subscription.plan_status);
// トライアルチェック
const now = new Date();
const trialEnd = new Date(subscription.trial_end_at);

if (
  subscription.plan_status === "trial" &&
  (
    now > trialEnd ||
    subscription.trial_case_used >= subscription.trial_case_limit
  )
) {
  alert("トライアル終了しています。有料プランへアップグレードしてください。");
  router.push("/billing");
  return;
}
const payloadWithOrg = {
  ...payload,
  organization_id: organizationId,
  created_by: user.id,
  updated_at: new Date().toISOString(),
};

const q = supabase.from(TABLE_NAME);
const res = editId
  ? await q.update(payloadWithOrg).eq("id", editId).select("*").single()
  : await q.insert(payloadWithOrg).select("*").single();

const { data, error } = res as any;

if (error) {
  console.error(editId ? "update error:" : "insert error:", error);
  alert((editId ? "更新" : "保存") + "に失敗しました: " + error.message);
  return;
}

// 👇ここ！！（保存成功後）
if (!editId && subscription.plan_status === "trial") {
  await incrementTrialCaseUsed(organizationId);
}

      alert(editId ? "更新できました！" : "保存できました！");
      setSavedRow(data as SurveyBookRow);
    } finally {
      setLoading(false);
    }
  }, [form, currentMode, isMansionSale, editId]);

  const goToMansionSale = useCallback(() => {
    if (!savedRow?.id) {
      alert("先に保存してください");
      return;
    }
    router.push(`/mansion-preview/${savedRow.id}`);
  }, [router, savedRow]);

  return (
    <main
  style={{
    padding: 24,
    maxWidth: 980,
    margin: "0 auto",
    minHeight: "100vh",
    background: "var(--background)",
    color: "var(--foreground)",
  }}
>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
          {editId ? "編集" : "新規作成"}
        </h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <button
    type="button"
    onClick={() => router.push(editId ? "/cases" : "/new")}
    className="button-base"
    disabled={loading}
  >
    戻る
  </button>

  <button
    type="button"
    onClick={resetForm}
    className="button-base"
    disabled={loading}
  >
    フォームをリセット
  </button>
</div>
      </div>

      <div style={{ opacity: 0.8, marginBottom: 16, fontSize: 13, color: "var(--foreground)" }}>
  現在のモード（{editId ? "DB" : "/new"}から連携）:{" "}
  <b>{modeToText(currentMode)}</b>
</div>

      <section style={card}>
        <div style={{ display: "grid", gap: 14 }}>
          <DetailsGroup title="① 重要事項説明書 (1面)" defaultOpen>
            <Field label="モード（選択）">
              <input
                value={modeToText(currentMode)}
                readOnly
                style={{ ...input, opacity: 0.85 }}
              />
            </Field>

            <Field label="宛名（〜殿の名前だけ）">
              <Input
                value={form.recipient_name}
                onChange={(v) => handleChange("recipient_name", v)}
                placeholder="例：山田太郎"
              />
            </Field>


            <Field label="書面日付 年（数字だけ）">
  <NumericInput
    value={form.doc_year}
    onChange={(v) => handleChange("doc_year", v)}
    placeholder="例：2026"
  />
</Field>


<Field label="書面日付 月（数字だけ）">
  <NumericInput
    value={form.doc_month}
    onChange={(v) => handleChange("doc_month", v)}
    placeholder="例：3"
  />
</Field>

<Field label="書面日付 日（数字だけ）">
  <NumericInput
    value={form.doc_day}
    onChange={(v) => handleChange("doc_day", v)}
    placeholder="例：10"
  />
</Field>

            <Field label="物件名（区分所有建物の名称）">
              <Input
                value={form.property_name}
                onChange={(v) => handleChange("property_name", v)}
                placeholder="例：〇〇レジデンス"
              />
            </Field>

            <Field label="所在地">
              <Input
                value={form.address}
                onChange={(v) => handleChange("address", v)}
                placeholder="例：東京都渋谷区〇〇ー〇〇"
              />
            </Field>

            <Field label="取引の態様 ①（売買 / 交換）">
              <Select
                value={form.transaction_kind}
                onChange={(v) => handleChange("transaction_kind", v)}
                options={["売買", "交換"]}
              />
            </Field>

            <Field label="取引の態様 ②（当事者 / 代理 / 媒介）">
              <Select
                value={form.transaction_role}
                onChange={(v) => handleChange("transaction_role", v)}
                options={["当事者", "代理", "媒介"]}
              />
            </Field>

            <Field label="宅建業者 商号">
              <Input
                value={form.biz_name}
                onChange={(v) => handleChange("biz_name", v)}
                placeholder="例：〇〇不動産"
              />
            </Field>

            <Field label="代表者の氏名">
              <Input
                value={form.biz_representative}
                onChange={(v) => handleChange("biz_representative", v)}
                placeholder="例：桃太郎"
              />
            </Field>

            <Field label="主たる事務所">
              <Input
                value={form.biz_office_address}
                onChange={(v) => handleChange("biz_office_address", v)}
                placeholder="例：東京都新宿区〇〇"
              />
            </Field>

            <Field label="免許証番号">
              <Input
                value={form.biz_license_no}
                onChange={(v) => handleChange("biz_license_no", v)}
                placeholder="例：東京都知事（2）第123456号"
              />
            </Field>

            <Field label="免許年月日">
              <Input
                value={form.biz_license_date}
                onChange={(v) => handleChange("biz_license_date", v)}
                placeholder="例：2026年3月3日"
              />
            </Field>

            <Field label="説明をする宅地建物取引士 氏名">
              <Input
                value={form.agent_name}
                onChange={(v) => handleChange("agent_name", v)}
                placeholder="例：山田花子"
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
                placeholder="例：〇〇事務所"
              />
            </Field>


            <Field label="電話番号">
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: 18 }}>(</span>

    <input
      value={form.agent_tel_area}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 3);
        handleChange("agent_tel_area", v);
      }}
      placeholder="090"
      style={{ ...input, width: 80, textAlign: "center" }}
      inputMode="numeric"
    />

    <span style={{ fontSize: 18 }}>)</span>

    <input
      value={form.agent_tel_local}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
        handleChange("agent_tel_local", v);
      }}
      placeholder="8858"
      style={{ ...input, width: 90, textAlign: "center" }}
      inputMode="numeric"
    />

    <span style={{ fontSize: 18 }}>-</span>

    <input
      value={form.agent_tel_line}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
        handleChange("agent_tel_line", v);
      }}
      placeholder="6432"
      style={{ ...input, width: 90, textAlign: "center" }}
      inputMode="numeric"
    />
  </div>

  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
    ※ 市外局番/携帯先頭は2〜3桁、中央と末尾は最大4桁で入力
  </div>
</Field>


<Field label="室番号（数字だけ）">
  <NumericInput
    value={form.mansion_room_no}
    onChange={(v) => handleChange("mansion_room_no", v)}
    placeholder="例：〇〇〇"
  />
</Field>

            <Field label="棟（テンプレに『棟』あり）">
              <Input
                value={form.mansion_tower}
                onChange={(v) => handleChange("mansion_tower", v)}
                placeholder="例：A / 1"
              />
            </Field>


            <Field label="階（数字だけ）">
  <NumericInput
    value={form.mansion_floor}
    onChange={(v) => handleChange("mansion_floor", v)}
    placeholder="例：5"
  />
</Field>


<Field label="専有面積（数字だけ）">
  <NumericInput
    value={form.mansion_exclusive_area_m2}
    onChange={(v) => handleChange("mansion_exclusive_area_m2", v)}
    placeholder="例：57.80"
    decimal
  />
</Field>


<Field label="登記簿面積（数字だけ）">
  <NumericInput
    value={form.registry_floor_area_m2}
    onChange={(v) => handleChange("registry_floor_area_m2", v)}
    placeholder="例：57.80"
    decimal
  />
</Field>


<Field label="実測面積（数字だけ）">
  <NumericInput
    value={form.site_area_measured}
    onChange={(v) => handleChange("site_area_measured", v)}
    placeholder="例：57.95"
    decimal
  />
</Field>

            <Field label="敷地に関する権利">
              <Input
                value={form.mansion_site_right_type}
                onChange={(v) => handleChange("mansion_site_right_type", v)}
                placeholder="例：所有権"
              />
            </Field>


            <Field label="面積（登記簿）（数字だけ）">
  <NumericInput
    value={form.mansion_site_area_m2}
    onChange={(v) => handleChange("mansion_site_area_m2", v)}
    placeholder="例：150.5"
    decimal
  />
</Field>

<Field label="共有持分 前（『分の』の前の数字）">
  <NumericInput
    value={form.mansion_share_ratio_before}
    onChange={(v) => handleChange("mansion_share_ratio_before", v)}
    placeholder="例：1000"
  />
</Field>


<Field label="共有持分 後（『分の』の後の数字）">
  <NumericInput
    value={form.mansion_share_ratio_after}
    onChange={(v) => handleChange("mansion_share_ratio_after", v)}
    placeholder="例：25"
  />
</Field>

            <Field label="売主住所">
              <Input
                value={form.seller_address}
                onChange={(v) => handleChange("seller_address", v)}
                placeholder="例：東京都新宿区〇〇-1"
              />
            </Field>

            <Field label="売主氏名">
              <Input
                value={form.seller_name}
                onChange={(v) => handleChange("seller_name", v)}
                placeholder="例：山田太郎"
              />
            </Field>
            </DetailsGroup>           

            <DetailsGroup title="② 重要事項説明書 (2面)" defaultOpen>
  <Field label="土地 名義人氏名">
    <Input value={form.land_owner_name} onChange={(v) => handleChange("land_owner_name", v)} />
  </Field>

  <Field label="土地 住所">
    <Input value={form.land_owner_address} onChange={(v) => handleChange("land_owner_address", v)} />
  </Field>

  <Field label="建物 名義人氏名">
    <Input value={form.building_owner_name} onChange={(v) => handleChange("building_owner_name", v)} />
  </Field>

  <Field label="建物 住所">
    <Input value={form.building_owner_address} onChange={(v) => handleChange("building_owner_address", v)} />
  </Field>

  <Field label="土地 所有権に係る権利に関する事項">
  <Textarea value={form.land_rights_related} onChange={(v) => handleChange("land_rights_related", v)} />
</Field>

<Field label="土地 所有権以外の権利に関する事項">
  <Textarea value={form.land_other_rights} onChange={(v) => handleChange("land_other_rights", v)} />
</Field>

<Field label="建物 所有権に係る権利に関する事項">
  <Textarea value={form.building_rights_related} onChange={(v) => handleChange("building_rights_related", v)} />
</Field>

<Field label="建物 所有権以外の権利に関する事項">
  <Textarea value={form.building_other_rights} onChange={(v) => handleChange("building_other_rights", v)} />
</Field>
  <Field label="区域の別">
  <Select
    value={form.urban_planning_area_type}
    onChange={(v) => handleChange("urban_planning_area_type", v)}
    options={URBAN_PLANNING_AREA_TYPE_OPTIONS}
  />
</Field>

  <Field label="都市計画法の制限概要">
    <Textarea value={form.urban_planning_summary} onChange={(v) => handleChange("urban_planning_summary", v)} />
  </Field>

  <Field label="用途地域名">
    <Input value={form.use_district} onChange={(v) => handleChange("use_district", v)} placeholder="例：第一種住居地域" />
  </Field>

  <Field label="用途地域の制限内容">
    <Textarea value={form.use_district_summary} onChange={(v) => handleChange("use_district_summary", v)} />
  </Field>

  <Field label="地域・地区・街区名等">
    <Input value={form.other_area_district} onChange={(v) => handleChange("other_area_district", v)} />
  </Field>

  <Field label="その制限内容">
    <Textarea value={form.other_area_district_summary} onChange={(v) => handleChange("other_area_district_summary", v)} />
  </Field>

  <Field label="建築面積の限度：敷地面積（数字のみ・小数可）">
  <NumericInput
    value={form.building_coverage_calc_site_area}
    onChange={(v) => handleChange("building_coverage_calc_site_area", v)}
    decimal
    placeholder="例：120.55"
  />
</Field>

<Field label="建築面積の限度：控除面積（数字のみ・小数可）">
  <NumericInput
    value={form.building_coverage_calc_deduction_area}
    onChange={(v) => handleChange("building_coverage_calc_deduction_area", v)}
    decimal
    placeholder="例：0"
  />
</Field>
  <Field label="建ぺい率(少数表記推奨)">
  <NumericInput
  value={form.building_coverage}
  onChange={(v) => handleChange("building_coverage", v)}
  decimal
    placeholder="例：0.6"
  />
</Field>
<Field label="建築面積の限度：計算結果（数字のみ・小数可）">
  <NumericInput
    value={form.building_coverage_calc_limit_area}
    onChange={(v) => handleChange("building_coverage_calc_limit_area", v)}
    decimal
    placeholder="例：84.38"
  />
</Field>
<Field label="延建築面積の限度：敷地面積（数字のみ・小数可）">
  <NumericInput
    value={form.floor_area_ratio_calc_site_area}
    onChange={(v) => handleChange("floor_area_ratio_calc_site_area", v)}
    decimal
    placeholder="例：120.55"
  />
</Field>

<Field label="延建築面積の限度：控除面積（数字のみ・小数可）">
  <NumericInput
    value={form.floor_area_ratio_calc_deduction_area}
    onChange={(v) => handleChange("floor_area_ratio_calc_deduction_area", v)}
    decimal
    placeholder="例：0"
  />
</Field>
<Field label="容積率(少数表記推奨)">

<NumericInput
  value={form.floor_area_ratio}
  onChange={(v) => handleChange("floor_area_ratio", v)}
  decimal
    placeholder="例：0.2"
  />
</Field>
<Field label="延建築面積の限度：計算結果（数字のみ・小数可）">
  <NumericInput
    value={form.floor_area_ratio_calc_limit_area}
    onChange={(v) => handleChange("floor_area_ratio_calc_limit_area", v)}
    decimal
    placeholder="例：120.55"
  />
</Field>
  <Field label="敷地等と道路との関係">
    <Textarea value={form.road_relation} onChange={(v) => handleChange("road_relation", v)} />
  </Field>

  <Field label="私道の変更又は廃止の制限">
    <Textarea value={form.private_road_restriction} onChange={(v) => handleChange("private_road_restriction", v)} />
  </Field>
  </DetailsGroup>

<DetailsGroup title="③ 重要事項説明書 (3面)" defaultOpen>
  <Field label="法令名 1">
    <Input value={form.law_name_1} onChange={(v) => handleChange("law_name_1", v)} />
  </Field>

  <Field label="制限概要 1">
    <Textarea value={form.law_summary_1} onChange={(v) => handleChange("law_summary_1", v)} />
  </Field>

  <Field label="法令名 2">
    <Input value={form.law_name_2} onChange={(v) => handleChange("law_name_2", v)} />
  </Field>

  <Field label="制限概要 2">
    <Textarea value={form.law_summary_2} onChange={(v) => handleChange("law_summary_2", v)} />
  </Field>

  <Field label="法令名 3">
    <Input value={form.law_name_3} onChange={(v) => handleChange("law_name_3", v)} />
  </Field>

  <Field label="制限概要 3">
    <Textarea value={form.law_summary_3} onChange={(v) => handleChange("law_summary_3", v)} />
  </Field>

  <Field label="法令名 4">
    <Input value={form.law_name_4} onChange={(v) => handleChange("law_name_4", v)} />
  </Field>

  <Field label="制限概要 4">
    <Textarea value={form.law_summary_4} onChange={(v) => handleChange("law_summary_4", v)} />
  </Field>

  <Field label="私道負担の有無">
    <Select
      value={form.private_road_burden_exists}
      onChange={(v) => handleChange("private_road_burden_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="私道負担 面積（数字のみ・小数可）">
    <NumericInput
      value={form.private_road_area}
      onChange={(v) => handleChange("private_road_area", v)}
      decimal
      placeholder="例：12.50"
    />
  </Field>

  <Field label="私道負担 金額（数字のみ）">
  <MoneyInput
  value={form.private_road_price}
  onChange={(v) => handleChange("private_road_price", v)}
  placeholder="例：6000000"
/>
  </Field>

  <Field label="私道負担 備考">
    <Textarea value={form.private_road_note} onChange={(v) => handleChange("private_road_note", v)} />
  </Field>

  <Field label="飲用水（直ちに利用可能）">
    <Select
      value={form.water_supply_type}
      onChange={(v) => handleChange("water_supply_type", v)}
      options={["", "公営", "私営", "井戸"]}
    />
  </Field>

  <Field label="飲用水（施設整備予定日）">
  <ScheduleDateInputs
    year={form.water_facility_schedule_year}
    month={form.water_facility_schedule_month}
    day={form.water_facility_schedule_day}
    onYearChange={(v) => handleChange("water_facility_schedule_year", v)}
    onMonthChange={(v) => handleChange("water_facility_schedule_month", v)}
    onDayChange={(v) => handleChange("water_facility_schedule_day", v)}
  />
</Field>

  <Field label="飲用水（施設の整備予定）">
    <Select
      value={form.water_facility_schedule_type}
      onChange={(v) => handleChange("water_facility_schedule_type", v)}
      options={["", "公営", "私営", "井戸"]}
    />
  </Field>

  <Field label="飲用水 特別負担の有無">
  <Select
    value={form.water_special_burden_exists}
    onChange={(v) =>
      handleSpecialBurdenChange(
        "water_special_burden_exists",
        "water_special_burden_amount",
        v
      )
    }
    options={["", "有", "無"]}
  />
</Field>

{form.water_special_burden_exists === "有" && (
  <Field label="飲用水 負担額">
    <MoneyInput
      value={form.water_special_burden_amount}
      onChange={(v) => handleChange("water_special_burden_amount", v)}
      placeholder="例：600000"
    />
  </Field>
)}

  <Field label="電気（直ちに利用可能）">
  <Input
    value={form.electric_supply_available}
    onChange={(v) => handleChange("electric_supply_available", v)}
    placeholder="例：有 / 供給あり / など"
  />
</Field>

<Field label="電気（施設整備予定日）">
  <ScheduleDateInputs
    year={form.electric_facility_schedule_year}
    month={form.electric_facility_schedule_month}
    day={form.electric_facility_schedule_day}
    onYearChange={(v) => handleChange("electric_facility_schedule_year", v)}
    onMonthChange={(v) => handleChange("electric_facility_schedule_month", v)}
    onDayChange={(v) => handleChange("electric_facility_schedule_day", v)}
  />
</Field>

<Field label="電気 特別負担の有無">
  <Select
    value={form.electric_special_burden_exists}
    onChange={(v) =>
      handleSpecialBurdenChange(
        "electric_special_burden_exists",
        "electric_special_burden_amount",
        v
      )
    }
    options={["", "有", "無"]}
  />
</Field>

{form.electric_special_burden_exists === "有" && (
  <Field label="電気 負担額">
    <MoneyInput
      value={form.electric_special_burden_amount}
      onChange={(v) => handleChange("electric_special_burden_amount", v)}
      placeholder="例：300000"
    />
  </Field>
)}

  <Field label="ガス（直ちに利用可能）">
    <Select
      value={form.gas_type}
      onChange={(v) => handleChange("gas_type", v)}
      options={["", "都市", "プロパン"]}
    />
  </Field>

  <Field label="ガス（施設整備予定日）">
  <ScheduleDateInputs
    year={form.gas_facility_schedule_year}
    month={form.gas_facility_schedule_month}
    day={form.gas_facility_schedule_day}
    onYearChange={(v) => handleChange("gas_facility_schedule_year", v)}
    onMonthChange={(v) => handleChange("gas_facility_schedule_month", v)}
    onDayChange={(v) => handleChange("gas_facility_schedule_day", v)}
  />
</Field>

  <Field label="ガス（施設の整備予定）">
    <Select
      value={form.gas_facility_schedule_type}
      onChange={(v) => handleChange("gas_facility_schedule_type", v)}
      options={["", "都市", "プロパン"]}
    />
  </Field>

  <Field label="ガス 特別負担の有無">
  <Select
    value={form.gas_special_burden_exists}
    onChange={(v) =>
      handleSpecialBurdenChange(
        "gas_special_burden_exists",
        "gas_special_burden_amount",
        v
      )
    }
    options={["", "有", "無"]}
  />
</Field>

{form.gas_special_burden_exists === "有" && (
  <Field label="ガス 負担額">
    <MoneyInput
      value={form.gas_special_burden_amount}
      onChange={(v) => handleChange("gas_special_burden_amount", v)}
      placeholder="例：450000"
    />
  </Field>
)}

  <Field label="排水（直ちに利用可能）">
  <Input
    value={form.drainage_supply_available}
    onChange={(v) => handleChange("drainage_supply_available", v)}
    placeholder="例：公共下水 / 浄化槽 / など"
  />
</Field>

<Field label="排水（施設整備予定日）">
  <ScheduleDateInputs
    year={form.drainage_facility_schedule_year}
    month={form.drainage_facility_schedule_month}
    day={form.drainage_facility_schedule_day}
    onYearChange={(v) => handleChange("drainage_facility_schedule_year", v)}
    onMonthChange={(v) => handleChange("drainage_facility_schedule_month", v)}
    onDayChange={(v) => handleChange("drainage_facility_schedule_day", v)}
  />
</Field>

<Field label="排水（整備後の方式）">
  <Input
    value={form.drainage_facility_schedule_detail}
    onChange={(v) => handleChange("drainage_facility_schedule_detail", v)}
    placeholder="例：公共下水 / 合併浄化槽 / 汲取り / 未定"
  />
</Field>

<Field label="排水 特別負担の有無">
  <Select
    value={form.drainage_special_burden_exists}
    onChange={(v) =>
      handleSpecialBurdenChange(
        "drainage_special_burden_exists",
        "drainage_special_burden_amount",
        v
      )
    }
    options={["", "有", "無"]}
  />
</Field>

{form.drainage_special_burden_exists === "有" && (
  <Field label="排水 負担額">
    <MoneyInput
      value={form.drainage_special_burden_amount}
      onChange={(v) => handleChange("drainage_special_burden_amount", v)}
      placeholder="例：800000"
    />
  </Field>
)}

  <Field label="浄化槽施設の必要">
    <Select
      value={form.septic_tank_required}
      onChange={(v) => handleChange("septic_tank_required", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="インフラ備考">
    <Textarea value={form.infra_note} onChange={(v) => handleChange("infra_note", v)} />
  </Field>

  <Field label="形状及び構造">
    <Textarea value={form.structure_summary} onChange={(v) => handleChange("structure_summary", v)} />
  </Field>

  <Field label="宅地に接する道路の幅員及び構造">
    <Textarea value={form.road_summary} onChange={(v) => handleChange("road_summary", v)} />
  </Field>
</DetailsGroup>

<DetailsGroup title="④ 重要事項説明書 (4面)" defaultOpen>
  <Field label="形状及び構造">
    <Textarea
      value={form.building_structure}
      onChange={(v) => handleChange("building_structure", v)}
      placeholder="例：鉄筋コンクリート造、陸屋根"
    />
  </Field>

  <Field label="主要構造部、内装及び外装の構造・仕上げ">
    <Textarea
      value={form.building_finish}
      onChange={(v) => handleChange("building_finish", v)}
      placeholder="例：外壁タイル張り、内装クロス仕上げ、床フローリング"
    />
  </Field>

  <Field label="設置する設備">
    <Textarea
      value={form.equipment_installation}
      onChange={(v) => handleChange("equipment_installation", v)}
      placeholder="例：エレベーター、オートロック、宅配ボックス"
    />
  </Field>

  <Field label="設備の構造">
    <Textarea
      value={form.equipment_structure}
      onChange={(v) => handleChange("equipment_structure", v)}
      placeholder="例：RC造機械室あり、配管スペースあり"
    />
  </Field>

  <Field label="実測面積（数字のみ・小数可）">
  <NumericInput
    value={form.building_rights_measured_area}
    onChange={(v) => handleChange("building_rights_measured_area", v)}
    decimal
    placeholder="例：57.80"
  />
</Field>

<Field label="登記簿面積（数字のみ・小数可）">
  <NumericInput
    value={form.building_rights_registry_area}
    onChange={(v) => handleChange("building_rights_registry_area", v)}
    decimal
    placeholder="例：57.80"
  />
</Field>

<Field label="建築確認の対象面積（数字のみ・小数可）">
  <NumericInput
    value={form.building_confirmation_area}
    onChange={(v) => handleChange("building_confirmation_area", v)}
    decimal
    placeholder="例：57.80"
  />
</Field>

<Field label="権利の種類">
  <Select
    value={form.building_rights_type}
    onChange={(v) => {
      handleChange("building_rights_type", v);
      if (v !== "その他") {
        handleChange("building_rights_other_detail", "");
      }
    }}
    options={["", "所有権", "地上権", "賃借権", "その他"]}
  />
</Field>

{form.building_rights_type === "その他" && (
  <Field label="権利の種類（その他の内容）">
    <Input
      value={form.building_rights_other_detail}
      onChange={(v) => handleChange("building_rights_other_detail", v)}
      placeholder="例：使用貸借権"
    />
  </Field>
)}

{form.building_rights_type && form.building_rights_type !== "所有権" && (
  <>
    <Field label="対象面積の種別">
      <Select
        value={form.non_ownership_target_area_type}
        onChange={(v) => handleChange("non_ownership_target_area_type", v)}
        options={["", "登記簿", "実測"]}
      />
    </Field>

    <Field label="対象面積（数字のみ・小数可）">
      <NumericInput
        value={form.non_ownership_target_area}
        onChange={(v) => handleChange("non_ownership_target_area", v)}
        decimal
        placeholder="例：57.80"
      />
    </Field>

    <Field label="存続期間">
      <ScheduleDateInputs
        year={form.non_ownership_period_year}
        month={form.non_ownership_period_month}
        day={form.non_ownership_period_day}
        onYearChange={(v) => handleChange("non_ownership_period_year", v)}
        onMonthChange={(v) => handleChange("non_ownership_period_month", v)}
        onDayChange={(v) => handleChange("non_ownership_period_day", v)}
      />
    </Field>

    <Field label="区分所有者の負担額">
      <MoneyInput
        value={form.non_ownership_holder_burden_amount}
        onChange={(v) => handleChange("non_ownership_holder_burden_amount", v)}
        placeholder="例：600000"
      />
    </Field>
   
  </>
)}
<Field label="共用部分に関する規約等">
  <Textarea
    value={form.common_area_rules}
    onChange={(v) => handleChange("common_area_rules", v)}
    placeholder="例：管理規約によりバルコニー・廊下・階段等は共用部分と定められている"
  />
</Field>

<Field label="専有部分の用途その他の利用制限">
  <Textarea
    value={form.exclusive_use_restrictions}
    onChange={(v) => handleChange("exclusive_use_restrictions", v)}
    placeholder="例：住居専用。民泊禁止。楽器演奏は規約に従う"
  />
</Field>
</DetailsGroup>

<DetailsGroup title="⑤ 重要事項説明書 (5面)" defaultOpen>
  <Field label="駐車場 使用者">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Input
        value={form.parking_user_1}
        onChange={(v) => handleChange("parking_user_1", v)}
        placeholder="1人目"
      />
      <Input
        value={form.parking_user_2}
        onChange={(v) => handleChange("parking_user_2", v)}
        placeholder="2人目"
      />
    </div>
  </Field>

  <Field label="駐車場 使用料の有無">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Select
        value={form.parking_fee_exists_1}
        onChange={(v) => handleChange("parking_fee_exists_1", v)}
        options={["", "有", "無"]}
      />
      <Select
        value={form.parking_fee_exists_2}
        onChange={(v) => handleChange("parking_fee_exists_2", v)}
        options={["", "有", "無"]}
      />
    </div>
  </Field>

  <Field label="駐車場 使用料の帰属先等">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Input
        value={form.parking_fee_recipient_1}
        onChange={(v) => handleChange("parking_fee_recipient_1", v)}
        placeholder="1人目"
      />
      <Input
        value={form.parking_fee_recipient_2}
        onChange={(v) => handleChange("parking_fee_recipient_2", v)}
        placeholder="2人目"
      />
    </div>
  </Field>

  <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
    <div style={{ fontWeight: 800 }}>その他の専用使用部分</div>

    {(Array.isArray(form.other_exclusive_use_parts) ? form.other_exclusive_use_parts : []).map((row, index) => (
      <div
        key={index}
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <Field label={`専用使用部分 ${index + 1}`}>
          <Input
            value={row.part}
            onChange={(v) =>
              updateOtherExclusiveUsePartRow(index, "part", v)
            }
            placeholder="例：専用庭 / ルーフバルコニー"
          />
        </Field>

        {row.part.trim() !== "" && (
          <>
            <Field label="専用使用料の有無">
              <Select
                value={row.fee_exists}
                onChange={(v) =>
                  updateOtherExclusiveUsePartRow(index, "fee_exists", v)
                }
                options={["", "有", "無"]}
              />
            </Field>

            <Field label="専用使用料の帰属先">
              <Input
                value={row.fee_recipient}
                onChange={(v) =>
                  updateOtherExclusiveUsePartRow(index, "fee_recipient", v)
                }
                placeholder="例：管理組合"
              />
            </Field>
          </>
        )}

<button
  type="button"
  onClick={() => removeOtherExclusiveUsePartRow(index)}
  className="button-base"
>
  この行を削除
</button>
      </div>
    ))}

<button
  type="button"
  onClick={addOtherExclusiveUsePartRow}
  className="button-base"
>
  専用使用部分を追加
</button>
  </div>

  <Field label="（5）費用を特定の者にのみ減免する旨の規約等の定め">
  <Textarea
    value={form.fee_reduction_rules}
    onChange={(v) => handleChange("fee_reduction_rules", v)}
    placeholder="例：1階住戸はエレベーター保守費の一部を免除する旨の定めあり"
  />
</Field>

<Field label="（6）規約等の定め">
  <Textarea
    value={form.repair_reserve_rules}
    onChange={(v) => handleChange("repair_reserve_rules", v)}
    placeholder="例：長期修繕計画に基づき修繕積立金を徴収する旨の定めあり"
  />
</Field>

<Field label="既に積み立てられている額">
  <MoneyInput
    value={form.repair_reserve_accumulated_amount}
    onChange={(v) => handleChange("repair_reserve_accumulated_amount", v)}
    placeholder="例：12000000"
  />
</Field>

<Field label="既に積み立てられている額の現在日">
  <ScheduleDateInputs
    year={form.repair_reserve_accumulated_year}
    month={form.repair_reserve_accumulated_month}
    day={form.repair_reserve_accumulated_day}
    onYearChange={(v) => handleChange("repair_reserve_accumulated_year", v)}
    onMonthChange={(v) => handleChange("repair_reserve_accumulated_month", v)}
    onDayChange={(v) => handleChange("repair_reserve_accumulated_day", v)}
  />
</Field>

<Field label="当該一棟の建物に係る滞納額">
  <MoneyInput
    value={form.building_arrears_amount}
    onChange={(v) => handleChange("building_arrears_amount", v)}
    placeholder="例：500000"
  />
</Field>

<Field label="当該一棟の建物に係る滞納額の現在日">
  <ScheduleDateInputs
    year={form.building_arrears_year}
    month={form.building_arrears_month}
    day={form.building_arrears_day}
    onYearChange={(v) => handleChange("building_arrears_year", v)}
    onMonthChange={(v) => handleChange("building_arrears_month", v)}
    onDayChange={(v) => handleChange("building_arrears_day", v)}
  />
</Field>

<Field label="専有部分に係る滞納額">
  <MoneyInput
    value={form.unit_arrears_amount}
    onChange={(v) => handleChange("unit_arrears_amount", v)}
    placeholder="例：30000"
  />
</Field>

<Field label="専有部分に係る滞納額の現在日">
  <ScheduleDateInputs
    year={form.unit_arrears_year}
    month={form.unit_arrears_month}
    day={form.unit_arrears_day}
    onYearChange={(v) => handleChange("unit_arrears_year", v)}
    onMonthChange={(v) => handleChange("unit_arrears_month", v)}
    onDayChange={(v) => handleChange("unit_arrears_day", v)}
  />
</Field>

<Field label="（7）通常の管理費用の額">
  <MoneyInput
    value={form.monthly_management_fee}
    onChange={(v) => handleChange("monthly_management_fee", v)}
    placeholder="例：15000"
  />
</Field>

<Field label="通常の管理費用の額の現在日">
  <ScheduleDateInputs
    year={form.monthly_management_fee_year}
    month={form.monthly_management_fee_month}
    day={form.monthly_management_fee_day}
    onYearChange={(v) => handleChange("monthly_management_fee_year", v)}
    onMonthChange={(v) => handleChange("monthly_management_fee_month", v)}
    onDayChange={(v) => handleChange("monthly_management_fee_day", v)}
  />
</Field>

<Field label="（滞納額）">
  <MoneyInput
    value={form.monthly_management_fee_arrears}
    onChange={(v) => handleChange("monthly_management_fee_arrears", v)}
    placeholder="例：0"
  />
</Field>

<Field label="滞納額の現在日">
  <ScheduleDateInputs
    year={form.monthly_management_fee_arrears_year}
    month={form.monthly_management_fee_arrears_month}
    day={form.monthly_management_fee_arrears_day}
    onYearChange={(v) => handleChange("monthly_management_fee_arrears_year", v)}
    onMonthChange={(v) => handleChange("monthly_management_fee_arrears_month", v)}
    onDayChange={(v) => handleChange("monthly_management_fee_arrears_day", v)}
  />
</Field>

<Field label="（8）管理の委託先 氏名（商号又は名称）">
  <Input
    value={form.management_company_name}
    onChange={(v) => handleChange("management_company_name", v)}
    placeholder="例：株式会社〇〇管理"
  />
</Field>
<Field label="管理の委託先 住所（主たる事務所の所在地）">
  <Textarea
    value={form.management_company_address}
    onChange={(v) => handleChange("management_company_address", v)}
    placeholder="例：東京都新宿区〇〇1-2-3"
  />
</Field>
</DetailsGroup>

<DetailsGroup title="⑥ 重要事項説明書 (6面)" defaultOpen>
  <Field label="（9）建物の維持修繕の実施状況の記録（共用部分）">
    <Textarea
      value={form.maintenance_common}
      onChange={(v) => handleChange("maintenance_common", v)}
      placeholder="例：外壁改修工事実施済み、屋上防水工事実施済み"
    />
  </Field>

  <Field label="（9）建物の維持修繕の実施状況の記録（専有部分）">
    <Textarea
      value={form.maintenance_private}
      onChange={(v) => handleChange("maintenance_private", v)}
      placeholder="例：給湯器交換済み、内装リフォーム実施済み"
    />
  </Field>

  <Field label="（10）その他">
    <Textarea
      value={form.page6_other}
      onChange={(v) => handleChange("page6_other", v)}
      placeholder="例：特記事項があれば入力"
    />
  </Field>

  <Field label="7 建物状況調査の実施の有無">
  <Select
    value={form.building_survey_exists}
    onChange={(v) => {
      handleChange("building_survey_exists", v);
      if (v !== "有") {
        handleChange("building_survey_summary", "");
      }
    }}
    options={["", "有", "無"]}
  />
</Field>

{form.building_survey_exists === "有" && (
  <Field label="7 建物状況調査の結果の概要">
    <Textarea
      value={form.building_survey_summary}
      onChange={(v) => handleChange("building_survey_summary", v)}
      placeholder="例：雨漏り・給排水管路・構造耐力上主要な部分について調査実施"
    />
  </Field>
)}

  <Field label="8 確認申請書及び添付図書並びに確認済証（新築時のもの）">
    <Select
      value={form.confirmation_docs_exists}
      onChange={(v) => handleChange("confirmation_docs_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 検査済証（新築時のもの）">
    <Select
      value={form.inspection_cert_exists}
      onChange={(v) => handleChange("inspection_cert_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 確認申請書及び添付図書並びに確認済証（増改築等のときのもの）">
    <Select
      value={form.renovation_confirmation_docs_exists}
      onChange={(v) =>
        handleChange("renovation_confirmation_docs_exists", v)
      }
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 検査済証（増改築等のときのもの）">
    <Select
      value={form.renovation_inspection_cert_exists}
      onChange={(v) =>
        handleChange("renovation_inspection_cert_exists", v)
      }
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 建物状況調査結果報告書">
    <Select
      value={form.survey_report_exists}
      onChange={(v) => handleChange("survey_report_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 既存住宅性能評価書">
    <Select
      value={form.performance_eval_exists}
      onChange={(v) => handleChange("performance_eval_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 定期調査報告書">
    <Select
      value={form.periodic_report_exists}
      onChange={(v) => handleChange("periodic_report_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="8 新耐震基準等に適合していることを証する書類">
    <Select
      value={form.seismic_doc_exists}
      onChange={(v) => {
        handleChange("seismic_doc_exists", v);
        if (v !== "有") {
          handleChange("seismic_doc_name", "");
        }
      }}
      options={["", "有", "無"]}
    />
  </Field>

  {form.seismic_doc_exists === "有" && (
    <Field label="8 書類名">
      <Input
        value={form.seismic_doc_name}
        onChange={(v) => handleChange("seismic_doc_name", v)}
        placeholder="例：耐震基準適合証明書"
      />
    </Field>
  )}
</DetailsGroup>

<DetailsGroup title="⑦ 重要事項説明書 (7面)" defaultOpen>
  <Field label="7ページ目 備考">
    <Textarea
      value={form.page7_notes}
      onChange={(v) => handleChange("page7_notes", v)}
      placeholder="例：災害関係・調査関係の補足"
    />
  </Field>

  <Field label="9 造成宅地防災区域">
    <Select
      value={form.developed_disaster_area}
      onChange={(v) => handleChange("developed_disaster_area", v)}
      options={["", "区域内", "区域外"]}
    />
  </Field>

  <Field label="10 土砂災害警戒区域">
    <Select
      value={form.sediment_disaster_area}
      onChange={(v) => handleChange("sediment_disaster_area", v)}
      options={["", "区域内", "区域外"]}
    />
  </Field>

  <Field label="11 津波災害警戒区域">
    <Select
      value={form.tsunami_disaster_area}
      onChange={(v) => handleChange("tsunami_disaster_area", v)}
      options={["", "区域内", "区域外"]}
    />
  </Field>

  <Field label="12 洪水">
    <Select
      value={form.hazard_flood_exists}
      onChange={(v) => handleChange("hazard_flood_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="12 雨水出水（内水）">
    <Select
      value={form.hazard_inland_flood_exists}
      onChange={(v) => handleChange("hazard_inland_flood_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="12 高潮">
    <Select
      value={form.hazard_tide_exists}
      onChange={(v) => handleChange("hazard_tide_exists", v)}
      options={["", "有", "無"]}
    />
  </Field>

  <Field label="12 水害ハザードマップにおける所在地">
    <Textarea
      value={form.hazard_map_location}
      onChange={(v) => handleChange("hazard_map_location", v)}
      placeholder="例：洪水浸水想定区域0.5m未満、高潮浸水想定区域外"
    />
  </Field>

  <Field label="13 石綿使用調査結果の記録の有無">
    <Select
      value={form.asbestos_record_exists}
      onChange={(v) => {
        handleChange("asbestos_record_exists", v);
        if (v !== "有") {
          handleChange("asbestos_record_content", "");
        }
      }}
      options={["", "有", "無"]}
    />
  </Field>

  {form.asbestos_record_exists === "有" && (
    <Field label="13 石綿使用調査の内容">
      <Textarea
        value={form.asbestos_record_content}
        onChange={(v) => handleChange("asbestos_record_content", v)}
        placeholder="例：吹付け材・成形板等について調査済み"
      />
    </Field>
  )}

  <Field label="14 耐震診断の有無">
    <Select
      value={form.seismic_diagnosis_exists}
      onChange={(v) => {
        handleChange("seismic_diagnosis_exists", v);
        if (v !== "有") {
          handleChange("seismic_diagnosis_content", "");
        }
      }}
      options={["", "有", "無"]}
    />
  </Field>

  {form.seismic_diagnosis_exists === "有" && (
    <Field label="14 耐震診断の内容">
      <Textarea
        value={form.seismic_diagnosis_content}
        onChange={(v) => handleChange("seismic_diagnosis_content", v)}
        placeholder="例：耐震診断実施済み、Is値0.7以上"
      />
    </Field>
  )}

<Field label="15 登録住宅性能評価機関による住宅性能評価書の交付の有無">
  <Select
    value={form.new_house_performance_eval_delivery_exists}
    onChange={(v) => {
      handleChange("new_house_performance_eval_delivery_exists", v);

      if (v !== "有") {
        handleChange("design_housing_performance_eval_exists", "");
        handleChange("construction_housing_performance_eval_exists", "");
      }
    }}
    options={["", "有", "無"]}
  />
</Field>

{form.new_house_performance_eval_delivery_exists === "有" && (
  <>
    <Field label="15 設計住宅性能評価書">
      <Select
        value={form.design_housing_performance_eval_exists}
        onChange={(v) =>
          handleChange("design_housing_performance_eval_exists", v)
        }
        options={["", "有", "無"]}
      />
    </Field>

    <Field label="15 建設住宅性能評価書">
      <Select
        value={form.construction_housing_performance_eval_exists}
        onChange={(v) =>
          handleChange("construction_housing_performance_eval_exists", v)
        }
        options={["", "有", "無"]}
      />
    </Field>
  </>
)}
</DetailsGroup>

<DetailsGroup title="⑧ 重要事項説明書 (8面)" defaultOpen>
  <div style={{ fontWeight: 800 }}>1 代金及び交換差金以外に授受される金額</div>

  {(Array.isArray(form.extra_money_rows) ? form.extra_money_rows : []).map((row, index) => (
    <div
      key={index}
      style={{
        padding: "8px 0",
        display: "grid",
        gap: 10,
        marginBottom: 10,
      }}
    >
      <Field label={`金額 ${index + 1}`}>
        <MoneyInput
          value={row.amount}
          onChange={(v) => updateExtraMoneyRow(index, "amount", v)}
          placeholder="例：100000"
        />
      </Field>

      <Field label={`授受の目的 ${index + 1}`}>
        <Input
          value={row.purpose}
          onChange={(v) => updateExtraMoneyRow(index, "purpose", v)}
          placeholder="例：修繕積立基金、管理準備金"
        />
      </Field>

      <button
  type="button"
  onClick={() => removeExtraMoneyRow(index)}
  className="button-base"
>
  この行を削除
</button>
    </div>
  ))}

<button
  type="button"
  onClick={addExtraMoneyRow}
  className="button-base"
>
  金額項目を追加
</button>

  <Field label="2 契約の解除に関する事項">
    <Textarea
      value={form.contract_cancellation_terms}
      onChange={(v) => handleChange("contract_cancellation_terms", v)}
      placeholder="例：手付解除、ローン特約解除等"
    />
  </Field>

  <Field label="3 損害賠償額の予定又は違約金に関する事項">
    <Textarea
      value={form.penalty_terms}
      onChange={(v) => handleChange("penalty_terms", v)}
      placeholder="例：違約金は売買代金の20%相当額"
    />
  </Field>

  <div style={{ fontWeight: 800, marginTop: 8 }}>
    4 手付金等の保全措置の概要（未完成物件）
  </div>

  <Field label="保全の方式（未完成物件）">
    <Select
      value={form.incomplete_property_preservation_method}
      onChange={(v) => handleChange("incomplete_property_preservation_method", v)}
      options={[
        "",
        "保証委託契約",
        "保証保険契約",
      ]}
    />
  </Field>

  <Field label="保全措置を行う機関（未完成物件）">
    <Input
      value={form.incomplete_property_preservation_institution}
      onChange={(v) =>
        handleChange("incomplete_property_preservation_institution", v)
      }
      placeholder="例：〇〇保証株式会社"
    />
  </Field>

  <div style={{ fontWeight: 800, marginTop: 8 }}>
    4 手付金等の保全措置の概要（完成物件）
  </div>

  <Field label="保全の方式（完成物件）">
    <Select
      value={form.completed_property_preservation_method}
      onChange={(v) => handleChange("completed_property_preservation_method", v)}
      options={[
        "",
        "保証委託契約",
        "保証保険契約",
        "手付金等寄託契約及び質権設定契約",
      ]}
    />
  </Field>

  <Field label="保全措置を行う機関（完成物件）">
    <Input
      value={form.completed_property_preservation_institution}
      onChange={(v) =>
        handleChange("completed_property_preservation_institution", v)
      }
      placeholder="例：〇〇保証株式会社"
    />
  </Field>

  <div style={{ fontWeight: 800, marginTop: 8 }}>
    5 支払金又は預り金の保全措置の概要
  </div>

  <Field label="保全措置を講ずるかどうか">
    <Select
      value={form.deposit_preservation_needed}
      onChange={(v) => {
        handleChange("deposit_preservation_needed", v);
        if (v !== "講ずる") {
          handleChange("deposit_preservation_institution", "");
        }
      }}
      options={["", "講ずる", "講じない"]}
    />
  </Field>

  {form.deposit_preservation_needed === "講ずる" && (
    <Field label="保全措置を行う機関">
      <Input
        value={form.deposit_preservation_institution}
        onChange={(v) => handleChange("deposit_preservation_institution", v)}
        placeholder="例：〇〇信託銀行"
      />
    </Field>
  )}
</DetailsGroup>

<DetailsGroup title="⑨ 重要事項説明書 (9面)" defaultOpen>
  <div style={{ fontWeight: 800 }}>6 金銭の貸借のあっせん</div>

  <Field label="業者による金銭貸借のあっせんの有無">
    <Select
      value={form.loan_mediation_exists}
      onChange={(v) => {
        handleChange("loan_mediation_exists", v);

        if (v !== "有") {
          handleChange("loan_bank_name", "");
          handleChange("loan_amount", "");
          handleChange("loan_period", "");
          handleChange("loan_interest_rate", "");
          handleChange("loan_repayment_method", "");
          handleChange("loan_guarantee_fee", "");
          handleChange("loan_admin_fee", "");
          handleChange("loan_other", "");
          handleChange("loan_failure_measures", "");
        }
      }}
      options={["", "有", "無"]}
    />
  </Field>

  {form.loan_mediation_exists === "有" && (
    <>
      <Field label="融資取扱金融機関">
        <Input
          value={form.loan_bank_name}
          onChange={(v) => handleChange("loan_bank_name", v)}
          placeholder="例：〇〇銀行"
        />
      </Field>

      <Field label="融資額（数字のみ）">
        <MoneyInput
          value={form.loan_amount}
          onChange={(v) => handleChange("loan_amount", v)}
          placeholder="例：30000000"
        />
      </Field>

      <Field label="融資期間">
        <Input
          value={form.loan_period}
          onChange={(v) => handleChange("loan_period", v)}
          placeholder="例：35年"
        />
      </Field>

      <Field label="利率">
        <Input
          value={form.loan_interest_rate}
          onChange={(v) => handleChange("loan_interest_rate", v)}
          placeholder="例：年0.625%"
        />
      </Field>

      <Field label="返済方法">
        <Input
          value={form.loan_repayment_method}
          onChange={(v) => handleChange("loan_repayment_method", v)}
          placeholder="例：元利均等返済"
        />
      </Field>

      <Field label="保証料（数字のみ）">
        <MoneyInput
          value={form.loan_guarantee_fee}
          onChange={(v) => handleChange("loan_guarantee_fee", v)}
          placeholder="例：0"
        />
      </Field>

      <Field label="ローン事務手数料（数字のみ）">
        <MoneyInput
          value={form.loan_admin_fee}
          onChange={(v) => handleChange("loan_admin_fee", v)}
          placeholder="例：55000"
        />
      </Field>

      <Field label="その他">
        <Input
          value={form.loan_other}
          onChange={(v) => handleChange("loan_other", v)}
          placeholder="例：団信加入要"
        />
      </Field>

      <Field label="金銭の貸借が成立しないときの措置">
        <Textarea
          value={form.loan_failure_measures}
          onChange={(v) => handleChange("loan_failure_measures", v)}
          placeholder="例：ローン特約により契約解除"
        />
      </Field>
    </>
  )}

  <div style={{ fontWeight: 800, marginTop: 8 }}>
    7 担保責任の履行に関する措置の概要
  </div>

  <Field label="担保責任の履行に関する措置を講ずるかどうか">
    <Select
      value={form.liability_measures_exists}
      onChange={(v) => {
        handleChange("liability_measures_exists", v);
        if (v !== "講ずる") {
          handleChange("liability_measures_content", "");
        }
      }}
      options={["", "講ずる", "講じない"]}
    />
  </Field>

  {form.liability_measures_exists === "講ずる" && (
    <Field label="担保責任の履行に関する措置の内容">
      <Textarea
        value={form.liability_measures_content}
        onChange={(v) => handleChange("liability_measures_content", v)}
        placeholder="例：既存住宅売買瑕疵保険加入予定"
      />
    </Field>
  )}

<div style={{ fontWeight: 800, marginTop: 8 }}>
  8 割賦販売に係る事項
</div>

<Field label="① 現金販売価格（数字のみ）">
  <MoneyInput
    value={form.cash_price}
    onChange={(v) => handleChange("cash_price", v)}
    placeholder="例：30000000"
  />
</Field>

<Field label="② 割賦販売価格（数字のみ）">
  <MoneyInput
    value={form.installment_price}
    onChange={(v) => handleChange("installment_price", v)}
    placeholder="例：32000000"
  />
</Field>

<Field label="③ うち引渡しまでに支払う金銭（数字のみ）">
  <MoneyInput
    value={form.before_delivery_payment}
    onChange={(v) => handleChange("before_delivery_payment", v)}
    placeholder="例：5000000"
  />
</Field>

<Field label="③ 支払時期">
  <Input
    value={form.before_delivery_payment_timing}
    onChange={(v) => handleChange("before_delivery_payment_timing", v)}
    placeholder="例：契約時"
  />
</Field>

<Field label="③ 支払方法">
  <Input
    value={form.before_delivery_payment_method}
    onChange={(v) => handleChange("before_delivery_payment_method", v)}
    placeholder="例：銀行振込"
  />
</Field>

<Field label="④ 賦払金の額（数字のみ）">
  <MoneyInput
    value={form.installment_amount}
    onChange={(v) => handleChange("installment_amount", v)}
    placeholder="例：150000"
  />
</Field>

<Field label="④ 支払時期">
  <Input
    value={form.installment_amount_timing}
    onChange={(v) => handleChange("installment_amount_timing", v)}
    placeholder="例：毎月末"
  />
</Field>

<Field label="④ 支払方法">
  <Input
    value={form.installment_amount_method}
    onChange={(v) => handleChange("installment_amount_method", v)}
    placeholder="例：口座振替"
  />
</Field>
</DetailsGroup>

<DetailsGroup title="⑩ 重要事項説明書 (10面)" defaultOpen>
  <div style={{ fontWeight: 800, marginBottom: 8 }}>
    1 供託所等に関する説明
  </div>

  {/* ▼ 協会かどうかの選択 */}
  <Field label="宅地建物取引業保証協会の社員かどうか">
    <select
      value={form.guarantee_association_member_type}
      onChange={(e) => {
        const v = e.target.value;
        handleChange("guarantee_association_member_type", v);

        if (v === "non_member") {
          handleChange("association_name", "");
          handleChange("association_address", "");
          handleChange("association_office_address", "");
          handleChange("association_deposit_office_and_address", "");
        }

        if (v === "member") {
          handleChange("deposit_office_and_address", "");
        }
      }}
      style={{ width: "100%" }}
    >
      <option value="">選択してください</option>
      <option value="non_member">保証協会非加入（営業保証金）</option>
      <option value="member">保証協会加入（弁済業務保証金）</option>
    </select>
  </Field>

  {/* ▼ 非会員（営業保証金） */}
  {form.guarantee_association_member_type === "non_member" && (
    <Field label="(1) 営業保証金を供託した供託所及びその所在地">
      <Textarea
        value={form.deposit_office_and_address}
        onChange={(v) => handleChange("deposit_office_and_address", v)}
        placeholder="例：大阪法務局 北出張所／大阪市北区..."
      />
    </Field>
  )}

  {/* ▼ 会員（保証協会） */}
  {form.guarantee_association_member_type === "member" && (
    <>
      <Field label="(2) 宅地建物取引業保証協会 名称">
        <Input
          value={form.association_name}
          onChange={(v) => handleChange("association_name", v)}
          placeholder="例：全国宅地建物取引業保証協会"
        />
      </Field>

      <Field label="(2) 住所">
        <Input
          value={form.association_address}
          onChange={(v) => handleChange("association_address", v)}
          placeholder="例：東京都千代田区..."
        />
      </Field>

      <Field label="(2) 事務所の所在地">
        <Input
          value={form.association_office_address}
          onChange={(v) => handleChange("association_office_address", v)}
          placeholder="例：大阪市中央区..."
        />
      </Field>

      <Field label="(2) 弁済業務保証金を供託した供託所及びその所在地">
        <Textarea
          value={form.association_deposit_office_and_address}
          onChange={(v) =>
            handleChange("association_deposit_office_and_address", v)
          }
          placeholder="例：東京法務局／東京都千代田区..."
        />
      </Field>
    </>
  )}
</DetailsGroup>

           {!isMansionSale && (
            <div style={noticeBox}>
              <b>このモードは準備中です。</b>
              <div style={{ opacity: 0.85, fontSize: 13, marginTop: 6 }}>
                今は <b>売買 / マンション</b> のみ対応しています。
              </div>
            </div>
          )}

<button
  type="button"
  onClick={handleSave}
  className="button-primary"
  disabled={isSaveDisabled}
>
  {loading ? "処理中..." : editId ? "更新する" : "保存する"}
</button>

          {savedRow && (
            <details open style={detailsWrap}>
              <summary style={detailsSummary}>重要事項説明書</summary>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  保存済み：<b>{savedRow.property_name ?? "（物件名なし）"}</b>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
  type="button"
  onClick={goToMansionSale}
  className="button-base"
  disabled={loading}
>
  重要事項説明書を作成
</button>
                </div>
              </div>

              <div style={{ opacity: 0.75, marginTop: 10, fontSize: 13 }}>
                ※ ここではプレビュー・別タブ・PDF保存は行いません。遷移先で確認します。
              </div>
            </details>
          )}
        </div>
      </section>
    </main>
  );
}

function DetailsGroup({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} style={detailsWrap}>
      <summary style={detailsSummary}>{title}</summary>
      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 13, opacity: 0.85 }}>{label}</div>
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
      style={input}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...input, minHeight: 90, resize: "vertical", paddingTop: 10 }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...input,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          paddingRight: "36px",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ color: "black" }}>
            {opt}
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
          fontSize: "12px",
          opacity: 0.8,
        }}
      >
        ▼
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 16,
  background: "var(--surface)",
  backdropFilter: "blur(8px)",
};

const input: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-strong)",
  color: "var(--foreground)",
  padding: "10px 12px",
  outline: "none",
};


const detailsWrap: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 12,
  background: "var(--surface)",
};

const detailsSummary: React.CSSProperties = {
  cursor: "pointer",
  fontWeight: 900,
  color: "var(--foreground)",
};

const noticeBox: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 12,
  background: "var(--surface-strong)",
  color: "var(--foreground)",
};