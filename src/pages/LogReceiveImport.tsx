import LogGridPage from "../components/tms/table/LogGridPage";

const fields = [
  { field: "status", headerName: "status" },
  { field: "is_deleted", headerName: "is_deleted" },
  { field: "customer_name", headerName: "customer_name", width: 250 },
  { field: "updated_date", headerName: "updated_date", date: true },
  { field: "queue_total", headerName: "queue_total" },
  { field: "queue_processed", headerName: "queue_processed", width: 180 },
  { field: "queue_stop_requested", headerName: "queue_stop_requested", width: 180 },
  { field: "queue_last_error", headerName: "queue_last_error", width: 240 },
  { field: "queue_started_at", headerName: "queue_started_at", date: true },
  { field: "queue_finished_at", headerName: "queue_finished_at", date: true },
  {
    field: "created_by_name", headerName: "Created By", width: 200,
    valueGetter: (_value: unknown, row: Record<string, unknown>) =>
      [row.created_by_first_name, row.created_by_last_name].filter(Boolean).join(" "),
  },
  { field: "created_date", headerName: "created_date", date: true },
];

export default function LogReceiveImport() {
  return <LogGridPage title="ประวัติการนำเข้าข้อมูล" endpoint="/logs/receive-imports" fields={fields} />;
}
