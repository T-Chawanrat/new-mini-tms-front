export type DeliveryDriverType = "EMPLOYEE" | "CONTRACTOR";

export type DeliveryTruckRow = {
  id: string;
  create_date: string;
  truck_code: string;
  driver_type: DeliveryDriverType;
  driver_name: string;
  license_plate: string;
  count_box: number;
  status: string;
  is_close?: string | null;
  is_go?: string | null;
  route_code?: string | null;
  route_name?: string | null;
};

export type DeliveryDriver = { id: number; employee_code: string | null; first_name: string | null; last_name: string | null };
export type DeliveryVehicle = { id: number; license_plate: string; license_plate_province: string | null; model: string | null };
export type DeliveryContractor = {
  vehicle_contractor_id: number;
  user_truck_id: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  license_plate: string;
  license_plate_province: string | null;
};

export type DeliveryRouteOption = { route_id: number; warehouse_id?: number; route_code: string | null; route_name: string | null };
export type DeliveryTruckApiRow = Omit<DeliveryTruckRow, "id"> & { truck_load_id: number };

export type DeliveryProductRow = {
  serial_no: string;
  customer_name: string;
  recipient_name: string;
  now_warehouse_id: number | null;
  to_warehouse_id: number | null;
  route_id: number | null;
};

export type DeliveryTruck = {
  warehouse_id: number | null;
  route_id: number | null;
  is_close: string | null;
  truck_code: string;
  warehouse_name: string | null;
  employee_code: string | null;
  driver_name: string | null;
  license_plate: string | null;
  license_plate_province: string | null;
  model: string | null;
  route_code: string | null;
  route_name: string | null;
};

export type DeliveryTruckPrintHeader = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;
  close_datetime: string | null;
  driver_name: string | null;
  warehouse_name: string | null;
  route_code: string | null;
  route_name: string | null;
  license_plate: string | null;
  license_province: string | null;
};

export type DeliveryTruckPrintItem = {
  id: number;
  receive_code: string | null;
  delivery_date: string | null;
  reference_no: string | null;
  customer_name: string | null;
  recipient_name: string | null;
  address: string | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  recipient_tel: string | null;
  qty: number | string | null;
};

export type DeliveryTruckPrintResponse = { data?: { truck: DeliveryTruckPrintHeader; items: DeliveryTruckPrintItem[] } };
