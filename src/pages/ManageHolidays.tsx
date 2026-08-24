// client/src/pages/ManageHolidays.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "../components/form/DatePicker";
import DataGrid from "../components/DataGrid";
import { Pencil, Trash2, RefreshCw, Plus } from "lucide-react";

type Id = string | number;
type ActiveStatus = "Y" | "N";
type StatusValue = "ACTIVE" | "INACTIVE";

type Holiday = {
  id: Id;
  holiday_date: string;
  holiday_name: string;
  remark: string | null;
  is_deleted?: ActiveStatus;
  is_actived: ActiveStatus;
  created_at?: string;
  updated_at?: string;
};

type HolidayGridRow = Holiday & {
  no: number;
};

type HolidayForm = {
  holiday_date: string;
  holiday_name: string;
  remark: string;
  is_actived: ActiveStatus;
};

type SelectedStatus = {
  id: Id;
  current: StatusValue;
};

type GridCellParams<T> = {
  value?: string | number | null;
  row: T;
};

type ColumnDef<T> = {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: "left" | "right" | "center";
  headerAlign?: "left" | "right" | "center";
  renderCell?: (params: GridCellParams<T>) => ReactNode;
};

type AxiosLikeError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const emptyForm: HolidayForm = {
  holiday_date: "",
  holiday_name: "",
  remark: "",
  is_actived: "Y",
};

const monthOptions = [
  { value: "", label: "ทุกเดือน" },
  { value: "1", label: "ม.ค." },
  { value: "2", label: "ก.พ." },
  { value: "3", label: "มี.ค." },
  { value: "4", label: "เม.ย." },
  { value: "5", label: "พ.ค." },
  { value: "6", label: "มิ.ย." },
  { value: "7", label: "ก.ค." },
  { value: "8", label: "ส.ค." },
  { value: "9", label: "ก.ย." },
  { value: "10", label: "ต.ค." },
  { value: "11", label: "พ.ย." },
  { value: "12", label: "ธ.ค." },
];

