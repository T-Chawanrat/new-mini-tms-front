import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Megaphone,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ImageUpload, { type UploadedImage, type UploadedImages } from "../components/tms/form/ImageUpload";
import AxiosInstance from "../services/apiClient";
import { getUploadUrl } from "../services/uploadUrl";
import type { Announcement } from "../types/announcement";

const emptyForm = {
  title: "",
  content: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || fallback;
};

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<UploadedImages>([]);

  const filteredAnnouncements = useMemo(() => announcements, [announcements]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage("");
    void AxiosInstance.get<{ data?: Announcement[] }>("/announcements", {
      params: search.trim() ? { search: search.trim() } : undefined,
    })
      .then(({ data }) => {
        if (isCurrent) setAnnouncements(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(getErrorMessage(error, "ไม่สามารถโหลดประกาศได้"));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [search]);

  const releasePreviews = (previews: UploadedImages) => previews.forEach((preview) => {
    if (preview.preview.startsWith("blob:")) URL.revokeObjectURL(preview.preview);
  });

  const closeEditor = () => {
    releasePreviews(images);
    setImages([]);
    setEditingId(null);
    setForm(emptyForm);
    setIsEditorOpen(false);
  };

  const openCreate = () => {
    releasePreviews(images);
    setImages([]);
    setEditingId(null);
    setForm(emptyForm);
    setIsEditorOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    releasePreviews(images);
    setImages([]);
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
    });
    setImages(announcement.media.map((image) => ({ id: image.id, name: image.name, preview: image.preview })));
    setIsEditorOpen(true);
  };

  const removeImage = async (image: UploadedImage, index: number) => {
    if (editingId && image.id) {
      try {
        await AxiosInstance.delete(`/announcements/${editingId}/media/${image.id}`);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "ไม่สามารถลบรูปประกาศได้"));
        return;
      }
    }
    if (image.preview.startsWith("blob:")) URL.revokeObjectURL(image.preview);
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const saveAnnouncement = async () => {
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content || isSaving) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    images.forEach((image) => {
      if (image.file) formData.append("images", image.file);
    });

    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = editingId
        ? await AxiosInstance.put<{ data?: Announcement }>(`/announcements/${editingId}`, formData)
        : await AxiosInstance.post<{ data?: Announcement }>("/announcements", formData);
      const announcement = response.data?.data;
      if (!announcement) throw new Error("ไม่พบข้อมูลประกาศที่บันทึก");
      setAnnouncements((current) => editingId
        ? current.map((item) => item.id === announcement.id ? announcement : item)
        : [announcement, ...current]);
      closeEditor();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "ไม่สามารถบันทึกประกาศได้"));
    } finally {
      setIsSaving(false);
    }
  };

  const togglePinned = async (id: number) => {
    try {
      await AxiosInstance.patch(`/announcements/${id}/pin`);
      setAnnouncements((current) => current.map((item) => item.id === id ? { ...item, isPinned: !item.isPinned } : item));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "ไม่สามารถอัปเดตการปักหมุดได้"));
    }
  };

  const deleteAnnouncement = async (id: number) => {
    try {
      await AxiosInstance.delete(`/announcements/${id}`);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "ไม่สามารถลบประกาศได้"));
    }
  };

  return (
    <div className="space-y-6 px-5 sm:px-8 lg:px-10">
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-6 py-7 text-white shadow-lg shadow-blue-900/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Megaphone size={25} /></span>
            <div><h1 className="text-2xl font-bold">จัดการประกาศ</h1></div>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50">
            <Plus size={18} /> สร้างประกาศ
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-2xl font-bold text-slate-900">ประกาศล่าสุด</h2></div>
          <div>
            <label className="relative block w-full md:w-[480px]">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาประกาศ" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}</div> : null}
          {errorMessage && !isEditorOpen ? <p className="py-5 text-center text-sm text-rose-600">{errorMessage}</p> : null}
          {!isLoading && !errorMessage ? filteredAnnouncements.map((announcement) => (
            <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3><span className="inline-flex shrink-0 items-center gap-1 text-sm text-slate-500"><CalendarDays size={15} /> {announcement.createdDate}</span></div>
                <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => togglePinned(announcement.id)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition ${announcement.isPinned ? "bg-amber-300 text-amber-950" : "bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800"}`}>{announcement.isPinned ? <PinOff size={13} /> : <Pin size={13} />} {announcement.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุด"}</button><button type="button" onClick={() => openEdit(announcement)} className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700" aria-label="แก้ไขประกาศ"><Pencil size={17} /></button><button type="button" onClick={() => deleteAnnouncement(announcement.id)} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" aria-label="ลบประกาศ"><Trash2 size={17} /></button></div>
              </div>
              {announcement.imageUrls.length ? <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">{announcement.imageUrls.map((url) => { const imageUrl = getUploadUrl(url); return <a key={url} href={imageUrl} target="_blank" rel="noreferrer" className="shrink-0 snap-start"><img src={imageUrl} alt={`รูปประกอบ ${announcement.title}`} className="h-64 w-auto max-w-full rounded-xl bg-slate-50 object-contain transition hover:opacity-90" /></a>; })}</div> : null}
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{announcement.content}</p>
            </article>
          )) : null}
          {!isLoading && !errorMessage && !filteredAnnouncements.length ? <p className="py-6 text-center text-sm text-slate-500">ไม่พบประกาศที่ค้นหา</p> : null}
        </div>
      </section>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div><h2 className="font-bold text-slate-900">{editingId ? "แก้ไขประกาศ" : "สร้างประกาศ"}</h2></div>
              <button type="button" onClick={closeEditor} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด"><X size={20} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block md:col-span-2"><span className="text-sm font-semibold text-slate-700">หัวข้อประกาศ <em className="not-italic text-rose-500">*</em></span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="เช่น แจ้งปรับเวลารับสินค้า" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
                <label className="block md:col-span-2"><span className="text-sm font-semibold text-slate-700">รายละเอียดประกาศ <em className="not-italic text-rose-500">*</em></span><textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={4} placeholder="พิมพ์รายละเอียดประกาศ" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
              </div>

              <ImageUpload label="รูปประกอบประกาศ" values={images} onChange={setImages} onRemove={removeImage} maxImages={4} layout="fill" thumbnailSize="full" />

            </div>
            {errorMessage ? <p className="px-6 pb-3 text-sm text-rose-600">{errorMessage}</p> : null}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={closeEditor} disabled={isSaving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed">ยกเลิก</button><button type="button" onClick={() => void saveAnnouncement()} disabled={!form.title.trim() || !form.content.trim() || isSaving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isSaving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "สร้างประกาศ"}</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

