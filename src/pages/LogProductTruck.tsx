import LogGridPage from "../components/tms/table/LogGridPage";

const fields = [
  { field: "serial_no", headerName: "serial_no", width: 240 },
  { field: "event_type", headerName: "event_type" },
  { field: "driver_name", headerName: "driver_name", width: 200 },
  {
    field: "truck_plate_and_province",
    headerName: "Truck License Plate",
    width: 220,
    valueGetter: (_value: unknown, row: Record<string, unknown>) =>
      [row.truck_license_plate, row.license_plate_province_name].filter(Boolean).join(" "),
  },
  { field: "status", headerName: "status" },
  { field: "truck_code", headerName: "truck_code", width: 180 },
  { field: "truck_status", headerName: "truck_status" },
  {
    field: "route_code_and_name",
    headerName: "Route",
    width: 220,
    valueGetter: (_value: unknown, row: Record<string, unknown>) => [row.route_code, row.route_name].filter(Boolean).join(" - "),
  },
  { field: "is_dc_mismatch", headerName: "is_dc_mismatch" },
  { field: "parcel_to_warehouse_name", headerName: "parcel_to_warehouse_name", width: 220 },
  { field: "truck_to_warehouse_id", headerName: "truck_to_warehouse_id", width: 180 },
  {
    field: "created_by_name",
    headerName: "Created By",
    width: 200,
    valueGetter: (_value: unknown, row: Record<string, unknown>) => [row.first_name, row.last_name].filter(Boolean).join(" "),
  },
  { field: "created_date", headerName: "created_date", date: true },
];

export default function LogProductTruck() {
  return <LogGridPage title="ประวัติสินค้าบนรถ" endpoint="/logs/product-trucks" fields={fields} />;
}