const cellClass = "flex h-full w-full items-center";
const centerCellClass = "flex h-full w-full items-center justify-center";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const error = err as AxiosLikeError;
    return error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export default function ManageHolidays() {
  const [rows, setRows] = useState<Holiday[]>([]);
  const [form, setForm] = useState<HolidayForm>(emptyForm);
  const [editing, setEditing] = useState<Holiday | null>(null);

  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [month, setMonth] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id | null>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SelectedStatus | null>(null);

  const isEditing = Boolean(editing);

  const handleChange = (key: keyof HolidayForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await AxiosInstance.get("/holidays", {
        params: {
          year: year || undefined,
          month: month || undefined,
        },
      });

      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err, "fetch holidays failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const holidayDate = form.holiday_date;
    const holidayName = form.holiday_name.trim();
    const remark = form.remark.trim();

    if (!holidayDate) {
      alert("กรุณาเลือกวันที่");
      return;
    }

    if (!holidayName) {
      alert("กรุณากรอกชื่อวันหยุด");
      return;
    }

    const payload = {
      holiday_date: holidayDate,
      holiday_name: holidayName,
      remark: remark || null,
      is_actived: form.is_actived,
    };

    try {
      setSaving(true);

      if (editing) {
        await AxiosInstance.put(`/holidays/${editing.id}`, payload);
      } else {
        await AxiosInstance.post("/holidays", payload);
      }

      resetForm();
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err, "save holiday failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row: Holiday) => {
    setEditing(row);

    setForm({
      holiday_date: formatDateForInput(row.holiday_date),
      holiday_name: row.holiday_name || "",
      remark: row.remark || "",
      is_actived: row.is_actived || "Y",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (row: Holiday) => {
    const ok = window.confirm(`ต้องการลบวันหยุด "${row.holiday_name}" ใช่ไหม?`);

    if (!ok) return;

    try {
      setDeletingId(row.id);

      await AxiosInstance.delete(`/holidays/${row.id}`);

      if (editing?.id === row.id) {
        resetForm();
      }

      fetchData();
    } catch (err) {
      alert(getErrorMessage(err, "delete holiday failed"));
    } finally {
      setDeletingId(null);
    }
  };

  const openStatusModal = (row: Holiday) => {
    setSelectedStatus({
      id: row.id,
      current: row.is_actived === "Y" ? "ACTIVE" : "INACTIVE",
    });

    setStatusModal(true);
  };

  const changeStatus = async (status: StatusValue) => {
    if (!selectedStatus) return;

    const row = rows.find((item) => String(item.id) === String(selectedStatus.id));

    if (!row) {
      alert("ไม่พบข้อมูลวันหยุด");
      setStatusModal(false);
      setSelectedStatus(null);
      return;
    }

    try {
      await AxiosInstance.put(`/holidays/${row.id}`, {
        holiday_date: formatDateForInput(row.holiday_date),
        holiday_name: row.holiday_name,
        remark: row.remark || null,
        is_actived: status === "ACTIVE" ? "Y" : "N",
      });

      setStatusModal(false);
      setSelectedStatus(null);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err, "update status failed"));
    }
  };

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return rows;

    return rows.filter((row) => {
      const dateText = String(row.holiday_date || "").toLowerCase();
      const nameText = String(row.holiday_name || "").toLowerCase();
      const remarkText = String(row.remark || "").toLowerCase();

      return dateText.includes(searchText) || nameText.includes(searchText) || remarkText.includes(searchText);
    });
  }, [rows, search]);

  const gridRows = useMemo<HolidayGridRow[]>(() => {
    return filteredRows.map((row, index) => ({
      ...row,
      no: index + 1,
    }));
  }, [filteredRows]);

  const columns = useMemo<ColumnDef<HolidayGridRow>[]>(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 70,
        minWidth: 60,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className={centerCellClass}>
            <span className="text-sm text-slate-600">{params.value}</span>
          </div>
        ),
      },
      {
        field: "holiday_date",
        headerName: "วันที่",
        width: 160,
        minWidth: 140,
        renderCell: (params) => (
          <div className={cellClass}>
            <span className="truncate font-medium text-slate-800" title={formatDateForInput(params.row.holiday_date)}>
              {formatDateThai(params.row.holiday_date)}
            </span>
          </div>
        ),
      },
      {
        field: "holiday_name",
        headerName: "ชื่อวันหยุด",
        width: 320,
        minWidth: 240,
        renderCell: (params) => (
          <div className={cellClass}>
            <span title={String(params.value || "")} className="truncate font-medium text-slate-800">
              {params.value || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "remark",
        headerName: "หมายเหตุ",
        width: 460,
        minWidth: 260,
        maxWidth: 3000,
        renderCell: (params) => (
          <div className={cellClass}>
            <span title={String(params.value || "")} className="truncate text-slate-500">
              {params.value || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "is_actived",
        headerName: "สถานะ",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className={centerCellClass}>
            <button type="button" onClick={() => openStatusModal(params.row)} className="inline-block" title="คลิกเพื่อเปลี่ยนสถานะ">
              {params.row.is_actived === "Y" ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-200">Active</span>
              ) : (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-200">Inactive</span>
              )}
            </button>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className={`${centerCellClass} gap-2`}>
            <button
              type="button"
              onClick={() => handleEdit(params.row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
              title="แก้ไขวันหยุด"
            >
              <Pencil size={14} />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(params.row)}
              disabled={deletingId === params.row.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="ลบวันหยุด"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [deletingId],
  );

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-4">
      <div className="mt-[-15px] mb-2 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-slate-800">จัดการวันหยุดบริษัท</h2>

          <p className="text-sm text-slate-500">เพิ่ม แก้ไข ลบ และกำหนดสถานะวันหยุดของบริษัท</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-2 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{isEditing ? "แก้ไขวันหยุด" : "เพิ่มวันหยุด"}</h3>

            {isEditing && <p className="mt-0.5 text-xs text-blue-600">กำลังแก้ไขรายการ ID: {editing.id}</p>}
          </div>

          {isEditing && (
            <button type="button" onClick={resetForm} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
              ยกเลิก
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[170px_minmax(280px,1fr)_minmax(280px,1fr)_100px] xl:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              วันที่ <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={form.holiday_date}
              onChange={(value) => handleChange("holiday_date", value)}
              placeholder="เลือกวันที่"
              required
              variant="compact"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              ชื่อวันหยุด <span className="text-red-500">*</span>
            </label>
            <input
              className="input-modern h-9 w-full"
              placeholder="เช่น วันขึ้นปีใหม่"
              value={form.holiday_name}
              onChange={(e) => handleChange("holiday_name", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">หมายเหตุ</label>
            <input
              className="input-modern h-9 w-full"
              placeholder="เช่น วันหยุดประจำปี"
              value={form.remark}
              onChange={(e) => handleChange("remark", e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
          >
            {!saving && <Plus size={14} />}
            {saving ? "..." : isEditing ? "บันทึก" : "เพิ่ม"}
          </button>
        </div>
      </form>

      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input type="number" placeholder="ปี" value={year} onChange={(e) => setYear(e.target.value)} className="input-modern w-[130px]" />

        <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-modern w-[140px]">
          {monthOptions.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          placeholder="ค้นหาชื่อวันหยุด"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[280px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <button
          type="button"
          onClick={fetchData}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
        >
          <RefreshCw size={14} />
          ค้นหา
        </button>

        <div className="ml-auto text-sm text-slate-500">
          พบ {gridRows.length} รายการ จากทั้งหมด {rows.length} รายการ
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <DataGrid rows={gridRows} columns={columns} loading={loading} getRowId={(row: HolidayGridRow) => row.id} height="100%" pageSize={100} />
      </div>

      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setStatusModal(false);
            setSelectedStatus(null);
          }}
        >
          <div className="w-[300px] rounded-2xl bg-white p-6 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-800">สถานะ</h3>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={selectedStatus?.current === "ACTIVE"}
                onClick={() => changeStatus("ACTIVE")}
                className={`rounded-lg px-4 py-2 ${
                  selectedStatus?.current === "ACTIVE"
                    ? "cursor-not-allowed bg-green-50 text-green-300"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                disabled={selectedStatus?.current === "INACTIVE"}
                onClick={() => changeStatus("INACTIVE")}
                className={`rounded-lg px-4 py-2 ${
                  selectedStatus?.current === "INACTIVE" ? "cursor-not-allowed bg-red-50 text-red-300" : "bg-red-100 text-red-500 hover:bg-red-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateForInput(value: string | Date | null | undefined): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatDateThai(value: string | Date | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
