import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ResizableColumns from "../components/ResizableColumns";
import WarehouseDropdown from "../components/dropdown/WarehouseDropdown";
import Pagination from "../components/Pagination";
import BillImageModal from "./BillImageModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type BillReportRow = {
  id: number;
  NO_BILL: string | null;
  REFERENCE: string | null;
  SEND_DATE: string | null;
  CUSTOMER_NAME: string | null;
  RECIPIENT_CODE: string | null;
  RECIPIENT_NAME: string | null;
  RECIPIENT_TEL: string | null;
  RECIPIENT_ADDRESS: string | null;
  RECIPIENT_SUBDISTRICT: string | null;
  RECIPIENT_DISTRICT: string | null;
  RECIPIENT_PROVINCE: string | null;
  RECIPIENT_ZIPCODE: string | null;
  SERIAL_NO: string | null;
  user_id: number;
  create_date: string | null;
  create_time: string | null;
  warehouse_name: string | null;
  type: string | null;
  customer_input: "Y" | "N" | null;
  warehouse_accept: "Y" | "N" | null;
  dc_accept: "Y" | "N" | null;
  image: "Y" | "N" | null;
  sign: "Y" | "N" | null;
  warehouse_id: number | null;
  bill_sign: string | null;
  bill_image_urls: string[] | null;
  bill_remark: string | null;
  bill_id?: number;
  bill_name?: string | null;
  bill_surname?: string | null;
  bill_license_plate?: string | null;
  created_at?: string | null;
};

type BillModalInfo = {
  name: string | null;
  surname: string | null;
  license_plate: string | null;
  remark: string | null;
};

const BASE_URL = "http://localhost:8001";
const API_ENDPOINT = `${BASE_URL}/bills-data`;

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildUpdateImagesUrl = (billId: number) =>
  `${BASE_URL}/api/bills/${billId}/images`;

