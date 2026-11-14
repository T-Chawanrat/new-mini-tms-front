import { useState } from "react";
import { Bug, CircleAlert, ImagePlus, Paperclip, Send, X } from "lucide-react";

type Attachment = { name: string; size: number; preview: string };

const categoryOptions = [
  { value: "FUNCTION", label: "การทำงานผิดปกติ" },
  { value: "DATA", label: "ข้อมูลไม่ถูกต้อง" },
  { value: "SLOW", label: "ระบบช้า / ค้าง" },
  { value: "DISPLAY", label: "หน้าจอแสดงผลผิดปกติ" },
  { value: "OTHER", label: "อื่น ๆ" },
];

const severityOptions = [
  { value: "LOW", label: "ต่ำ" },
  { value: "MEDIUM", label: "ปานกลาง" },
  { value: "HIGH", label: "สูง" },
  { value: "CRITICAL", label: "เร่งด่วน" },
];

const formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(size >= 1024 * 1024 ? 1 : 2)} MB`;

export default function ProgramIssueReport() {
  const [category, setCategory] = useState("FUNCTION");
  const [severity, setSeverity] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notice, setNotice] = useState("");

  const addAttachments = (files: FileList | null) => {
    const nextFiles = Array.from(files || []).slice(0, Math.max(0, 3 - attachments.length));
    setAttachments((current) => [
      ...current,
      ...nextFiles.map((file) => ({ name: file.name, size: file.size, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => {
      URL.revokeObjectURL(current[index]?.preview || "");
      return current.filter((_, attachmentIndex) => attachmentIndex !== index);
    });
  };

  const submitPreview = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("หน้าแจ้งปัญหาพร้อมแล้ว — รอเชื่อม API เพื่อบันทึกรายการเข้าสู่ระบบ");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-1 py-2 font-thai text-slate-800">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-5 text-white shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Bug size={24} /></span>
            <div>
              <h1 className="text-xl font-bold">แจ้งปัญหาโปรแกรม</h1>
              <p className="mt-1 text-sm text-blue-100">บอกรายละเอียดให้ครบ เพื่อให้ทีมตรวจสอบและแก้ไขได้รวดเร็วขึ้น</p>
            </div>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">เวอร์ชัน v2.0.2</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={submitPreview} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <CircleAlert size={19} className="text-amber-500" />
            <div>
              <h2 className="font-semibold text-slate-800">รายละเอียดปัญหา</h2>
              <p className="text-xs text-slate-500">ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">ประเภทปัญหา <span className="text-rose-500">*</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">ระดับความเร่งด่วน <span className="text-rose-500">*</span>
              <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {severityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">หัวข้อปัญหา <span className="text-rose-500">*</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={180} placeholder="เช่น บันทึกใบรับแล้วระบบแสดงข้อผิดพลาด" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">อธิบายอาการ <span className="text-rose-500">*</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={5} maxLength={3000} placeholder="เกิดอะไรขึ้น, หน้าจอใด, และข้อมูลที่เกี่ยวข้องคืออะไร" className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">ขั้นตอนที่ทำก่อนพบปัญหา
            <textarea value={steps} onChange={(event) => setSteps(event.target.value)} rows={3} maxLength={2000} placeholder="1. เข้าเมนู...&#10;2. กดปุ่ม...&#10;3. พบปัญหา..." className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>

          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">รูปประกอบ <span className="font-normal text-slate-400">(ไม่เกิน 3 รูป)</span></p>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
              <ImagePlus size={18} /> เลือกรูปภาพประกอบ
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => addAttachments(event.target.files)} />
            </label>
            {!!attachments.length && <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {attachments.map((attachment, index) => (
                <div key={attachment.preview} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5">
                  <img src={attachment.preview} alt={attachment.name} className="h-20 w-full rounded object-cover" />
                  <p className="mt-1 truncate text-[11px] text-slate-500" title={attachment.name}>{attachment.name} · {formatFileSize(attachment.size)}</p>
                  <button type="button" onClick={() => removeAttachment(index)} className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white hover:bg-rose-600" aria-label={`ลบ ${attachment.name}`}><X size={13} /></button>
                </div>
              ))}
            </div>}
          </div>

          {notice && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{notice}</p>}
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"><Send size={16} /> ส่งรายงานปัญหา</button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800"><Paperclip size={18} className="text-blue-600" /><h2 className="font-semibold">ก่อนส่งปัญหา</h2></div>
            <ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600">
              <li>ระบุเมนูหรือหน้าจอที่พบปัญหา</li>
              <li>แนบภาพหน้าจอที่เห็น error ถ้ามี</li>
              <li>ไม่ต้องแนบรหัสผ่านหรือข้อมูลบัตรประชาชน</li>
              <li>แจ้งขั้นตอนที่ทำซ้ำแล้วพบปัญหา</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">สถานะหน้าปัจจุบัน</p>
            <p className="mt-2 text-sm font-medium text-slate-700">Frontend prototype</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">เมื่อมี DB และ API ปุ่มส่งรายงานจะบันทึกข้อมูล พร้อมแนบรูปเข้าสู่ระบบ</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
