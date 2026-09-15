import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Drawer from "@mui/material/Drawer";
import * as XLSX from "xlsx";
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSignature,
  ImagePlus,
  Images,
  MessageCircle,
  Send,
  Search,
  X,
} from "lucide-react";

import DataGrid from "../components/DataGrid";
import ImageUpload, { type UploadedImages } from "../components/form/ImageUpload";
import SignaturePad from "../components/form/SignaturePad";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { toInputDateTime, toThaiDate, toThaiDateTime } from "../utils/dateTime";

type DeliveryStatus = "PENDING_CLOSE" | "POSTPONED" | "COMPLETED" | "RETURN_TO_SHIPPER";
type QuickFilter = "ALL" | "UNREAD" | "PARTIAL" | "POSTPONED" | "PENDING";

type DeliveryTruckRow = {
  id: string;
  truck_code: string;
  bill_no: string;
  reference_no: string;
  serial_numbers: string[];
  delivered_serial_numbers?: string[];
  driver_name: string;
  operator_name: string;
  license_plate: string;
  license_plate_province: string;
  route_name: string;
  departure_at: string;
  status: DeliveryStatus;
  status_note?: string;
  completed_at?: string;
  next_delivery_date?: string;
  proof_images?: UploadedImages;
  signature_images?: UploadedImages;
  postpone_images?: UploadedImages;
  return_images?: UploadedImages;
};

type SendProblem = { reason_send_problem_id: number; reason_send_problem_detail: string };

type ChatMessage = {
  id: number;
  sender_name: string;
  sender_role: "DRIVER" | "ADMIN";
  message: string;
  sent_at: string;
  images?: UploadedImages;
};
const statusMeta: Record<DeliveryStatus, { label: string; className: string }> = {
  PENDING_CLOSE: { label: "กำลังจัดส่ง", className: "bg-amber-100 text-amber-700" },
  POSTPONED: { label: "เลื่อนจัดส่ง", className: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "จัดส่งสำเร็จ", className: "bg-emerald-100 text-emerald-700" },
  RETURN_TO_SHIPPER: { label: "ส่งคืนผู้ส่ง", className: "bg-rose-100 text-rose-700" },
};

type DeliveryCompleteResponse = {
  data?: DeliveryTruckRow[];
  message?: string;
};

