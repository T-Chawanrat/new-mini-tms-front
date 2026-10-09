export type TruckType = "MAIN" | "EXTRA";

export type TruckloadOption = {
  id: number | string;
  code?: string | null;
  name: string;
};

export type TruckloadDriverUser = {
  id?: number;
  user_id?: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type TruckloadVehicle = {
  id?: number;
  vehicle_id?: number;
  license_plate: string;
  license_plate_province: string | null;
  model: string | null;
};

export type ContractorVehicle = {
  vehicle_contractor_id: number;
  user_truck_id: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  tel: string | null;
  license_plate: string;
  license_plate_province_id: number;
  license_plate_province: string | null;
  model: string | null;
};

export type TruckLoadRow = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;
  user_truck_id: number | null;
  driver_type?: "EMPLOYEE" | "CONTRACTOR" | null;
  status: string | null;
  warehouse_id: number | null;
  to_warehouse_id: number | null;
  job_id: number | null;
  is_close: string | null;
  is_go: string | null;
  is_completed: string | null;
  is_arrived: string | null;
  close_datetime: string | null;
  go_datetime: string | null;
  arrived_datetime: string | null;
  close_by: number | null;
  go_by: number | null;
  arrived_by: number | null;
  note: string | null;
  sub_warehouse: string | null;
  warehouse_name?: string | null;
  to_warehouse_name?: string | null;
  driver_name?: string | null;
  employee_code?: string | null;
  tel?: string | null;
  vehicle_id?: number | null;
  license_plate?: string | null;
  license_plate_province_id?: number | null;
  license_province?: string | null;
  model?: string | null;
  serial_count?: number | string | null;
  count_box?: number | string | null;
};

export type TruckLoadResponse = {
  success?: boolean;
  message?: string;
  data: TruckLoadRow[];
  pagination?: { page: number; limit: number; total: number; total_pages: number };
};

export type DriverUsersResponse = { success?: boolean; message?: string; data: TruckloadDriverUser[] };
export type VehiclesResponse = { success?: boolean; message?: string; data: TruckloadVehicle[] };
export type ContractorVehiclesResponse = { success?: boolean; message?: string; data: ContractorVehicle[] };
export type CreateTruckLoadResponse = { success?: boolean; message?: string; data?: TruckLoadRow };

export type VehicleLoadRow = {
  serial_id: string;
  serial_no: string;
  warehouse_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};

export type VehicleLoadResponse = { success?: boolean; data: VehicleLoadRow[]; loaded?: VehicleLoadRow[]; total?: number };

export type TruckLoadDetail = {
  truck_load_id: number;
  truck_code: string;
  warehouse_id: number | null;
  user_truck_id: number | null;
  vehicle_id: number | null;
  to_warehouse_id: number | null;
  employee_code: string | null;
  driver_name: string | null;
  license_plate: string | null;
  license_province: string | null;
  model: string | null;
  to_warehouse_name: string | null;
  is_close: string | null;
  is_go: string | null;
};

export type TruckloadWarehouseOption = { id: number | string; name: string };
export type TruckLoadDetailResponse = { success?: boolean; data: TruckLoadDetail };
export type DestinationWarning = { serial_id: string; serial_no: string; to_warehouse_id: number | null; to_warehouse_name: string | null };
