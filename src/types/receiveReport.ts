export type Option = {
  id: number;
  name: string;
  code?: string;
};

export type ReceiveSerialRow = {
  receive_business_id: number | null;
  receive_code: string | null;

  serial_id: number | string | null;
  serial_no: string | null;

  package_id: number | null;
  package_name: string | null;
  package_detail_id: number | null;
  package_detail_name: string | null;

  customer_id: number | null;
  cost: number | string | null;

  from_warehouse_id: number | null;
  to_warehouse_id: number | null;
  to_warehouse_name?: string | null;

  recipient_name: string | null;
  recipient_code: string | null;
  address: string | null;

  district_id: number | null;
  district_name: string | null;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  province_id: number | null;
  province_name: string | null;
  zip_code: string | null;
  tel: string | null;

  item_is_deleted: string | null;

  recipient_id: number | null;
  shipper_id: number | null;
  shipper_name: string | null;

  document_return_id: number | null;
  remark: string | null;
  url: string | null;

  cod: number | string | null;
  weight: number | string | null;
  width: number | string | null;
  length: number | string | null;
  height: number | string | null;
  q: number | string | null;

  is_returned: string | null;
  payment_type_id: number | null;

  recipient_detail_id: number | null;
  recipient_detail_name: string | null;

  deleted_date: string | null;
  deleted_by_user: string | number | null;

  vol: number | string | null;
  size_type: string | null;

  create_date_1_2: string | null;
  last_modified: string | null;
  customer_type: string | null;
};

export type ReceiveReportRow = {
  receive_code: string | null;
  receive_business_id: number | null;

  receive_date: string | null;
  receive_walkin_id: number | null;
  delivery_date: string | null;

  customer_id: number | null;
  customer_name?: string | null;
  customer_type: string | null;

  from_warehouse_id: number | null;
  to_warehouse_id: number | null;
  to_warehouse_name?: string | null;

  recipient_id: number | null;
  recipient_code: string | null;
  recipient_name: string | null;

  recipient_detail_id: number | null;
  recipient_detail_name: string | null;

  address: string | null;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  district_id: number | null;
  district_name: string | null;
  province_id: number | null;
  province_name: string | null;
  zip_code: string | null;
  tel: string | null;

  shipper_id: number | null;
  shipper_name: string | null;

  payment_type_id?: number | null;

  total_rows: number | string | null;
  total_serial: number | string | null;

  total_cost: number | string | null;
  total_cod: number | string | null;
  total_weight: number | string | null;
  total_qty: number | string | null;
  total_vol: number | string | null;

  create_date_1_2: string | null;
  last_modified: string | null;

  serials?: ReceiveSerialRow[];
};

export type ReceiveReportSummaryTotal = {
  total_receive: number | string;
  total_serial: number | string;
  total_rows: number | string;

  total_cost: number | string;
  total_cod: number | string;
  total_weight: number | string;
  total_qty: number | string;
  total_vol: number | string;
};

export type ReceiveReportSummaryDaily = {
  receive_date: string | null;

  total_receive: number | string;
  total_serial: number | string;
  total_rows: number | string;

  total_cost: number | string;
  total_cod: number | string;
  total_weight: number | string;
  total_qty: number | string;
  total_vol: number | string;
};

export type ReceiveReportSummary = {
  total: ReceiveReportSummaryTotal | null;
  daily: ReceiveReportSummaryDaily[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Filters = {
  receive_date_from: string;
  receive_code: string;
  serial_no: string;
  customer_id: string;
  to_warehouse_id: string;
};