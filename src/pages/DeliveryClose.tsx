import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Drawer from "@mui/material/Drawer";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  FileSignature,
  ImagePlus,
  Images,
  LoaderCircle,
  MessageCircle,
  Send,
  Search,
  X,
} from "lucide-react";

import ImageUpload, { type UploadedImages } from "../components/form/ImageUpload";
import SignaturePad from "../components/form/SignaturePad";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { toInputDateTime, toThaiDateTime } from "../utils/dateTime";
import { getUploadUrl } from "../utils/uploadUrl";

type DeliveryStatus = "PENDING_CLOSE" | "POSTPONED" | "COMPLETED" | "RETURN_TO_SHIPPER";
type QuickFilter = "ALL" | "UNREAD" | "PARTIAL" | "POSTPONED" | "PENDING";
type LookupType = "receive_code" | "serial_no" | "reference_no";

type DeliveryTruckRow = {
  id: string;
  truck_code: string;
  bill_no: string;
  reference_no: string;
  serial_numbers: string[];
  serial_items: { serial_id: string; serial_no: string; delivery_status?: DeliveryStatus }[];
  delivered_serial_numbers?: string[];
  delivered_serial_ids?: string[];
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

const previewToFile = async (image: { name: string; preview: string }) => {
  const response = await fetch(getUploadUrl(image.preview));
  const blob = await response.blob();
  return new File([blob], image.name, { type: blob.type || "image/jpeg" });
};

const getCloseLocation = () =>
  new Promise<{ lat?: number; lng?: number; accuracy_m?: number }>((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }
    const timeout = window.setTimeout(() => resolve({}), 8000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeout);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        });
      },
      () => {
        window.clearTimeout(timeout);
        resolve({});
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
    );
  });

type DeliveryCompleteResponse = {
  data?: DeliveryTruckRow[];
  message?: string;
};

type DeliverySaveResponse = {
  data?: {
    proof_images?: UploadedImages;
    signature_images?: UploadedImages;
  };
  message?: string;
};

