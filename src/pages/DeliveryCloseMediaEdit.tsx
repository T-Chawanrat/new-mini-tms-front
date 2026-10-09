import { useState } from "react";
import { CheckCircle2, LoaderCircle, Search } from "lucide-react";
import ImageUpload, { type UploadedImage, type UploadedImages } from "../components/tms/form/ImageUpload";
import SignaturePad from "../components/tms/form/SignaturePad";
import AxiosInstance from "../services/apiClient";
import { getUploadUrl } from "../services/uploadUrl";

type LookupType = "receive_code" | "serial_no" | "reference_no";
type CompletedBill = {
  receive_code: string;
  reference_no?: string | null;
  serial_count: number;
  proof_images: UploadedImages;
  signature_images: UploadedImages;
};

const previewToFile = async (image: { name: string; preview: string }) => {
  const response = await fetch(getUploadUrl(image.preview));
  const blob = await response.blob();
  return new File([blob], image.name, { type: blob.type || "image/jpeg" });
};

export default function DeliveryCloseMediaEdit() {
  const [lookup, setLookup] = useState("");
  const [lookupType, setLookupType] = useState<LookupType>("receive_code");
  const [target, setTarget] = useState<CompletedBill | null>(null);
  const [proofImages, setProofImages] = useState<UploadedImages>([]);
  const [signatureImages, setSignatureImages] = useState<UploadedImages>([]);
  const [signatureMode, setSignatureMode] = useState<"UPLOAD" | "DRAW">("UPLOAD");
  const [signaturePadData, setSignaturePadData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const resetTarget = () => {
    setTarget(null);
    setProofImages([]);
    setSignatureImages([]);
    setSignaturePadData(null);
    setSignatureMode("UPLOAD");
  };

  const search = async () => {
    if (!lookup.trim()) return;
    try {
      setLoading(true);
      setMessage("");
      resetTarget();
      const response = await AxiosInstance.get<{ data?: CompletedBill[] }>("/delivery-close-media/search", {
        params: { search: lookup.trim(), search_type: lookupType },
      });
      const results = response.data.data || [];
      const exact = results.filter((item) =>
        lookupType === "receive_code" ? item.receive_code.toLowerCase() === lookup.trim().toLowerCase() : true,
      );
      const matches = exact.length ? exact : results;
      if (!matches.length) {
        setMessage("ไม่พบบิลที่ปิดงานครบแล้ว");
        return;
      }
      if (matches.length > 1) {
        setMessage("พบมากกว่าหนึ่งบิล กรุณาค้นหาด้วย Receive Code");
        return;
      }
      const bill = matches[0];
      setTarget(bill);
      setProofImages(bill.proof_images || []);
      setSignatureImages(bill.signature_images || []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "ไม่สามารถค้นหารายการได้");
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = async (type: "proof" | "signature", image: UploadedImage, index: number) => {
    const setImages = type === "proof" ? setProofImages : setSignatureImages;
    if (!image.id) {
      setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
      return;
    }
    if (!target) return;
    try {
      setMessage("");
      await AxiosInstance.delete(`/delivery-close-media/${image.id}`, { data: { receive_code: target.receive_code } });
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "ไม่สามารถลบรูปได้");
    }
  };

  const saveMedia = async () => {
    if (!target) return;
    const newProof = proofImages.filter((image) => !image.id);
    const newSignatures = signatureImages.filter((image) => !image.id);
    if (!newProof.length && !newSignatures.length && !signaturePadData) return;
    try {
      setSaving(true);
      setMessage("");
      const form = new FormData();
      form.append("receive_code", target.receive_code);
      for (const image of newProof) form.append("proof_images", await previewToFile(image));
      for (const image of newSignatures) form.append("sign_images", await previewToFile(image));
      if (signaturePadData) form.append("sign_images", await previewToFile({ name: "signature-pad.png", preview: signaturePadData }));
      const response = await AxiosInstance.post<{ data?: Pick<CompletedBill, "proof_images" | "signature_images"> }>("/delivery-close-media", form);
      const proof = response.data.data?.proof_images || [];
      const signatures = response.data.data?.signature_images || [];
      setProofImages(proof);
      setSignatureImages(signatures);
      setSignaturePadData(null);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "ไม่สามารถบันทึกรูปได้");
    } finally {
      setSaving(false);
    }
  };

  const hasNewMedia = proofImages.some((image) => !image.id) || signatureImages.some((image) => !image.id) || Boolean(signaturePadData);

  return (
    <main
      className={
        target
          ? "min-h-[calc(100vh-61px)] w-full bg-slate-50 font-thai text-slate-800"
          : "flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 font-thai text-slate-800"
      }
    >
      {!target ? (
        <section className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[15vh]">
          <form
            className="w-full max-w-3xl"
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <label className="mb-4 block text-center text-xl font-bold text-slate-700 sm:text-2xl">ค้นหาเพื่อแก้ไขรูปปิดงาน</label>
            <fieldset className="mb-3 flex flex-wrap justify-center gap-2" aria-label="ชนิดข้อมูลที่ต้องการค้นหา">
              {[
                { value: "receive_code", label: "Receive Code" },
                { value: "serial_no", label: "Serial No." },
                { value: "reference_no", label: "Reference" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${lookupType === option.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600"}`}
                >
                  <input
                    type="radio"
                    name="delivery-close-media-search"
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
                id="delivery-close-media-lookup"
                name="delivery-close-media-lookup"
                autoComplete="on"
                autoFocus
                value={lookup}
                onChange={(event) => {
                  setLookup(event.target.value);
                  if (message) setMessage("");
                }}
                placeholder={
                  lookupType === "receive_code"
                    ? "สแกนหรือกรอก Receive Code แล้วกด Enter"
                    : lookupType === "reference_no"
                      ? "สแกนหรือกรอก Reference แล้วกด Enter"
                      : "สแกนหรือกรอก Serial No. แล้วกด Enter"
                }
                className="h-20 w-full rounded-xl border-2 border-slate-300 bg-white pl-14 pr-36 text-lg font-medium shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={!lookup.trim() || loading}
                className="absolute right-3 top-1/2 inline-flex h-12 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                <Search size={20} /> ค้นหา
              </button>
            </div>
            {message ? <p className="mt-5 text-center text-sm font-medium text-rose-600">{message}</p> : null}
          </form>
        </section>
      ) : (
        <section className="w-full px-3 py-3 lg:px-4 lg:py-4">
          <header className="mb-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">แก้ไขรูปปิดงาน</h1>
                <p className="mt-1 text-sm text-slate-500">จัดการรูปหลักฐานและลายเซ็นของบิลที่ปิดงานแล้ว</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetTarget}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ค้นหาใหม่
                </button>
                <button
                  type="button"
                  onClick={() => void saveMedia()}
                  disabled={saving || !hasNewMedia}
                  className="inline-flex h-10 w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? <LoaderCircle size={18} className="animate-spin" /> : null}
                  {saving ? "กำลังบันทึก..." : "บันทึกรูป"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-400">RECEIVE CODE</p>
                <p className="mt-0.5 text-sm font-bold text-blue-700">{target.receive_code}</p>
              </div>
              {target.reference_no ? (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-400">REFERENCE</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">{target.reference_no}</p>
                </div>
              ) : null}
              <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                <CheckCircle2 size={18} />
                <div>
                  <p className="text-sm font-bold">ปิดงานจัดส่งครบแล้ว</p>
                  <p className="text-xs">
                    {target.serial_count}/{target.serial_count} SN
                  </p>
                </div>
              </div>
            </div>
          </header>
          <div className="grid items-stretch gap-3 xl:grid-cols-2">
            <article className="min-h-[270px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ImageUpload
                label="รูปหลักฐาน"
                values={proofImages}
                onChange={setProofImages}
                onRemove={(image, index) => removeMedia("proof", image, index)}
                disabled={saving}
                maxImages={8}
                thumbnailSize="wide"
                gridClassName="mt-5"
                relaxedRowGap
              />
            </article>
            <article className="flex min-h-[270px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-700">รูปลายเซ็น</div>
                  <div className="mt-1 text-xs text-slate-400">อัปโหลดได้สูงสุด 4 รูป ({signatureImages.length}/4)</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("UPLOAD")}
                    disabled={saving}
                    className={`h-10 w-[120px] rounded-lg text-sm font-semibold ${signatureMode === "UPLOAD" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600"}`}
                  >
                    อัปโหลด
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("DRAW")}
                    disabled={saving || signatureImages.length >= 4}
                    className={`h-10 w-[120px] rounded-lg text-sm font-semibold ${signatureMode === "DRAW" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-600"}`}
                  >
                    เซ็นเอง
                  </button>
                </div>
              </div>
              {signatureMode === "UPLOAD" ? (
                <ImageUpload
                  label="รูปลายเซ็น"
                  values={signatureImages}
                  onChange={setSignatureImages}
                  onRemove={(image, index) => removeMedia("signature", image, index)}
                  disabled={saving}
                  maxImages={4}
                  thumbnailSize="wide"
                  showLabel={false}
                  showCounter={false}
                  gridClassName="mt-5"
                />
              ) : (
                <div className="mt-2 flex min-h-0 flex-1">
                  <SignaturePad onChange={setSignaturePadData} showHint={false} showLabel={false} fillAvailableHeight />
                </div>
              )}
            </article>
          </div>
          {message ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}
        </section>
      )}
    </main>
  );
}
