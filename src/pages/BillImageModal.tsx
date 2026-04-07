import React from "react";
import { downloadImage } from "../utils/DownloadImage";

// const BASE_URL = "https://xsendwork.com";

type BillModalInfo = {
  name: string | null;
  surname: string | null;
  license_plate: string | null;
  remark: string | null;
};

type BillImageModalProps = {
  open: boolean;
  serialNo: string | null;
  reference: string | null;
  signUrl: string | null;
  images: string[];
  billId: number | null;
  billInfo: BillModalInfo;
  isEditingImages: boolean;
  imagesToDelete: string[];
  newImages: File[];
  savingImages: boolean;
  imageEditError: string | null;

  onClose: () => void;
  onToggleEdit: () => void;
  onToggleDelete: (url: string) => void;
  onNewImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewImage: (index: number) => void;
  onSave: () => void;

  setImagesToDelete: React.Dispatch<React.SetStateAction<string[]>>;
  setNewImages: React.Dispatch<React.SetStateAction<File[]>>;
  setImageEditError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsEditingImages: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function BillImageModal({
  open,
  serialNo,
  reference,
  signUrl,
  images,
  billId,
  billInfo,
  isEditingImages,
  imagesToDelete,
  newImages,
  savingImages,
  imageEditError,
  onClose,
  onToggleEdit,
  onToggleDelete,
  onNewImagesChange,
  onRemoveNewImage,
  onSave,
  setImagesToDelete,
  setNewImages,
  setImageEditError,
  setIsEditingImages,
}: BillImageModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-2"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 rounded-t-xl">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex flex-wrap gap-6 items-center">
              <span className="font-semibold text-slate-800">
                SN: <span className="font-mono">{serialNo || "-"}</span>
              </span>
              <span className="font-semibold text-slate-800">
                REF: <span className="font-mono">{reference || "-"}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-slate-700 mt-1">
              <span>
                คนขับ:{" "}
                {billInfo.name || billInfo.surname
                  ? `${billInfo.name || ""} ${billInfo.surname || ""}`
                  : "-"}
              </span>
              <span>ทะเบียนรถ: {billInfo.license_plate || "-"}</span>
              <span className="truncate max-w-[260px]">
                หมายเหตุ: {billInfo.remark || "-"}
              </span>
            </div>
          </div>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-400 transition"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-2 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`px-3 py-1 rounded-full border font-medium transition ${
                isEditingImages
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={onToggleEdit}
            >
              {isEditingImages ? "ปิดโหมดแก้ไขรูป" : "แก้ไขรูปภาพ"}
            </button>

            {isEditingImages && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span>
                  ✓ คลิกรูปเพื่อเลือก/ยกเลิกเลือกลบ{" "}
                  {imagesToDelete.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 px-2 py-[1px] ml-1 border border-red-200">
                      ลบ {imagesToDelete.length} รูป
                    </span>
                  )}
                </span>

                {newImages.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-[1px] border border-blue-200">
                    รูปใหม่ {newImages.length} รูป
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (billId) {
                downloadImage(billId);
              }
            }}
            disabled={!billId}
            className={`px-3 py-1 rounded-full font-medium transition ${
              billId
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            Download
          </button>
        </div>

        {/* Error */}
        {imageEditError && (
          <div className="mx-5 mt-2 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {imageEditError}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-4 bg-white">
          {/* Signature */}
          {signUrl && (
            <div>
              <div className="font-semibold text-slate-700 mb-2">ลายเซ็น</div>
              <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <img
                  src={signUrl}
                  className="w-40 h-auto rounded border bg-white cursor-pointer"
                  onClick={() => window.open(signUrl, "_blank")}
                  alt="signature"
                />
                <span className="text-[11px] text-slate-500">
                  คลิกเพื่อเปิดภาพลายเซ็นในแท็บใหม่
                </span>
              </div>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-700">
                  รูปถ่าย ({images.length} รูป)
                </div>

                {isEditingImages && (
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = imagesToDelete.length === images.length;
                      setImagesToDelete(allSelected ? [] : images);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-medium transition ${
                      imagesToDelete.length === images.length
                        ? "bg-red-50 text-red-600 border-red-300"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-[13px] leading-none">
                      {imagesToDelete.length === images.length ? "✗" : "✓"}
                    </span>
                    <span>
                      {imagesToDelete.length === images.length
                        ? "ยกเลิกการเลือก"
                        : "เลือกทุกรูป"}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((url, i) => {
                  const marked = imagesToDelete.includes(url);

                  return (
                    <div
                      key={i}
                      className={`relative rounded-lg border overflow-hidden shadow-sm transition ${
                        marked
                          ? "bg-red-300 border-red-600"
                          : "bg-slate-50 hover:shadow-md"
                      }`}
                    >
                      <img
                        src={url}
                        className="w-full h-32 object-cover cursor-pointer"
                        onClick={() =>
                          isEditingImages
                            ? onToggleDelete(url)
                            : window.open(url, "_blank")
                        }
                        alt=""
                      />

                      {marked && (
                        <div className="absolute inset-0 bg-red-500/70 pointer-events-none" />
                      )}

                      {isEditingImages && (
                        <div className="absolute top-1 left-1 rounded-full px-2 py-[1px] text-[10px] font-semibold bg-black/60 text-white">
                          {marked ? "✗" : "✓"}
                        </div>
                      )}

                      <div className="absolute bottom-1 right-1 rounded-full px-2 py-[1px] text-[10px] bg-white/80 text-slate-700 border border-slate-200">
                        รูปที่ {i + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new images */}
          {isEditingImages && (
            <div className="pt-2 border-t border-dashed border-slate-200 mt-2">
              <div className="font-semibold text-slate-700 mb-1">เพิ่มรูปใหม่</div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100">
                  <span className="text-blue-700 font-medium">เลือกไฟล์</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onNewImagesChange}
                    className="hidden"
                  />
                </label>

                <span className="text-[11px] text-slate-500">
                  รองรับไฟล์ภาพหลายไฟล์ในครั้งเดียว (รวมทั้งหมดไม่เกิน 8 รูป)
                </span>
              </div>

              {newImages.length > 0 && (
                <>
                  <div className="mt-1 text-[11px] text-slate-600">
                    เลือกแล้ว {newImages.length} ไฟล์
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newImages.map((file, idx) => {
                      const previewUrl = URL.createObjectURL(file);

                      return (
                        <div
                          key={idx}
                          className="relative rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-1 flex flex-col items-center gap-1"
                        >
                          <img
                            src={previewUrl}
                            className="w-full h-24 object-cover rounded-md bg-white border"
                            alt={file.name}
                          />

                          <div className="text-[10px] text-slate-700 text-center px-1 truncate w-full">
                            {file.name}
                          </div>

                          <div className="absolute top-1 left-1 rounded-full bg-blue-600 text-white text-[10px] px-2 py-[1px]">
                            ใหม่
                          </div>

                          <button
                            type="button"
                            className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] shadow hover:bg-red-600"
                            onClick={() => onRemoveNewImage(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditingImages ? (
          <div className="px-5 py-3 border-t bg-slate-50 rounded-b-xl flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
              onClick={() => {
                setIsEditingImages(false);
                setImagesToDelete([]);
                setNewImages([]);
                setImageEditError(null);
              }}
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={savingImages}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                savingImages
                  ? "bg-blue-300 text-white cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {savingImages ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        ) : (
          <div className="px-5 py-2 border-t bg-slate-50 rounded-b-xl text-[11px] text-slate-500 text-right">
            คลิกที่ SERIAL_NO ในตารางหลักเพื่อเปิดหน้าต่างนี้อีกครั้ง
          </div>
        )}
      </div>
    </div>
  );
}