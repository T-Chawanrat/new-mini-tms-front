export type MoveTkTruck = {
  truck_load_id: number;
  truck_code: string;
  is_close: "Y" | "N";
  driver_type: "EMPLOYEE" | "CONTRACTOR";
  driver_name: string | null;
  license_plate: string | null;
  license_province: string | null;
  count_box: number;
  warehouse_name: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};

export type MoveTkProduct = {
  product_truck_id: number;
  serial_id: string;
  serial_no: string;
  driver_type: "EMPLOYEE" | "CONTRACTOR";
  license_plate: string | null;
  license_plate_province_id: number | null;
  license_province: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};
