import LogGridPage from "../components/tms/table/LogGridPage";

const fields = [
  { field: "receive_code", headerName: "receive_code", width: 220 },
  { field: "serial_no", headerName: "serial_no", width: 240 },
  { field: "customer_name", headerName: "customer_name", width: 250 },
  { field: "to_warehouse_name", headerName: "to_warehouse_name", width: 200 },
  { field: "recipient_code", headerName: "recipient_code" },
  {
    field: "printed_by_name",
    headerName: "Print By",
    width: 180,
    valueGetter: (_value: unknown, row: Record<string, unknown>) =>
      [row.first_name, row.last_name].filter(Boolean).join(" "),
  },
  { field: "print_type", headerName: "print_type" },
  { field: "created_at", headerName: "created_at", date: true },
];

export default function LogLabelPrint() {
  return <LogGridPage title="ประวัติการพิมพ์ Label" endpoint="/logs/label-print" fields={fields} />;
}
