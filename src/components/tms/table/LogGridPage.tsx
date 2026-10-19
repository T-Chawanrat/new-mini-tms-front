import { useCallback, useEffect, useMemo, useState } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { RefreshCcw } from "lucide-react";

import AxiosInstance from "../../../services/apiClient";
import { formatThaiDateTime } from "../../../utils/dateTime";
import DataGrid from "./DataGrid";

type LogColumn = { field: string; headerName: string; width?: number; date?: boolean; valueGetter?: (value: unknown, row: Record<string, unknown>) => string };
type LogRow = Record<string, unknown> & { __logRowId: number; __rowNumber: number };

type LogGridPageProps = {
  title: string;
  endpoint: string;
  fields: LogColumn[];
};

export default function LogGridPage({ title, endpoint, fields }: LogGridPageProps) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await AxiosInstance.get<{ data: Record<string, unknown>[] }>(endpoint);
      setRows(
        (Array.isArray(response.data.data) ? response.data.data : []).map((row, index) => ({
          ...row,
          __logRowId: index,
          __rowNumber: index + 1,
        })),
      );
    } catch {
      setRows([]);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "__rowNumber", headerName: "#", width: 75, align: "center", headerAlign: "center", sortable: false, filterable: false },
      ...fields.map(
        ({ field, headerName, width, date, valueGetter }): GridColDef => ({
          field,
          headerName: headerName
            .split("_")
            .map((word) => (word === "id" ? "ID" : word.charAt(0).toUpperCase() + word.slice(1)))
            .join(" "),
          width: width ?? 160,
          valueGetter,
          valueFormatter: (value) => (date ? formatThaiDateTime(value as string | null) : value == null || value === "" ? "-" : String(value)),
        }),
      ),
    ],
    [fields],
  );

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw size={14} /> รีเฟรช
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1">
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row: LogRow) => row.__logRowId}
          height="100%"
          pageSize={100}
          striped
          headerTextTransform="none"
        />
      </div>
    </div>
  );
}
