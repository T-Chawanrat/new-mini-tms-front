import { Camera, X } from "lucide-react";

import { getUploadUrl } from "../../../services/uploadUrl";

export type UploadedImage = { id?: number; name: string; preview: string; file?: File };
export type UploadedImages = UploadedImage[];

type ImageUploadProps = {
  label: string;
  required?: boolean;
  values: UploadedImages;
  onChange: (value: UploadedImages) => void;
  onRemove?: (image: UploadedImage, index: number) => void | Promise<void>;
  disabled?: boolean;
  allowAdd?: boolean;
  maxImages?: number;
  thumbnailSize?: "normal" | "large" | "wide" | "full";
  layout?: "four" | "eight" | "fill";
  showLabel?: boolean;
  showCounter?: boolean;
  gridClassName?: string;
  relaxedRowGap?: boolean;
};

export default function ImageUpload({
  label,
  required,
  values,
  onChange,
  onRemove,
  disabled = false,
  allowAdd = true,
  maxImages = 8,
  thumbnailSize = "normal",
  layout = "four",
  showLabel = true,
  showCounter = true,
  gridClassName = "",
  relaxedRowGap = false,
}: ImageUploadProps) {
  const selectFiles = (files: FileList | null) => {
    if (!files || disabled) return;
    const remaining = maxImages - values.length;
    if (remaining <= 0) return;
    const selected = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({ name: file.name, preview: URL.createObjectURL(file), file }));
    onChange([...values, ...selected]);
  };

  return (
    <div>
      {showLabel ? (
        <div className="mb-1.5 text-sm font-semibold text-slate-700">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </div>
      ) : null}
      {showCounter ? (
        <div className="mb-2 text-xs text-slate-400">
          อัปโหลดได้สูงสุด {maxImages} รูป ({values.length}/{maxImages})
        </div>
      ) : null}
      <div
        className={`grid w-full ${layout === "fill" ? "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]" : layout === "eight" ? "grid-cols-8" : "grid-cols-4"} gap-x-3 ${relaxedRowGap ? "gap-y-6" : "gap-y-3"} ${thumbnailSize === "full" ? "max-w-none" : thumbnailSize === "wide" ? "max-w-[580px]" : thumbnailSize === "large" ? "max-w-[440px]" : "max-w-[400px]"} ${gridClassName}`}
      >
        {values.map((image, index) => (
          <div
            key={`${image.preview}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
          >
            <img src={getUploadUrl(image.preview)} alt={`${label} ${index + 1}`} className="h-full w-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 truncate bg-slate-950/60 px-2 py-1 text-[10px] text-white">{image.name}</div>
            {!disabled ? (
              <button
                type="button"
                onClick={() => (onRemove ? void onRemove(image, index) : onChange(values.filter((_, imageIndex) => imageIndex !== index)))}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-100 hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`ลบรูป ${index + 1}`}
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        ))}
        {!disabled && allowAdd && values.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
            <Camera size={22} className="mb-1.5 text-blue-500" />
            <span className="text-xs font-semibold text-slate-600">เพิ่มรูป</span>
            <span className="mt-0.5 text-[10px] text-slate-400">เลือกหลายรูปได้</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => selectFiles(event.target.files)} />
          </label>
        )}
      </div>
    </div>
  );
}
