export type ReceiveForm = {
  receive_code: string;
  reference_no: string;

  customer_id: string;
  customer_code: string;
  customer_name: string;

  shipper_id: string;
  shipper_code: string;
  shipper_name: string;
  shipper_address: string;

  shipper_subdistrict_id: string;
  shipper_district_id: string;
  shipper_province_id: string;

  shipper_subdistrict_name: string;
  shipper_district_name: string;
  shipper_province_name: string;

  shipper_zip_code: string;
  shipper_tel: string;

  recipient_id: string;
  recipient_code: string;
  recipient_detail_id: string;
  recipient_detail_name: string;
  recipient_name: string;
  address: string;

  province_id: string;
  district_id: string;
  subdistrict_id: string;

  province_name: string;
  district_name: string;
  subdistrict_name: string;

  zip_code: string;
  tel: string;

  delivery_date: string;
  payment_type_id: string;
  remark: string;

  is_cod: "Y" | "N";
  cod: string;

  is_document_return: "Y" | "N";
  document_return: string;

  is_pickup_customer: "Y" | "N";
  is_pickup_shipper: "Y" | "N";
};

export type CustomerOption = {
  id: number;
  code: string;
  name: string;
};

export type PaymentOption = {
  id: number;
  name: string;
};

export type ShipperOption = {
  shipper_id: number;
  shipper_code: string;
  shipper_name: string;
  address: string;

  tel?: string | null;
  zip_code?: string | null;

  subdistrict_id?: number | null;
  district_id?: number | null;
  province_id?: number | null;

  subdistrict_name?: string | null;
  district_name?: string | null;
  province_name?: string | null;
};

export type RecipientOption = {
  recipient_id: number;
  recipient_code: string;
  recipient_name: string;

  recipient_detail_id?: number | null;
  recipient_detail_name?: string | null;

  address?: string | null;
  tel?: string | null;
  zip_code?: string | null;

  subdistrict_id?: number | null;
  district_id?: number | null;
  province_id?: number | null;

  subdistrict_name?: string | null;
  district_name?: string | null;
  province_name?: string | null;
};

export type GroupedRecipient = {
  recipient_id: number;
  recipient: RecipientOption;
  details: RecipientOption[];
};

export type PackageOption = {
  package_id: number | string;
  package_code?: string | null;
  package_name?: string | null;
  customer_id?: number | string | null;
  type?: string | null;

  package_detail_id?: number | string | null;
  package_detail_code?: string | null;
  package_detail_name?: string | null;
  unit_id?: number | string | null;

  size_min?: number | string | null;
  size_max?: number | string | null;
  weight_min?: number | string | null;
  weight_max?: number | string | null;

  cost?: number | string | null;
  cost_difference_warehouse?: number | string | null;
  cost_go?: number | string | null;
  cost_return?: number | string | null;

  is_document_return?: string | null;
  is_weight_fix?: string | null;
  is_vat?: string | null;

  package_detail_type?: "BUSINESS" | "EXPRESS" | string | null;
};

export type GroupedPackageOption = {
  package_id: string;
  package_code: string;
  package_name: string;
  type: string;
  details: PackageOption[];
};

export type PackageRow = {
  package_id: string;
  package_code: string;
  package_name: string;

  package_detail_id: string;
  package_detail_code: string;
  package_detail_type: string;

  package_size_name: string;

  width: string;
  length: string;
  height: string;
  q: string;
  weight: string;

  qty: string;
  unit_price: string;
};

export type UpdateReceiveForm = <K extends keyof ReceiveForm>(
  field: K,
  value: ReceiveForm[K],
) => void;

export type UpdatePackageForm = <K extends keyof PackageRow>(
  field: K,
  value: PackageRow[K],
) => void;

export const emptyReceiveForm: ReceiveForm = {
  receive_code: "",
  reference_no: "",

  customer_id: "",
  customer_code: "",
  customer_name: "",

  shipper_id: "",
  shipper_code: "",
  shipper_name: "",
  shipper_address: "",

  shipper_subdistrict_id: "",
  shipper_district_id: "",
  shipper_province_id: "",

  shipper_subdistrict_name: "",
  shipper_district_name: "",
  shipper_province_name: "",

  shipper_zip_code: "",
  shipper_tel: "",

  recipient_id: "",
  recipient_code: "",
  recipient_detail_id: "",
  recipient_name: "",
  recipient_detail_name: "",
  address: "",

  province_id: "",
  district_id: "",
  subdistrict_id: "",

  province_name: "",
  district_name: "",
  subdistrict_name: "",

  zip_code: "",
  tel: "",

  delivery_date: "",
  payment_type_id: "3",
  remark: "",

  is_cod: "N",
  cod: "",

  is_document_return: "N",
  document_return: "",

  is_pickup_customer: "N",
  is_pickup_shipper: "N",
};

export const emptyPackageRow: PackageRow = {
  package_id: "",
  package_code: "",
  package_name: "",

  package_detail_id: "",
  package_detail_code: "",
  package_detail_type: "",

  package_size_name: "",

  width: "",
  length: "",
  height: "",
  q: "",
  weight: "",

  qty: "1",
  unit_price: "0",
};

export const money = (value: number) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

export const labelClass = "text-[12px] font-medium text-slate-700";

export const inputClass =
  "input-modern h-9 min-h-9 w-full box-border rounded-md border border-slate-300 bg-white px-3 py-1 text-[13px] leading-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export const selectClass =
  "input-modern h-9 min-h-9 w-full box-border rounded-md border border-slate-300 bg-white px-3 py-1 text-[13px] leading-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export const readOnlyInputClass =
  "input-modern h-9 min-h-9 w-full box-border truncate rounded-md border border-slate-300 bg-white px-3 py-1 text-[13px] leading-normal text-slate-700 outline-none";

export const disabledInputClass =
  "input-modern h-9 min-h-9 w-full box-border rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-[13px] leading-normal text-slate-500 outline-none";

export const buttonInputClass =
  "flex h-9 min-h-9 w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-[13px] leading-normal text-slate-700 hover:bg-slate-50";

export const disabledButtonInputClass =
  "flex h-9 min-h-9 w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-[13px] leading-normal text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export const checkboxInputClass =
  "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500";

export const datePickerWrapClass = "w-full";