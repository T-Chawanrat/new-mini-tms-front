export type Option = {
  id: number;
  name: string;
  code?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LabelFilters = {
  receive_date: string;
  customer_id: string;
  to_warehouse_id: string;
  receive_code: string;
};

export type LabelReceiveRow = {
  receive_code: string;
  receive_business_id: number | null;

  receive_date: string | Date | null;
  delivery_date: string | Date | null;

  customer_id: number | string | null;
  customer_name: string | null;

  to_warehouse_id: number | string | null;
  to_warehouse_name: string | null;

  total_serial: number | string | null;

  total_print_count: number | string | null;
  total_reprint_count: number | string | null;

  last_printed_at: string | Date | null;
};

export type LabelRow = {
  receive_code: string;
  receive_business_id: number | null;

  reference_no: string | null;

  receive_date: string | Date | null;
  delivery_date: string | Date | null;

  serial_id: number | string | null;
  serial_no: string;

  serial_index?: number;
  serial_total?: number;

  customer_name: string | null;

  recipient_name: string | null;
  address: string | null;
  remark: string | null;

  district_name: string | null;
  subdistrict_name: string | null;
  province_name: string | null;

  zip_code: string | null;
  tel: string | null;

  shipper_id: number | null;
  shipper_name: string | null;
  shipper_tel: string | null;

  from_warehouse_id: number | null;
  from_warehouse_name: string | null;

  to_warehouse_id: number | null;
  to_warehouse_name: string | null;

  cod: number | string | null;

  print_count: number;
  reprint_count: number;

  last_printed_at: string | null;

  is_printed: number;
};

export type LabelReceivesResponse = {
  success: boolean;
  data: LabelReceiveRow[];
  pagination?: Pagination;
};

export type LabelSerialsResponse = {
  success: boolean;
  data: LabelRow[];
  pagination?: Pagination;
};

export type PrintResponse = {
  success: boolean;
  message: string;
  printed_count: number;
  not_found_count: number;
  not_found_serial_nos: string[];
};

export const defaultLabelFilters: LabelFilters = {
  receive_date: "",
  customer_id: "",
  to_warehouse_id: "",
  receive_code: "",
};

export const defaultLabelPagination: Pagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,
};

export const receiveLabelHeaders = ["#", "Receive Code", "Receive Date", "Customer", "To Warehouse", "SN", "Printed", "Not Printed", "Last Printed"];

export const serialLabelHeaders = ["", "Serial No", "Recipient", "Address", "Delivery Date", "Print", "Reprint", "Last Printed"];