export default function DeliveryClose() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentOperatorName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "-";
  const [rows, setRows] = useState<DeliveryTruckRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lookup, setLookup] = useState("");
  const [lookupType, setLookupType] = useState<LookupType>("receive_code");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL");
  const [closeTarget, setCloseTarget] = useState<DeliveryTruckRow | null>(null);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [proofImages, setProofImages] = useState<UploadedImages>([]);
  const [signatureImages, setSignatureImages] = useState<UploadedImages>([]);
  const [signatureMode, setSignatureMode] = useState<"DRAW" | "UPLOAD">("UPLOAD");
  const [signaturePadData, setSignaturePadData] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState(toInputDateTime);
  const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);
  const [billDetailTarget, setBillDetailTarget] = useState<DeliveryTruckRow | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<{ title: string; images: UploadedImages } | null>(null);
  const [chatTarget, setChatTarget] = useState<DeliveryTruckRow | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadChats, setUnreadChats] = useState<Record<string, number>>({});
  const [chatDraft, setChatDraft] = useState("");
  const [chatImages, setChatImages] = useState<UploadedImages>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatTarget) return;
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [chatTarget, chatMessages]);

  useEffect(() => {
    if (!closeSaving) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "wait";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [closeSaving]);

  const resetCloseForm = () => {
    setCloseTarget(null);
    setCloseConfirmationOpen(false);
    setCloseSaving(false);
    setCloseError("");
    setProofImages([]);
    setSignatureImages([]);
    setSignatureMode("UPLOAD");
    setSignaturePadData(null);
    setCompletedAt(toInputDateTime());
    setSelectedSerialIds([]);
  };

  const openCloseForm = (row: DeliveryTruckRow) => {
    setCloseTarget(row);
    setCloseConfirmationOpen(false);
    setCloseError("");
    setProofImages(row.proof_images || []);
    setSignatureImages(row.signature_images || []);
    setSignatureMode("UPLOAD");
    setSignaturePadData(null);
    setCompletedAt(toInputDateTime());
    setSelectedSerialIds([]);
  };

  const findDeliveryForClose = async () => {
    const query = lookup.trim();
    if (!query) return;

    try {
      setLoading(true);
      setLoadError("");
      const response = await AxiosInstance.get<DeliveryCompleteResponse>("/delivery-closes", {
        params: { page: 1, limit: 100, search: query, search_type: lookupType },
      });
      const resultRows = Array.isArray(response.data.data) ? response.data.data : [];
      const normalizedQuery = query.toLowerCase();
      const matchedRows = resultRows.filter((row) =>
        lookupType === "receive_code"
          ? row.bill_no.trim().toLowerCase() === normalizedQuery
          : lookupType === "reference_no"
            ? row.reference_no.split(",").some((reference) => reference.trim().toLowerCase() === normalizedQuery)
            : row.serial_numbers.some((serialNo) => serialNo.trim().toLowerCase() === normalizedQuery),
      );
      const matchedRow = matchedRows[0];

      setRows(resultRows);
      if (!matchedRow) {
        setLoadError(`ไม่พบ${lookupType === "receive_code" ? " Receive Code" : lookupType === "reference_no" ? " Reference" : " Serial No."} ที่ระบุ`);
        return;
      }
      if (matchedRows.length > 1) {
        setLoadError("พบมากกว่าหนึ่งบิล กรุณาค้นหาด้วย Receive Code เพื่อเลือกรายการที่ถูกต้อง");
        return;
      }

      setLookup("");
      openCloseForm(matchedRow);
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } }; message?: string };
      setLoadError(requestError.response?.data?.message || requestError.message || "ไม่สามารถค้นหารายการจัดส่งได้");
    } finally {
      setLoading(false);
    }
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
            <div className="flex h-full w-full items-center justify-center">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={16} /> จัดส่งสำเร็จ
              </span>
            </div>
          ) : row.status === "RETURN_TO_SHIPPER" ? (
            <span className="inline-flex h-full items-center text-xs font-semibold text-rose-600">ส่งคืนผู้ส่ง</span>
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => openCloseForm(row)}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} />
                ปิดงาน
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

  const removeBillMedia = async (type: "proof" | "signature", image: UploadedImages[number], index: number) => {
    const setImages = type === "proof" ? setProofImages : setSignatureImages;
    if (!image.id) {
      setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
      return;
    }
    if (!closeTarget) return;

    try {
      setCloseError("");
      await AxiosInstance.delete(`/delivery-closes/media/${image.id}`, { data: { receive_code: closeTarget.bill_no } });
      setImages((current) => current.filter((currentImage) => currentImage.id !== image.id));
      setRows((current) =>
        current.map((row) =>
          row.id !== closeTarget.id
            ? row
            : type === "proof"
              ? { ...row, proof_images: (row.proof_images || []).filter((currentImage) => currentImage.id !== image.id) }
              : { ...row, signature_images: (row.signature_images || []).filter((currentImage) => currentImage.id !== image.id) },
        ),
      );
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } }; message?: string };
      setCloseError(requestError.response?.data?.message || requestError.message || "ไม่สามารถลบรูปได้");
    }
  };

  const saveClose = async () => {
    const resolvedSignatureImages =
      signatureMode === "DRAW" && signaturePadData ? [...signatureImages, { name: "signature-pad.png", preview: signaturePadData }] : signatureImages;
    if (
      !closeTarget ||
      !proofImages.length ||
      !resolvedSignatureImages.length ||
      !selectedSerialIds.length
    )
      return;
    try {
      setCloseSaving(true);
      setCloseError("");
      const formData = new FormData();
      formData.append("receive_code", closeTarget.bill_no);
      formData.append("serial_ids", JSON.stringify(selectedSerialIds));
      formData.append("delivered_datetime", completedAt);
      const location = await getCloseLocation();
      if (location.lat !== undefined) formData.append("lat", String(location.lat));
      if (location.lng !== undefined) formData.append("lng", String(location.lng));
      if (location.accuracy_m !== undefined) formData.append("accuracy_m", String(location.accuracy_m));
      for (const image of proofImages.filter((image) => !image.id)) formData.append("proof_images", await previewToFile(image));
      for (const image of resolvedSignatureImages.filter((image) => !image.id)) formData.append("sign_images", await previewToFile(image));
      const response = await AxiosInstance.post<DeliverySaveResponse>("/delivery-closes/statuses", formData);
      const savedProofImages = response.data.data?.proof_images || proofImages;
      const savedSignatureImages = response.data.data?.signature_images || resolvedSignatureImages;

      setRows((current) =>
        current.map((row) => {
          if (row.id !== closeTarget.id) return row;
          const selectedItems = row.serial_items.filter((item) => selectedSerialIds.includes(item.serial_id));
          const delivered = [...(row.delivered_serial_numbers || []), ...selectedItems.map((item) => item.serial_no)];
          const deliveredIds = Array.from(new Set([...(row.delivered_serial_ids || []), ...selectedSerialIds]));
          const isComplete = deliveredIds.length === row.serial_items.length;
          return {
            ...row,
            status: isComplete ? "COMPLETED" : "PENDING_CLOSE",
            completed_at: isComplete ? toThaiDateTime(completedAt) : undefined,
            proof_images: savedProofImages,
            signature_images: savedSignatureImages,
            delivered_serial_numbers: delivered,
            delivered_serial_ids: deliveredIds,
            operator_name: currentOperatorName,
            status_note: `${isComplete ? "จัดส่งสำเร็จ" : "จัดส่งแล้ว"} ${deliveredIds.length}/${row.serial_items.length} กล่อง`,
          };
        }),
      );
      resetCloseForm();
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } }; message?: string };
      setCloseError(requestError.response?.data?.message || requestError.message || "ไม่สามารถบันทึกผลจัดส่งได้");
    } finally {
      setCloseSaving(false);
    }
  };

  const previouslyDeliveredSerialIds = closeTarget?.delivered_serial_ids || [];
  const selectableSerialItems = closeTarget?.serial_items.filter((item) => !previouslyDeliveredSerialIds.includes(item.serial_id)) || [];
  const selectedTotal = previouslyDeliveredSerialIds.length + selectedSerialIds.length;
  const isClosedBill = closeTarget?.status === "COMPLETED";

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

  // Keep the existing supporting actions available for the unchanged close-work modal flow.
  void setSearch;
  void setStatusFilter;
  void setQuickFilter;
  void filteredRows;
  void columns;
  void exportExcel;
  void monitoringCards;

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[15vh]">
        <form
          className="w-full max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            void findDeliveryForClose();
          }}
        >
          <label htmlFor="delivery-close-lookup" className="mb-4 block text-center text-xl font-bold text-slate-700 sm:text-2xl">
            ค้นหาเพื่อปิดงานจัดส่ง
          </label>
          <fieldset className="mb-3 flex flex-wrap justify-center gap-2" aria-label="ชนิดข้อมูลที่ต้องการค้นหา">
            {[
              { value: "receive_code", label: "Receive Code" },
              { value: "serial_no", label: "Serial No." },
              { value: "reference_no", label: "Reference" },
            ].map((option) => (
              <label
                key={option.value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${lookupType === option.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}
              >
                <input
                  type="radio"
                  name="delivery-close-lookup-type"
                  value={option.value}
                  checked={lookupType === option.value}
                  onChange={() => setLookupType(option.value as LookupType)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <div className="relative">
            <Search size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="delivery-close-lookup"
              autoFocus
              value={lookup}
              onChange={(event) => {
                setLookup(event.target.value);
                if (loadError) setLoadError("");
              }}
              placeholder={lookupType === "receive_code" ? "สแกนหรือกรอก Receive Code แล้วกด Enter" : lookupType === "reference_no" ? "สแกนหรือกรอก Reference แล้วกด Enter" : "สแกนหรือกรอก Serial No. แล้วกด Enter"}
              className="h-20 w-full rounded-xl border-2 border-slate-300 bg-white pl-14 pr-36 text-lg font-medium shadow-sm outline-none transition-colors placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-xl"
            />
            <button
              type="submit"
              disabled={!lookup.trim() || loading}
              className="absolute right-3 top-1/2 inline-flex h-12 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Search size={20} /> ค้นหา
            </button>
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">เลือกชนิดข้อมูลก่อนค้นหา เพื่อให้ได้รายการที่ตรงที่สุด</p>
          {loading ? <p className="mt-5 text-center text-sm font-medium text-slate-500">กำลังค้นหารายการจัดส่ง...</p> : null}
          {loadError ? <p className="mt-5 text-center text-sm font-medium text-rose-600">{loadError}</p> : null}
        </form>
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
                                  src={getUploadUrl(image.preview)}
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
                      <img src={getUploadUrl(image.preview)} alt={image.name} className="h-full w-full object-cover" />
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
                  {billDetailTarget.delivered_serial_ids?.length || 0}/{billDetailTarget.serial_items.length} จัดส่งสำเร็จ
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {billDetailTarget.serial_items.map((serial, index) => (
                  <div key={serial.serial_id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                    <span className="w-6 text-xs text-slate-400">{index + 1}</span>
                    <span className="font-mono text-sm font-medium text-slate-700">{serial.serial_no}</span>
                    {billDetailTarget.delivered_serial_ids?.includes(serial.serial_id) ? (
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
                    <img src={getUploadUrl(image.preview)} alt={image.name} className="h-32 w-full rounded-md bg-slate-100 object-contain" />
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
              title="ปิดงานจัดส่ง"
              subtitle={`Receive Code ${closeTarget.bill_no}${closeTarget.reference_no !== "-" ? ` • Reference ${closeTarget.reference_no}` : ""}`}
              onClose={resetCloseForm}
            />
            <div className="min-h-[430px] max-h-[65vh] space-y-4 overflow-y-auto px-4 py-4">
              {isClosedBill ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-bold">ปิดงานจัดส่งครบแล้ว</div>
                    <div className="mt-0.5 text-xs text-emerald-700">ส่งสำเร็จครบ {closeTarget.serial_items.length}/{closeTarget.serial_items.length} SN</div>
                  </div>
                </div>
              ) : null}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      เลือกกล่องที่ต้องการปิดงาน<span className="ml-1 text-red-500">*</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {selectedTotal}/{closeTarget.serial_items.length} กล่อง
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSerialIds(selectedSerialIds.length === selectableSerialItems.length ? [] : selectableSerialItems.map((item) => item.serial_id))}
                      disabled={!selectableSerialItems.length}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {selectedSerialIds.length === selectableSerialItems.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                    </button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
                  {closeTarget.serial_items.map((serial, index) => {
                    const wasDelivered = previouslyDeliveredSerialIds.includes(serial.serial_id);
                    const checked = wasDelivered || selectedSerialIds.includes(serial.serial_id);
                    return (
                      <label
                        key={serial.serial_id}
                        className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm transition-colors last:border-b-0 ${wasDelivered ? "cursor-not-allowed bg-emerald-50 text-emerald-700" : checked ? "cursor-pointer bg-blue-50 text-blue-700" : "cursor-pointer text-slate-600 hover:bg-slate-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={wasDelivered}
                          onChange={() =>
                            setSelectedSerialIds((current) => (checked ? current.filter((value) => value !== serial.serial_id) : [...current, serial.serial_id]))
                          }
                          className={`h-4 w-4 rounded border-slate-300 focus:ring-blue-500 ${wasDelivered ? "text-emerald-600" : "text-blue-600"}`}
                        />
                        <span className="w-6 text-xs text-slate-400">{index + 1}</span>
                        <span className="font-mono text-xs font-medium">{serial.serial_no}</span>
                        {wasDelivered ? <CheckCircle2 size={15} className="ml-auto text-emerald-600" /> : null}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="space-y-4">
                  <ImageUpload label="รูปหลักฐานการส่ง" required values={proofImages} onChange={setProofImages} onRemove={(image, index) => removeBillMedia("proof", image, index)} disabled={isClosedBill} maxImages={8} thumbnailSize="large" />
                  <div className="border-t border-slate-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <button type="button" onClick={() => setSignatureMode("UPLOAD")} disabled={isClosedBill} className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "UPLOAD" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-50`}>
                        อัปโหลดรูปลายเซ็น
                      </button>
                      <button type="button" onClick={() => setSignatureMode("DRAW")} disabled={isClosedBill || signatureImages.length >= 4} className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "DRAW" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-50`}>
                        เซ็นบนหน้าจอ
                      </button>
                    </div>
                    {signatureMode === "UPLOAD" ? (
                      <ImageUpload label="ลายเซ็นผู้รับ" required values={signatureImages} onChange={setSignatureImages} onRemove={(image, index) => removeBillMedia("signature", image, index)} disabled={isClosedBill} maxImages={4} thumbnailSize="large" />
                    ) : !isClosedBill ? (
                      <SignaturePad onChange={setSignaturePadData} />
                    ) : null}
                  </div>
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
              {closeError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{closeError}</p> : null}
            </div>
            <ModalFooter
              leadingAction={
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ bill_no: closeTarget.bill_no, truck_code: closeTarget.truck_code });
                    navigate(`/delivery-issue-chat?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                >
                  <MessageCircle size={16} />
                  แจ้งปัญหา
                </button>
              }
              onCancel={resetCloseForm}
              onConfirm={() => setCloseConfirmationOpen(true)}
              loading={closeSaving}
              disabled={
                closeSaving ||
                isClosedBill ||
                !proofImages.length ||
                !(signatureImages.length || Boolean(signaturePadData)) ||
                !selectedSerialIds.length
              }
              label={closeSaving ? "กำลังปิดงาน..." : isClosedBill ? "ปิดงานเรียบร้อย" : "ปิดงาน"}
            />
          </div>
        </div>
      )}

      {closeTarget && closeConfirmationOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-close-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-scaleIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>
            <h2 id="confirm-close-title" className="mt-4 text-center text-lg font-bold text-slate-800">ยืนยันปิดงาน?</h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Receive Code <span className="font-semibold text-slate-800">{closeTarget.bill_no}</span>
              <br />
              ปิดงาน SN ที่เลือก {selectedSerialIds.length} กล่อง
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setCloseConfirmationOpen(false)}
                disabled={closeSaving}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={() => {
                  setCloseConfirmationOpen(false);
                  void saveClose();
                }}
                disabled={closeSaving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle2 size={16} /> ยืนยันปิดงาน
              </button>
            </div>
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
  leadingAction,
  onCancel,
  onConfirm,
  disabled,
  label,
  loading = false,
  tone = "green",
}: {
  leadingAction?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  disabled: boolean;
  label: string;
  loading?: boolean;
  tone?: "green" | "orange" | "red";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
      <div>{leadingAction}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || loading}
          className={`inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${tone === "green" ? "bg-emerald-600 hover:bg-emerald-700" : tone === "red" ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-600 hover:bg-orange-700"}`}
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <FileSignature size={16} />}
          {label}
        </button>
      </div>
    </div>
  );
}
