import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, FileSignature, Search, X } from "lucide-react";

import ImageUpload, { type UploadedImages } from "../components/tms/form/ImageUpload";
import SignaturePad from "../components/tms/form/SignaturePad";
import AxiosInstance from "../services/apiClient";
import { getUploadUrl } from "../services/uploadUrl";

type DeliveryStatus = "PENDING_CLOSE" | "POSTPONED" | "COMPLETED" | "RETURN_TO_SHIPPER";
type LookupType = "receive_code" | "serial_no" | "reference_no";

type DeliveryTruckRow = {
  bill_no: string;
  reference_no: string;
  serial_numbers: string[];
  serial_items: { serial_id: string; serial_no: string }[];
  delivered_serial_ids?: string[];
  status: DeliveryStatus;
  proof_images?: UploadedImages;
  signature_images?: UploadedImages;
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
};

export default function DeliveryClose() {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lookup, setLookup] = useState("");
  const [lookupType, setLookupType] = useState<LookupType>("receive_code");
  const [closeTarget, setCloseTarget] = useState<DeliveryTruckRow | null>(null);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [proofImages, setProofImages] = useState<UploadedImages>([]);
  const [signatureImages, setSignatureImages] = useState<UploadedImages>([]);
  const [signatureMode, setSignatureMode] = useState<"DRAW" | "UPLOAD">("UPLOAD");
  const [signaturePadData, setSignaturePadData] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

      if (!matchedRow) {
        setLoadError(
          `ไม่พบ${lookupType === "receive_code" ? " Receive Code" : lookupType === "reference_no" ? " Reference" : " Serial No."} ที่ระบุ`,
        );
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
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } }; message?: string };
      setCloseError(requestError.response?.data?.message || requestError.message || "ไม่สามารถลบรูปได้");
    }
  };

  const saveClose = async () => {
    const resolvedSignatureImages =
      signatureMode === "DRAW" && signaturePadData ? [...signatureImages, { name: "signature-pad.png", preview: signaturePadData }] : signatureImages;
    if (!closeTarget || !proofImages.length || !resolvedSignatureImages.length || !selectedSerialIds.length) return;
    const deliveredNow = new Date();
    const deliveredAt = new Date(deliveredNow.getTime() - deliveredNow.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
    try {
      setCloseSaving(true);
      setCloseError("");
      const formData = new FormData();
      formData.append("receive_code", closeTarget.bill_no);
      formData.append("serial_ids", JSON.stringify(selectedSerialIds));
      formData.append("delivered_datetime", deliveredAt);
      const location = await getCloseLocation();
      if (location.lat !== undefined) formData.append("lat", String(location.lat));
      if (location.lng !== undefined) formData.append("lng", String(location.lng));
      if (location.accuracy_m !== undefined) formData.append("accuracy_m", String(location.accuracy_m));
      for (const image of proofImages.filter((image) => !image.id)) formData.append("proof_images", await previewToFile(image));
      for (const image of resolvedSignatureImages.filter((image) => !image.id)) formData.append("sign_images", await previewToFile(image));
      await AxiosInstance.post("/delivery-closes/statuses", formData);
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

  return (
    <div className={closeTarget ? "min-h-[calc(100vh-61px)] w-full bg-slate-50 text-slate-800" : "flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800"}>
      {!closeTarget ? <section className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[15vh]">
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
              placeholder={
                lookupType === "receive_code"
                  ? "สแกนหรือกรอก Receive Code แล้วกด Enter"
                  : lookupType === "reference_no"
                    ? "สแกนหรือกรอก Reference แล้วกด Enter"
                    : "สแกนหรือกรอก Serial No. แล้วกด Enter"
              }
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
          {loading ? <p className="mt-5 text-center text-sm font-medium text-slate-500">กำลังค้นหารายการจัดส่ง...</p> : null}
          {loadError ? <p className="mt-5 text-center text-sm font-medium text-rose-600">{loadError}</p> : null}
        </form>
      </section> : null}

      {closeTarget && (
        <section className="w-full px-3 py-3 lg:px-4 lg:py-4">
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ModalHeader
              title="ปิดงานจัดส่ง"
              subtitle={`Receive Code ${closeTarget.bill_no}${closeTarget.reference_no !== "-" ? ` • Reference ${closeTarget.reference_no}` : ""}`}
              onClose={resetCloseForm}
            />
            <div className="space-y-4 px-4 py-4">
              {isClosedBill ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-bold">ปิดงานจัดส่งครบแล้ว</div>
                    <div className="mt-0.5 text-xs text-emerald-700">
                      ส่งสำเร็จครบ {closeTarget.serial_items.length}/{closeTarget.serial_items.length} SN
                    </div>
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
                      onClick={() =>
                        setSelectedSerialIds(
                          selectedSerialIds.length === selectableSerialItems.length ? [] : selectableSerialItems.map((item) => item.serial_id),
                        )
                      }
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
                            setSelectedSerialIds((current) =>
                              checked ? current.filter((value) => value !== serial.serial_id) : [...current, serial.serial_id],
                            )
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
                  <ImageUpload
                    label="รูปหลักฐานการส่ง"
                    required
                    values={proofImages}
                    onChange={setProofImages}
                    onRemove={(image, index) => removeBillMedia("proof", image, index)}
                    disabled={isClosedBill}
                    maxImages={8}
                    thumbnailSize="full"
                    layout="eight"
                  />
                  <div className="border-t border-slate-200 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSignatureMode("UPLOAD")}
                        disabled={isClosedBill}
                        className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "UPLOAD" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        อัปโหลดรูปลายเซ็น
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode("DRAW")}
                        disabled={isClosedBill || signatureImages.length >= 4}
                        className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${signatureMode === "DRAW" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        เซ็นบนหน้าจอ
                      </button>
                    </div>
                    {signatureMode === "UPLOAD" ? (
                      <ImageUpload
                        label="ลายเซ็นผู้รับ"
                        required
                        values={signatureImages}
                        onChange={setSignatureImages}
                        onRemove={(image, index) => removeBillMedia("signature", image, index)}
                        disabled={isClosedBill}
                        maxImages={4}
                        thumbnailSize="full"
                        layout="eight"
                      />
                    ) : !isClosedBill ? (
                      <SignaturePad onChange={setSignaturePadData} heightClass="h-48" />
                    ) : null}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  เวลาส่งสำเร็จ<span className="ml-1 text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-10 min-w-0 flex-1 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                    <CalendarClock size={16} className="mr-2 shrink-0 text-slate-400" />
                    <span className="truncate">{now.toLocaleString("th-TH", { hour12: false })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetCloseForm}
                    disabled={closeSaving}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloseConfirmationOpen(true)}
                    disabled={
                      closeSaving ||
                      isClosedBill ||
                      !proofImages.length ||
                      !(signatureImages.length || Boolean(signaturePadData)) ||
                      !selectedSerialIds.length
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FileSignature size={16} />
                    {closeSaving ? "กำลังปิด..." : isClosedBill ? "ปิดแล้ว" : "ปิดงาน"}
                  </button>
                </div>
              </div>
              {closeError ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{closeError}</p> : null}
            </div>
          </div>
        </section>
      )}

      {closeTarget && closeConfirmationOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-close-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-scaleIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>
            <h2 id="confirm-close-title" className="mt-4 text-center text-lg font-bold text-slate-800">
              ยืนยันปิดงาน?
            </h2>
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