export default function DeliveryComplete() {
  const { user } = useAuth();
  const currentOperatorName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "-";
  const [rows, setRows] = useState<DeliveryTruckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL");
  const [closeTarget, setCloseTarget] = useState<DeliveryTruckRow | null>(null);
  const [issueTarget, setIssueTarget] = useState<DeliveryTruckRow | null>(null);
  const [issueMode, setIssueMode] = useState<"POSTPONED" | "RETURN_TO_SHIPPER">("POSTPONED");
  const [sendProblems, setSendProblems] = useState<SendProblem[]>([]);
  const [proofImages, setProofImages] = useState<UploadedImages>([]);
  const [signatureImages, setSignatureImages] = useState<UploadedImages>([]);
  const [signatureMode, setSignatureMode] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [signaturePadData, setSignaturePadData] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState(toInputDateTime);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [postponeImages, setPostponeImages] = useState<UploadedImages>([]);
  const [issueType, setIssueType] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [billDetailTarget, setBillDetailTarget] = useState<DeliveryTruckRow | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<{ title: string; images: UploadedImages } | null>(null);
  const [chatTarget, setChatTarget] = useState<DeliveryTruckRow | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadChats, setUnreadChats] = useState<Record<string, number>>({});
  const [chatDraft, setChatDraft] = useState("");
  const [chatImages, setChatImages] = useState<UploadedImages>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDeliveryCompletes = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const response = await AxiosInstance.get<DeliveryCompleteResponse>("/delivery-completes", {
          params: { page: 1, limit: 100 },
        });
        setRows(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        const requestError = error as { response?: { data?: { message?: string } }; message?: string };
        setLoadError(requestError.response?.data?.message || requestError.message || "ไม่สามารถโหลดรายการจัดส่งได้");
      } finally {
        setLoading(false);
      }
    };

    void loadDeliveryCompletes();
  }, []);

  useEffect(() => {
    if (!issueTarget) return;
    void AxiosInstance.get<SendProblem[]>("/send-problems")
      .then((response) => setSendProblems(Array.isArray(response.data) ? response.data : []))
      .catch(() => setSendProblems([]));
  }, [issueTarget]);

  useEffect(() => {
    if (!chatTarget) return;
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [chatTarget, chatMessages]);

  const resetCloseForm = () => {
    setCloseTarget(null);
    setProofImages([]);
    setSignatureImages([]);
    setSignatureMode("DRAW");
    setSignaturePadData(null);
    setCompletedAt(toInputDateTime());
    setSelectedSerials([]);
  };
  const resetIssueForm = () => {
    setIssueTarget(null);
    setIssueMode("POSTPONED");
    setPostponeImages([]);
    setIssueType("");
    setIssueNote("");
  };

  const openChat = (row: DeliveryTruckRow) => {
    setChatTarget(row);
    setChatDraft("");
    setChatImages([]);
    setUnreadChats((current) => ({ ...current, [row.id]: 0 }));
  };

  const sendChatMessage = () => {
    if (!chatTarget || (!chatDraft.trim() && !chatImages.length)) return;
    setChatMessages((current) => ({
      ...current,
      [chatTarget.id]: [
        ...(current[chatTarget.id] || []),
        {
          id: Date.now(),
          sender_name: currentOperatorName,
          sender_role: "ADMIN",
          message: chatDraft.trim(),
          sent_at: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }),
          images: chatImages,
        },
      ],
    }));
    setChatDraft("");
    setChatImages([]);
  };

  const selectChatImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - chatImages.length;
    if (remaining <= 0) return;
    setChatImages((current) => [
      ...current,
      ...Array.from(files)
        .slice(0, remaining)
        .map((file) => ({ name: file.name, preview: URL.createObjectURL(file) })),
    ]);
  };

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          [row.truck_code, row.bill_no, row.reference_no, row.driver_name, row.license_plate, row.route_name].some((value) => value.toLowerCase().includes(query));
        const deliveredCount = row.delivered_serial_numbers?.length || 0;
        const matchesQuickFilter =
          quickFilter === "ALL" ||
          (quickFilter === "UNREAD" && Boolean(unreadChats[row.id])) ||
          (quickFilter === "PARTIAL" && deliveredCount > 0 && deliveredCount < row.serial_numbers.length) ||
          (quickFilter === "POSTPONED" && row.status === "POSTPONED") ||
          (quickFilter === "PENDING" && row.status === "PENDING_CLOSE" && deliveredCount === 0);
        return matchesSearch && matchesQuickFilter && (!statusFilter || row.status === statusFilter);
      }),
    [rows, search, statusFilter, quickFilter, unreadChats],
  );

  const columns = useMemo<GridColDef<DeliveryTruckRow>[]>(
    () => [
      { field: "truck_code", headerName: "เลขใบรถกระจาย", minWidth: 150, flex: 1 },
      {
        field: "bill_no",
        headerName: "เลขที่บิล",
        minWidth: 145,
        renderCell: ({ row }) => (
          <button type="button" onClick={() => setBillDetailTarget(row)} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
            {row.bill_no}
          </button>
        ),
      },
      { field: "reference_no", headerName: "Reference", minWidth: 170 },
      { field: "driver_name", headerName: "คนขับ", minWidth: 150, flex: 1 },
      {
        field: "license_plate",
        headerName: "ทะเบียนรถ",
        minWidth: 180,
        renderCell: ({ row }) =>
          row.license_plate_province && row.license_plate_province !== "-" ? `${row.license_plate} ${row.license_plate_province}` : row.license_plate,
      },
      {
        field: "route_name",
        headerName: "สายรถ",
        minWidth: 190,
        flex: 1,
      },
      {
        field: "status",
        headerName: "สถานะ",
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[row.status].className}`}>{statusMeta[row.status].label}</span>
        ),
      },
      {
        field: "status_note",
        headerName: "รายละเอียด",
        minWidth: 180,
        flex: 1,
        renderCell: ({ row }) =>
          row.status === "COMPLETED" ? (
            <span className="text-slate-600">{`${row.status_note || "จัดส่งสำเร็จ"} ${row.completed_at || ""}`}</span>
          ) : (
            <span className="text-slate-600">{row.status_note || "-"}</span>
          ),
      },
      {
        field: "evidence",
        headerName: "รูปและลายเซ็น",
        width: 160,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) =>
          row.proof_images?.length || row.signature_images?.length || row.postpone_images?.length || row.return_images?.length ? (
            <div className="flex h-full w-full items-center justify-center gap-1 whitespace-nowrap">
              {row.proof_images?.length || row.postpone_images?.length || row.return_images?.length ? (
                <button
                  type="button"
                  onClick={() =>
                    setEvidenceModal({
                      title: `รูปประกอบ • ${row.bill_no}`,
                      images: row.proof_images?.length ? row.proof_images : row.postpone_images?.length ? row.postpone_images : row.return_images || [],
                    })
                  }
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <Images size={14} /> รูป
                </button>
              ) : null}
              {row.signature_images?.length ? (
                <button
                  type="button"
                  onClick={() => setEvidenceModal({ title: `ลายเซ็นผู้รับ • ${row.bill_no}`, images: row.signature_images || [] })}
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <FileSignature size={14} /> ลายเซ็น
                </button>
              ) : null}
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 250,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) =>
          row.status === "COMPLETED" ? (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={16} /> จัดส่งสำเร็จ
              </span>
              <button
                type="button"
                onClick={() => {
                  setCloseTarget(row);
                  setProofImages(row.proof_images || []);
                  setSignatureImages(row.signature_images || []);
                  setSignatureMode(row.signature_images?.length ? "UPLOAD" : "DRAW");
                  setSignaturePadData(null);
                  setCompletedAt(toInputDateTime());
                  setSelectedSerials([]);
                }}
                className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                แก้ไขรูป
              </button>
            </div>
          ) : row.status === "RETURN_TO_SHIPPER" ? (
            <span className="inline-flex h-full items-center text-xs font-semibold text-rose-600">ส่งคืนผู้ส่ง</span>
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCloseTarget(row);
                  setProofImages(row.proof_images || []);
                  setSignatureImages(row.signature_images || []);
                  setSignatureMode(row.signature_images?.length ? "UPLOAD" : "DRAW");
                  setSignaturePadData(null);
                  setCompletedAt(toInputDateTime());
                  setSelectedSerials([]);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} />
                ปิดงาน
              </button>
              <button
                type="button"
                onClick={() => setIssueTarget(row)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
              >
                <CalendarClock size={14} />
                แจ้งปัญหา
              </button>
            </div>
          ),
      },
      {
        field: "chat",
        headerName: "แชท",
        width: 90,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <div className="flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => openChat(row)}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              aria-label={`แชทบิล ${row.bill_no}`}
            >
              <MessageCircle size={16} />
              {unreadChats[row.id] ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadChats[row.id]}
                </span>
              ) : null}
            </button>
          </div>
        ),
      },
      { field: "operator_name", headerName: "คนทำรายการ", minWidth: 140 },
    ],
    [unreadChats],
  );

  const saveClose = () => {
    const previousDelivered = closeTarget?.delivered_serial_numbers || [];
    const resolvedSignatureImages =
      signatureMode === "DRAW" && signaturePadData ? [{ name: "signature-pad.png", preview: signaturePadData }] : signatureImages;
    if (
      !closeTarget ||
      !proofImages.length ||
      !resolvedSignatureImages.length ||
      (!selectedSerials.length && previousDelivered.length < closeTarget.serial_numbers.length)
    )
      return;
    setRows((current) =>
      current.map((row) =>
        row.id === closeTarget.id
          ? (() => {
              const delivered = Array.from(new Set([...(row.delivered_serial_numbers || []), ...selectedSerials]));
              const isComplete = delivered.length === row.serial_numbers.length;
              return {
                ...row,
                status: isComplete ? "COMPLETED" : "PENDING_CLOSE",
                completed_at: isComplete ? row.completed_at || toThaiDateTime(completedAt) : undefined,
                proof_images: proofImages,
                signature_images: resolvedSignatureImages,
                delivered_serial_numbers: delivered,
                operator_name: currentOperatorName,
                status_note: `${isComplete ? "จัดส่งสำเร็จ" : "จัดส่งแล้ว"} ${delivered.length}/${row.serial_numbers.length} กล่อง`,
              };
            })()
          : row,
      ),
    );
    resetCloseForm();
  };

  const previouslyDeliveredSerials = closeTarget?.delivered_serial_numbers || [];
  const selectableSerials = closeTarget?.serial_numbers.filter((serial) => !previouslyDeliveredSerials.includes(serial)) || [];
  const selectedTotal = previouslyDeliveredSerials.length + selectedSerials.length;

  const saveIssue = () => {
    if (!issueTarget || !issueType || !issueNote.trim()) return;
    const returnToShipper = issueMode === "RETURN_TO_SHIPPER";
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    setRows((current) =>
      current.map((row) =>
        row.id === issueTarget.id
          ? {
              ...row,
              status: returnToShipper ? "RETURN_TO_SHIPPER" : "POSTPONED",
              status_note: issueNote.trim(),
              next_delivery_date: returnToShipper ? undefined : toThaiDate(nextDay.toISOString().slice(0, 10)),
              postpone_images: returnToShipper ? undefined : postponeImages,
              return_images: returnToShipper ? postponeImages : undefined,
            }
          : row,
      ),
    );
    resetIssueForm();
  };

  const exportExcel = () => {
    const data = filteredRows.map((row) => ({
      เลขใบรถกระจาย: row.truck_code,
      เลขที่บิล: row.bill_no,
      Reference: row.reference_no,
      คนขับ: row.driver_name,
      ทะเบียนรถ: row.license_plate,
      สายรถ: row.route_name,
      สถานะ: statusMeta[row.status].label,
      รายละเอียด: row.status_note || "",
      SN: row.serial_numbers.join(", "),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "สถานะจัดส่ง");
    XLSX.writeFile(workbook, "delivery-status.xlsx");
  };

  const monitoringCards: {
    key: Exclude<QuickFilter, "ALL">;
    label: string;
    count: number;
    icon: ReactNode;
    activeClass: string;
    iconClass: string;
  }[] = [
    {
      key: "UNREAD",
      label: "ข้อความใหม่",
      count: rows.filter((row) => Boolean(unreadChats[row.id])).length,
      icon: <MessageCircle size={18} />,
      activeClass: "border-sky-300 bg-sky-50",
      iconClass: "bg-sky-100 text-sky-700",
    },
    {
      key: "PARTIAL",
      label: "จัดส่งบางส่วน",
      count: rows.filter((row) => {
        const delivered = row.delivered_serial_numbers?.length || 0;
        return delivered > 0 && delivered < row.serial_numbers.length;
      }).length,
      icon: <CheckCircle2 size={18} />,
      activeClass: "border-blue-300 bg-blue-50",
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      key: "POSTPONED",
      label: "เลื่อนจัดส่ง",
      count: rows.filter((row) => row.status === "POSTPONED").length,
      icon: <CalendarClock size={18} />,
      activeClass: "border-orange-300 bg-orange-50",
      iconClass: "bg-orange-100 text-orange-700",
    },
    {
      key: "PENDING",
      label: "รอปิดงาน",
      count: rows.filter((row) => row.status === "PENDING_CLOSE" && !row.delivered_serial_numbers?.length).length,
      icon: <Camera size={18} />,
      activeClass: "border-amber-300 bg-amber-50",
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {monitoringCards.map((card) => {
          const isActive = quickFilter === card.key;
          return (
            <button
              type="button"
              key={card.key}
              onClick={() => {
                setStatusFilter("");
                setQuickFilter((current) => (current === card.key ? "ALL" : card.key));
              }}
              className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-slate-300 ${isActive ? card.activeClass : "border-slate-200"}`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.iconClass}`}>{card.icon}</span>
              <span>
                <span className="block text-lg font-bold leading-none text-slate-800">{card.count}</span>
                <span className="mt-1 block text-xs font-medium text-slate-500">{card.label}</span>
              </span>
            </button>
          );
        })}
      </section>
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-md">
              <label className="mb-1 block text-xs font-medium text-slate-600">ค้นหา</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="เลขที่ใบรถ, เลขที่บิล, คนขับ, ทะเบียนรถ"
                  className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="w-full sm:w-52">
              <label className="mb-1 block text-xs font-medium text-slate-600">สถานะ</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as DeliveryStatus | "");
                    setQuickFilter("ALL");
                  }}
                  className="h-9 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">ทุกสถานะ</option>
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-amber-100 px-2.5 py-1.5 font-semibold text-amber-700">
              รอปิดงาน {rows.filter((row) => row.status === "PENDING_CLOSE").length}
            </span>
            <span className="rounded-full bg-orange-100 px-2.5 py-1.5 font-semibold text-orange-700">
              เลื่อนจัดส่ง {rows.filter((row) => row.status === "POSTPONED").length}
            </span>
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Download size={15} /> Export Excel
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden">
        {loadError ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-400">
            กำลังโหลดรายการจัดส่ง...
          </div>
        ) : (
          <DataGrid rows={filteredRows} columns={columns} getRowId={(row) => row.id} height="100%" pageSize={10} />
        )}
      </section>

      <Drawer
        anchor="right"
        open={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 }, boxShadow: "-8px 0 24px rgba(15, 23, 42, 0.12)" } } }}
      >
        {chatTarget && (
          <div className="flex h-full flex-col bg-slate-50">
            <div className="flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <MessageCircle size={17} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">แชทบิล</h2>
                    <p className="text-xs text-slate-500">{chatTarget.bill_no}</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-slate-500">
                  ใบรถ {chatTarget.truck_code} • คนขับ {chatTarget.driver_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatTarget(null)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="ปิดแชท"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={chatScrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {(chatMessages[chatTarget.id] || []).length ? (
                (chatMessages[chatTarget.id] || []).map((message) => {
                  const isCurrentUser = message.sender_role === "ADMIN" && message.sender_name === currentOperatorName;
                  return (
                    <div key={message.id} className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${message.sender_role === "DRIVER" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {message.sender_name.slice(0, 1)}
                      </div>
                      <div className={`max-w-[78%] ${isCurrentUser ? "text-right" : ""}`}>
                        <div className={`mb-1 flex items-center gap-1.5 text-[11px] text-slate-500 ${isCurrentUser ? "justify-end" : ""}`}>
                          <span className="font-semibold text-slate-600">{message.sender_name}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 ${message.sender_role === "DRIVER" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}
                          >
                            {message.sender_role === "DRIVER" ? "คนขับ" : "แอดมิน"}
                          </span>
                          <span>{message.sent_at}</span>
                        </div>
                        <div
                          className={`inline-block text-left rounded-2xl px-3 py-2 text-sm leading-relaxed ${isCurrentUser ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}
                        >
                          {message.images?.length ? (
                            <div className={`grid gap-1.5 ${message.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                              {message.images.map((image, index) => (
                                <img
                                  key={`${image.preview}-${index}`}
                                  src={image.preview}
                                  alt={image.name}
                                  className="h-28 w-full rounded-lg bg-slate-100 object-cover"
                                />
                              ))}
                            </div>
                          ) : null}
                          {message.message ? <p className={message.images?.length ? "mt-2" : ""}>{message.message}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="pt-16 text-center text-sm text-slate-400">ยังไม่มีข้อความในบิลนี้</div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              {chatImages.length ? (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {chatImages.map((image, index) => (
                    <div
                      key={`${image.preview}-${index}`}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      <img src={image.preview} alt={image.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setChatImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                        className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-rose-600"
                        aria-label={`ลบรูป ${index + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <label
                  className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-blue-600 ${chatImages.length >= 4 ? "pointer-events-none opacity-40" : ""}`}
                  title="แนบรูปภาพ"
                >
                  <ImagePlus size={18} />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => selectChatImages(event.target.files)} />
                </label>
                <textarea
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  rows={2}
                  placeholder="พิมพ์ข้อความถึงคนขับ..."
                  className="max-h-24 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!chatDraft.trim() && !chatImages.length}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="ส่งข้อความ"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">แนบรูปได้สูงสุด 4 รูป • Enter เพื่อส่ง • Shift + Enter เพื่อขึ้นบรรทัดใหม่</p>
            </div>
          </div>
        )}
      </Drawer>

      {billDetailTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl animate-scaleIn">
            <ModalHeader
              title="รายละเอียดบิล"
              subtitle={`${billDetailTarget.bill_no} • ใบรถ ${billDetailTarget.truck_code}`}
              onClose={() => setBillDetailTarget(null)}
            />
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">รายการ SN</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {billDetailTarget.delivered_serial_numbers?.length || 0}/{billDetailTarget.serial_numbers.length} จัดส่งสำเร็จ
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {billDetailTarget.serial_numbers.map((serial, index) => (
                  <div key={serial} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                    <span className="w-6 text-xs text-slate-400">{index + 1}</span>
                    <span className="font-mono text-sm font-medium text-slate-700">{serial}</span>
                    {billDetailTarget.delivered_serial_numbers?.includes(serial) ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={16} /> จัดส่งสำเร็จ
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setBillDetailTarget(null)}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {evidenceModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl animate-scaleIn">
            <ModalHeader title={evidenceModal.title} subtitle={`${evidenceModal.images.length} รูป`} onClose={() => setEvidenceModal(null)} />
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-3">
                {evidenceModal.images.map((image, index) => (
                  <figure key={`${image.preview}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img src={image.preview} alt={image.name} className="h-32 w-full rounded-md bg-slate-100 object-contain" />
                    <figcaption className="mt-2 truncate text-xs text-slate-500">{image.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setEvidenceModal(null)}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {closeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl animate-scaleIn">
            <ModalHeader
              title="ปิดงานขนส่ง"
              subtitle={`ใบรถ ${closeTarget.truck_code} • ${closeTarget.driver_name} • ${closeTarget.license_plate}`}
              onClose={resetCloseForm}
            />
            <div className="min-h-[430px] max-h-[65vh] space-y-4 overflow-y-auto px-4 py-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      เลือกกล่องที่จัดส่งสำเร็จ<span className="ml-1 text-red-500">*</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">เลือก SN ของกล่องที่ส่งสำเร็จในบิลนี้</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {selectedTotal}/{closeTarget.serial_numbers.length} กล่อง
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSerials(selectedSerials.length === selectableSerials.length ? [] : selectableSerials)}
                      disabled={!selectableSerials.length}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {selectedSerials.length === selectableSerials.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                    </button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
                  {closeTarget.serial_numbers.map((serial, index) => {
                    const wasDelivered = previouslyDeliveredSerials.includes(serial);
                    const checked = wasDelivered || selectedSerials.includes(serial);
                    return (
                      <label
                        key={serial}
                        className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm transition-colors last:border-b-0 ${wasDelivered ? "cursor-not-allowed bg-emerald-50 text-emerald-700" : checked ? "cursor-pointer bg-blue-50 text-blue-700" : "cursor-pointer text-slate-600 hover:bg-slate-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={wasDelivered}
                          onChange={() =>
                            setSelectedSerials((current) => (checked ? current.filter((value) => value !== serial) : [...current, serial]))
                          }
                          className={`h-4 w-4 rounded border-slate-300 focus:ring-blue-500 ${wasDelivered ? "text-emerald-600" : "text-blue-600"}`}
                        />
                        <span className="w-6 text-xs text-slate-400">{index + 1}</span>
                        <span className="font-mono text-xs font-medium">{serial}</span>
                        {wasDelivered ? <CheckCircle2 size={15} className="ml-auto text-emerald-600" /> : null}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                <ImageUpload label="รูปหลักฐานการส่ง" required values={proofImages} onChange={setProofImages} thumbnailSize="large" />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("DRAW")}
                      className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "DRAW" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      เซ็นบนหน้าจอ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode("UPLOAD")}
                      className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "UPLOAD" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      อัปโหลดรูปลายเซ็น
                    </button>
                  </div>
                  {signatureMode === "DRAW" ? (
                    <SignaturePad onChange={setSignaturePadData} />
                  ) : (
                    <ImageUpload
                      label="รูปลายเซ็นผู้รับ"
                      required
                      values={signatureImages}
                      onChange={setSignatureImages}
                      maxImages={1}
                      thumbnailSize="large"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  เวลาส่งสำเร็จ<span className="ml-1 text-red-500">*</span>
                </label>
                <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                  <CalendarClock size={16} className="mr-2 text-slate-400" />
                  {toThaiDateTime(completedAt)}
                  <span className="ml-auto text-xs font-normal text-slate-400">บันทึกอัตโนมัติ</span>
                </div>
              </div>
            </div>
            <ModalFooter
              onCancel={resetCloseForm}
              onConfirm={saveClose}
              disabled={
                !proofImages.length ||
                !(signatureMode === "DRAW" ? Boolean(signaturePadData) : signatureImages.length > 0) ||
                (!selectedSerials.length && previouslyDeliveredSerials.length < closeTarget.serial_numbers.length)
              }
              label={previouslyDeliveredSerials.length === closeTarget.serial_numbers.length ? "บันทึกรูปภาพ" : "ยืนยันปิดงาน"}
            />
          </div>
        </div>
      )}

      {issueTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl animate-scaleIn">
            <ModalHeader
              title="แจ้งปัญหาการจัดส่ง"
              subtitle={`ใบรถ ${issueTarget.truck_code} • ${issueTarget.driver_name} • ${issueTarget.license_plate}`}
              onClose={resetIssueForm}
            />
            <div className="max-h-[65vh] space-y-4 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button type="button" onClick={() => setIssueMode("POSTPONED")} className={`h-9 rounded-md text-sm font-semibold transition-colors ${issueMode === "POSTPONED" ? "bg-white text-orange-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  เลื่อนส่ง
                </button>
                <button type="button" onClick={() => setIssueMode("RETURN_TO_SHIPPER")} className={`h-9 rounded-md text-sm font-semibold transition-colors ${issueMode === "RETURN_TO_SHIPPER" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  ส่งคืนผู้ส่ง
                </button>
              </div>
              <ImageUpload label="รูป" values={postponeImages} onChange={setPostponeImages} maxImages={4} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  ปัญหาการจัดส่ง<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">เลือกปัญหาการจัดส่ง</option>
                  {sendProblems.map((problem) => (
                    <option key={problem.reason_send_problem_id} value={String(problem.reason_send_problem_id)}>
                      {problem.reason_send_problem_detail}
                    </option>
                  ))}
                </select>
                <p className={`mt-2 min-h-4 text-xs ${issueMode === "POSTPONED" ? "text-orange-700" : "text-transparent"}`}>
                  {issueMode === "POSTPONED" ? "ระบบจะตั้งวันจัดส่งใหม่เป็นวันถัดไปโดยอัตโนมัติ" : "-"}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  รายละเอียดปัญหา<span className="ml-1 text-red-500">*</span>
                </label>
                <textarea
                  value={issueNote}
                  onChange={(event) => setIssueNote(event.target.value)}
                  rows={4}
                  placeholder="ระบุรายละเอียดปัญหาการจัดส่ง"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <ModalFooter
              onCancel={resetIssueForm}
              onConfirm={saveIssue}
              disabled={!issueType || !issueNote.trim()}
              label="ยืนยัน"
              tone={issueMode === "POSTPONED" ? "orange" : "red"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="ปิด"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  disabled,
  label,
  tone = "green",
}: {
  onCancel: () => void;
  onConfirm: () => void;
  disabled: boolean;
  label: string;
  tone?: "green" | "orange" | "red";
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
      <button
        type="button"
        onClick={onCancel}
        className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={`inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${tone === "green" ? "bg-emerald-600 hover:bg-emerald-700" : tone === "red" ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-600 hover:bg-orange-700"}`}
      >
        <FileSignature size={16} />
        {label}
      </button>
    </div>
  );
}
