import LogGridPage from "../components/tms/table/LogGridPage";

const fields = [
  { field: "receive_code", headerName: "receive_code", width: 220 },
  { field: "customer_name", headerName: "customer_name", width: 250 },
  { field: "source_type", headerName: "source_type" },
   { field: "detail_count", headerName: "detail_count" },
  { field: "item_count", headerName: "item_count" },
  { field: "warehouse_name", headerName: "warehouse_name", width: 200 },
  // { field: "created_username", headerName: "created_username" },
  { field: "created_name", headerName: "created_name", width: 200 },
  { field: "created_at", headerName: "created_at", date: true },
];

export default function LogReceiveCreate() {
  return <LogGridPage title="ประวัติการสร้างบิล" endpoint="/logs/receive-create" fields={fields} />;
}