export default function BillReport() {
  const { user } = useAuth();

  const [rows, setRows] = useState<BillReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchSerial, setSearchSerial] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [searchCreatedDate, setSearchCreatedDate] = useState<Date | null>(null);

  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize] = useState(100);
  const [total, setTotal] = useState(0);

  const [modalSerialNo, setModalSerialNo] = useState<string | null>(null);
  const [modalReference, setModalReference] = useState<string | null>(null);
  const [modalSignUrl, setModalSignUrl] = useState<string | null>(null);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalBillId, setModalBillId] = useState<number | null>(null);
  const [modalBillInfo, setModalBillInfo] = useState<BillModalInfo>({
    name: null,
    surname: null,
    license_plate: null,
    remark: null,
  });

  const [isEditingImages, setIsEditingImages] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [savingImages, setSavingImages] = useState(false);
  const [imageEditError, setImageEditError] = useState<string | null>(null);

  const headers = [
    "ลำดับ",
    "วันที่สร้าง",
    "SERIAL_NO",
    "REFERENCE",
    "ชื่อลูกค้า",
    "ผู้รับ",
    "ที่อยู่ผู้รับ",
    "ปลายทาง",
    "ประเภท",
    "สถานะ",
    "ลายเซ็น",
    "รูปภาพ",
    "หมายเหตุ",
    "คนปิดงาน",
    "ทะเบียนรถ",
  ];

  const renderStatusBadge = (value: "Y" | "N" | null, label: string) => {
    if (!value) return null;

    const isYes = value === "Y";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold shadow-sm ${
          isYes
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}
      >
        {label}: {isYes ? "Y" : "N"}
      </span>
    );
  };

  const buildFullAddress = (r: BillReportRow) => {
    const parts = [
      r.RECIPIENT_ADDRESS || "",
      r.RECIPIENT_SUBDISTRICT ? `ต.${r.RECIPIENT_SUBDISTRICT}` : "",
      r.RECIPIENT_DISTRICT ? `อ.${r.RECIPIENT_DISTRICT}` : "",
      r.RECIPIENT_PROVINCE ? `จ.${r.RECIPIENT_PROVINCE}` : "",
      r.RECIPIENT_ZIPCODE || "",
    ].filter(Boolean);

    return parts.join(" ");
  };

  const truncateText = (text: string, maxLength = 80) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const fetchData = async (
    customSerial?: string,
    customReference?: string,
    customWarehouseId?: number,
    customPage?: number,
    customCreatedDate?: Date | null,
  ) => {
    if (!user?.user_id) return;

    const serial = customSerial ?? searchSerial;
    const reference = customReference ?? searchReference;
    const warehouseId = customWarehouseId ?? selectedWarehouseId;
    const nextPage = customPage ?? page;
    const createdDate = customCreatedDate ?? searchCreatedDate;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(API_ENDPOINT, {
        params: {
          user_id: user.user_id,
          SERIAL_NO: serial && serial.length >= 3 ? serial : undefined,
          REFERENCE: reference && reference.length >= 3 ? reference : undefined,
          warehouse_id: warehouseId ?? undefined,
          page: nextPage,
          pageSize,
          created_at: createdDate ? formatDate(createdDate) : undefined,
        },
      });

      if (res.data?.success) {
        setRows(res.data.data || []);

        const pg = res.data.pagination;
        if (pg) {
          setPage(pg.page ?? nextPage);
          setPageCount(pg.totalPages ?? 1);
          setTotal(pg.total ?? 0);
        } else {
          setPage(nextPage);
          setPageCount(1);
          setTotal((res.data.data || []).length);
        }
      } else {
        setError(res.data?.message || "ดึงข้อมูลไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChange = (warehouseId: number | null) => {
    setSelectedWarehouseId(warehouseId);
    setPage(1);
    fetchData(
      searchSerial,
      searchReference,
      warehouseId ?? undefined,
      1,
      searchCreatedDate,
    );
  };

  const openImageModal = (r: BillReportRow) => {
    const signUrl = r.bill_sign ? `${BASE_URL}/${r.bill_sign}` : null;

    const images = Array.isArray(r.bill_image_urls)
      ? r.bill_image_urls.map((p: string) => `${BASE_URL}/${p}`)
      : [];

    if (!signUrl && images.length === 0) return;

    setModalSerialNo(r.SERIAL_NO || null);
    setModalReference(r.REFERENCE || null);
    setModalSignUrl(signUrl);
    setModalImages(images);

    setModalBillInfo({
      name: r.bill_name || null,
      surname: r.bill_surname || null,
      license_plate: r.bill_license_plate || null,
      remark: r.bill_remark ?? null,
    });

    setModalBillId(r.bill_id ?? null);
    setIsEditingImages(false);
    setImagesToDelete([]);
    setNewImages([]);
    setImageEditError(null);
  };

  const closeImageModal = () => {
    setModalSerialNo(null);
    setModalReference(null);
    setModalSignUrl(null);
    setModalImages([]);
    setModalBillInfo({
      name: null,
      surname: null,
      license_plate: null,
      remark: null,
    });
    setModalBillId(null);
    setIsEditingImages(false);
    setImagesToDelete([]);
    setNewImages([]);
    setImageEditError(null);
  };

  const toggleImageDelete = (url: string) => {
    setImagesToDelete((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files);
    const MAX_IMAGES = 8;

    const currentExisting = modalImages.length - imagesToDelete.length;
    const alreadyNew = newImages.length;
    const remainingSlots = MAX_IMAGES - currentExisting - alreadyNew;

    if (remainingSlots <= 0) {
      setImageEditError(
        `ไม่สามารถเพิ่มรูปได้เกิน ${MAX_IMAGES} รูป กรุณาลบรูปเก่าออกก่อน`,
      );
      e.target.value = "";
      return;
    }

    const useFiles = selected.slice(0, remainingSlots);

    if (useFiles.length < selected.length) {
      setImageEditError(
        `เพิ่มได้อีกสูงสุด ${remainingSlots} รูป ส่วนที่เกินจะไม่ถูกเพิ่ม`,
      );
    } else {
      setImageEditError(null);
    }

    setNewImages((prev) => [...prev, ...useFiles]);
    e.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveImages = async () => {
    if (!modalBillId || savingImages) return;

    setSavingImages(true);
    setImageEditError(null);

    try {
      const formData = new FormData();

      if (imagesToDelete.length > 0) {
        const relativePaths = imagesToDelete.map((fullUrl) =>
          fullUrl.replace(`${BASE_URL}/`, ""),
        );
        formData.append("deleteImageUrls", JSON.stringify(relativePaths));
      }

      newImages.forEach((file) => {
        formData.append("images", file);
      });

      const url = buildUpdateImagesUrl(modalBillId);

      const res = await axios.put(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.images) {
        const updatedFullUrls = res.data.images.map(
          (img: { image_url: string }) => `${BASE_URL}/${img.image_url}`,
        );
        setModalImages(updatedFullUrls);
        setImagesToDelete([]);
        setNewImages([]);
      }

      await fetchData();
      setIsEditingImages(false);
    } catch (err: any) {
      console.error(err);
      setImageEditError(
        err?.response?.data?.message ||
          "เกิดข้อผิดพลาดในการบันทึกการแก้ไขรูปภาพ",
      );
    } finally {
      setSavingImages(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      setPage(1);
      fetchData("", "", selectedWarehouseId ?? undefined, 1, searchCreatedDate);
    }
  }, [user?.user_id]);

  return (
    <div className="font-thai w-full h-full bg-white px-4 py-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            รายงาน
          </h2>
        </div>

        <div className="flex items-end gap-4 text-sm">
          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              ผู้ใช้งาน
            </span>
            <span className="font-medium">
              {user?.first_name || user?.username || "-"}
            </span>
          </div>

          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              จำนวนรายการ
            </span>
            <span className="font-semibold text-slate-800">
              {total.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <div className="mb-4 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-[11px] text-slate-600 mb-1 font-medium">
            ค้นหา SERIAL_NO
          </label>
          <input
            type="text"
            value={searchSerial}
            onChange={(e) => {
              const value = e.target.value;
              setSearchSerial(value);
              setPage(1);

              if (value.length === 0) {
                fetchData(
                  "",
                  searchReference,
                  selectedWarehouseId ?? undefined,
                  1,
                  searchCreatedDate,
                );
              } else if (value.length >= 3) {
                fetchData(
                  value,
                  searchReference,
                  selectedWarehouseId ?? undefined,
                  1,
                  searchCreatedDate,
                );
              }
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm min-w-[220px] shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            placeholder="อย่างน้อย 3 ตัว เช่น BX2..."
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] text-slate-600 mb-1 font-medium">
            ค้นหา REFERENCE
          </label>
          <input
            type="text"
            value={searchReference}
            onChange={(e) => {
              const value = e.target.value;
              setSearchReference(value);
              setPage(1);

              if (value.length === 0) {
                fetchData(
                  searchSerial,
                  "",
                  selectedWarehouseId ?? undefined,
                  1,
                  searchCreatedDate,
                );
              } else if (value.length >= 3) {
                fetchData(
                  searchSerial,
                  value,
                  selectedWarehouseId ?? undefined,
                  1,
                  searchCreatedDate,
                );
              }
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm min-w-[220px] shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            placeholder="อย่างน้อย 3 ตัว เช่น TR6..."
          />
        </div>

        <WarehouseDropdown onChange={handleWarehouseChange} />

        <div className="flex flex-col">
          <label className="text-[11px] text-slate-600 mb-1 font-medium">
            วันที่สร้าง
          </label>

          <DatePicker
            selected={searchCreatedDate}
            onChange={(date: Date | null) => {
              setSearchCreatedDate(date);
              setPage(1);

              fetchData(
                searchSerial,
                searchReference,
                selectedWarehouseId ?? undefined,
                1,
                date,
              );
            }}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="เลือกวันที่"
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm min-w-[180px] shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-slate-600 mt-4 text-sm">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && !error && (
        <div className="text-center text-slate-500 mt-4 text-sm">
          ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา
        </div>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="max-h-[75vh] overflow-auto rounded-xl">
            <table className="border-collapse min-w-max text-[13px]">
              <ResizableColumns
                headers={headers}
                pageKey="bill-report"
                minWidths={{
                  8: 50,
                  9: 370,
                  10: 80,
                  11: 370,
                }}
              />

              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-100/70`}
                  >
                    <td className="px-2 py-1.5 border-b border-slate-200 text-center bg-gray-100 font-semibold sticky left-0 z-10">
                      {idx + 1}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 leading-snug min-w-[160px]">
                      {r.created_at
                        ? new Date(
                            r.created_at.replace(" ", "T"),
                          ).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>

                    <td
                      onClick={() => openImageModal(r)}
                      title="คลิกเพื่อดูรูปภาพ"
                      className="px-2 py-1.5 border-b border-slate-200 truncate font-medium cursor-pointer hover:text-blue-600"
                    >
                      🔍 {r.SERIAL_NO || "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                      {r.REFERENCE || "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                      {r.CUSTOMER_NAME || "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 leading-snug truncate max-w-[120px]">
                      {truncateText(
                        `${r.RECIPIENT_NAME || "-"}${
                          r.RECIPIENT_TEL ? ` (${r.RECIPIENT_TEL})` : ""
                        }`,
                        100,
                      )}
                    </td>

                    <td
                      className="px-2 py-1.5 border-b border-slate-200 leading-snug max-w-[220px] truncate"
                      title={buildFullAddress(r)}
                    >
                      {truncateText(buildFullAddress(r), 255)}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 leading-snug">
                      {r.warehouse_name || "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-[11px] text-center">
                      <span className="inline-flex items-center rounded-full px-2 py-[2px] bg-slate-50 border border-slate-200">
                        {r.type || "-"}
                      </span>
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-[10px]">
                      <div className="flex flex-wrap gap-1">
                        {renderStatusBadge(r.customer_input, "นำเข้าบิล")}
                        {renderStatusBadge(r.warehouse_accept, "คลังรับเข้า")}
                        {renderStatusBadge(r.dc_accept, "DC รับเข้า")}
                        {renderStatusBadge(r.image, "รูปภาพ")}
                        {renderStatusBadge(r.sign, "ลายเซ็น")}
                      </div>
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-center">
                      {r.bill_sign ? (
                        <img
                          src={`${BASE_URL}/${r.bill_sign}`}
                          className="h-8 mx-auto rounded border border-slate-200 cursor-pointer hover:scale-125 transition"
                          onClick={() =>
                            window.open(`${BASE_URL}/${r.bill_sign}`, "_blank")
                          }
                          alt=""
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-center">
                      {r.bill_image_urls && r.bill_image_urls.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {r.bill_image_urls.map((img, i) => (
                            <img
                              key={i}
                              src={`${BASE_URL}/${img}`}
                              className="h-8 w-10 object-cover rounded border border-slate-200 cursor-pointer hover:scale-125 transition"
                              onClick={() =>
                                window.open(`${BASE_URL}/${img}`, "_blank")
                              }
                              alt=""
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                      {r.bill_remark || "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-[11px] text-slate-500 min-w-[180px]">
                      {r.bill_name || r.bill_surname
                        ? `${r.bill_name || ""} ${r.bill_surname || ""}`
                        : "-"}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200 text-[11px] text-slate-500 min-w-[140px]">
                      {r.bill_license_plate || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        disabled={loading}
        onPageChange={(p) => {
          setPage(p);
          fetchData(undefined, undefined, undefined, p, searchCreatedDate);
        }}
      />

      <BillImageModal
        open={!!modalSignUrl || modalImages.length > 0}
        serialNo={modalSerialNo}
        reference={modalReference}
        signUrl={modalSignUrl}
        images={modalImages}
        billId={modalBillId}
        billInfo={modalBillInfo}
        isEditingImages={isEditingImages}
        imagesToDelete={imagesToDelete}
        newImages={newImages}
        savingImages={savingImages}
        imageEditError={imageEditError}
        onClose={closeImageModal}
        onToggleEdit={() => {
          setIsEditingImages((prev) => !prev);
          setImagesToDelete([]);
          setImageEditError(null);
        }}
        onToggleDelete={toggleImageDelete}
        onNewImagesChange={handleNewImagesChange}
        onRemoveNewImage={removeNewImage}
        onSave={handleSaveImages}
        setImagesToDelete={setImagesToDelete}
        setNewImages={setNewImages}
        setImageEditError={setImageEditError}
        setIsEditingImages={setIsEditingImages}
      />
    </div>
  );
}
