import LogGridPage from "../components/tms/table/LogGridPage";

const fields = [
  { field: "serial_no", headerName: "serial_no", width: 210 },
  { field: "event_type", headerName: "event_type" },
  { field: "now_warehouse_name", headerName: "now_warehouse_name", width: 200 },
  { field: "to_warehouse_name", headerName: "to_warehouse_name", width: 200 },
  {
    field: "created_by_name", headerName: "Created By", width: 200,
    valueGetter: (_value: unknown, row: Record<string, unknown>) =>
      [row.first_name, row.last_name].filter(Boolean).join(" "),
  },
  { field: "created_date", headerName: "created_date", date: true },
];

export default function LogProductWarehouse() {
  return <LogGridPage title="ประวัติสินค้าในคลัง" endpoint="/logs/product-warehouses" fields={fields} />;
}
