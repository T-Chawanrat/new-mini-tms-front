import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, MessageCircle, Search, Send, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { getUploadUrl } from "../utils/uploadUrl";

type IssueStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";
type Thread = { receive_code: string; issue_type: string; issue_status: IssueStatus; driver_name?: string; updated_at: string; last_message: string; unread_count: number };
type Message = {
  delivery_status_message_id: number;
  sender_user_id: number;
  sender_name: string;
  message_text?: string;
  created_date: string;
  media: { file_name: string; file_path: string }[];
};
const time = (value?: string) =>
  value ? new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "";

export default function DeliveryIssueInbox() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedCode = searchParams.get("bill_no")?.trim() || "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState("-");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadThreads = async () => {
    const response = await AxiosInstance.get<{ data?: Thread[] }>("/delivery-issues");
    const data = response.data.data || [];
    setThreads(data);
    setSelectedCode((current) => current || data[0]?.receive_code || "");
  };
  const loadMessages = async (receiveCode: string) => {
    if (!receiveCode) return;
    try {
      setLoading(true);
      setError("");
      const response = await AxiosInstance.get<{ data?: { thread: { recipient_name: string }; messages: Message[] } }>(
        `/delivery-issues/${encodeURIComponent(receiveCode)}/messages`,
      );
      const data = response.data.data;
      setMessages(data?.messages || []);
      setRecipient(data?.thread.recipient_name || "-");
      setThreads((current) => current.map((thread) => (thread.receive_code === receiveCode ? { ...thread, unread_count: 0 } : thread)));
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } catch (requestError: any) {
      setMessages([]);
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดข้อความได้");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadThreads().catch(() => setError("ไม่สามารถโหลดรายการแจ้งปัญหาได้"));
  }, []);
  useEffect(() => {
    if (selectedCode) void loadMessages(selectedCode);
  }, [selectedCode]);
  useEffect(() => {
    if (requestedCode && threads.some((thread) => thread.receive_code === requestedCode)) setSelectedCode(requestedCode);
  }, [requestedCode, threads]);

  const updateStatus = async (issueStatus: IssueStatus) => {
    if (!selectedCode) return;
    try {
      await AxiosInstance.patch(`/delivery-issues/${encodeURIComponent(selectedCode)}/status`, { issue_status: issueStatus });
      setThreads((current) => current.map((thread) => thread.receive_code === selectedCode ? { ...thread, issue_status: issueStatus } : thread));
    } catch (requestError: any) { setError(requestError?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้"); }
  };
  const send = async () => {
    if (!selectedCode || (!draft.trim() && !file) || sending) return;
    try {
      setSending(true); setError("");
      const form = new FormData(); if (draft.trim()) form.append("message_text", draft.trim()); if (file) form.append("images", file);
      await AxiosInstance.post(`/delivery-issues/${encodeURIComponent(selectedCode)}/messages`, form);
      setDraft(""); if (preview) URL.revokeObjectURL(preview); setPreview(""); setFile(null);
      await Promise.all([loadMessages(selectedCode), loadThreads()]);
    } catch (requestError: any) { setError(requestError?.response?.data?.message || "ไม่สามารถส่งข้อความได้"); }
    finally { setSending(false); }
  };
  const selected = threads.find((thread) => thread.receive_code === selectedCode);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const statusMatched = threads.filter((thread) => statusFilter === "ALL" || thread.issue_status === statusFilter);
    return term ? statusMatched.filter((thread) => [thread.receive_code, thread.last_message, thread.issue_type].some((value) => value.toLowerCase().includes(term))) : statusMatched;
  }, [query, statusFilter, threads]);
  const unreadCount = threads.filter((thread) => thread.unread_count > 0).length;
  const currentUserId = Number(user?.id ?? user?.user_id);

  return (
    <main className="h-[calc(100vh-61px)] overflow-hidden bg-slate-50 font-thai">
      <div className="grid h-full min-h-0 overflow-hidden border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-2 font-bold text-slate-700">
              <span className="inline-flex items-center gap-2"><MessageCircle size={19} className="text-blue-600" /> รายการแจ้งปัญหา</span>
              {unreadCount ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{unreadCount} ใหม่</span> : null}
            </div>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหา Receive Code หรือข้อความ"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusFilter === status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{status === "ALL" ? "ทั้งหมด" : status === "NEW" ? "ใหม่" : status === "IN_PROGRESS" ? "กำลังดำเนินการ" : "แก้ไขแล้ว"}</button>)}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2 lg:max-h-[610px]">
            {!filtered.length ? (
              <p className="p-3 text-sm text-slate-400">ยังไม่มีรายการแจ้งปัญหา</p>
            ) : (
              filtered.map((thread) => (
                <button
                  key={thread.receive_code}
                  type="button"
                  onClick={() => setSelectedCode(thread.receive_code)}
                  className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${thread.receive_code === selectedCode ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${thread.unread_count ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}
                    >
                      <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-blue-700">{thread.receive_code}</span>
                        <span className="shrink-0 text-xs text-slate-400">{time(thread.updated_at)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-bold text-slate-700">{thread.issue_type || "แจ้งปัญหาการจัดส่ง"}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">{thread.last_message || "ยังไม่มีข้อความ"}</div>
                    </div>
                    {thread.unread_count ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" /> : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
        <section className="flex min-w-0 flex-col bg-slate-50">
          {selectedCode ? (
            <>
              <div className="border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-800">{selected?.issue_type || "แจ้งปัญหาการจัดส่ง"}</h2>
                      {selected?.unread_count ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">ใหม่</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">อ่านแล้ว</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="font-bold text-blue-700">Receive Code: {selectedCode}</span>
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={14} /> ผู้รับ: {recipient}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">{(["NEW", "IN_PROGRESS", "RESOLVED"] as const).map((status) => <button key={status} type="button" onClick={() => void updateStatus(status)} className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold ${selected?.issue_status === status ? status === "NEW" ? "bg-rose-100 text-rose-700" : status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700" : "border border-slate-200 bg-white text-slate-500"}`}>{status === "RESOLVED" ? <CheckCircle2 size={15} /> : null}{status === "NEW" ? "ใหม่" : status === "IN_PROGRESS" ? "กำลังดำเนินการ" : "แก้ไขแล้ว"}</button>)}</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
                {loading ? <p className="text-center text-sm text-slate-400">กำลังโหลด...</p> : null}
                {!loading && !messages.length ? <p className="text-center text-sm text-slate-400">ยังไม่มีข้อความ</p> : null}
                {messages.map((message) => {
                  const mine = message.sender_user_id === currentUserId;
                  return (
                    <div key={message.delivery_status_message_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`w-fit max-w-[85%] lg:max-w-[68%] ${mine ? "ml-auto" : ""}`}>
                        <div className={`mb-1 text-xs font-semibold text-slate-500 ${mine ? "text-right" : ""}`}>
                          {message.sender_name} · {time(message.created_date)}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm ${mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}
                        >
                          {message.message_text ? <p className="whitespace-pre-wrap break-words">{message.message_text}</p> : null}
                          {message.media.map((media) => (
                            <img
                              key={media.file_path}
                              src={getUploadUrl(media.file_path)}
                              alt={media.file_name}
                              className="mt-2 max-h-72 w-full rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-3 lg:p-4">{preview ? <div className="mb-2 flex items-center gap-2"><img src={preview} alt={file?.name || "รูปแนบ"} className="h-12 w-12 rounded-lg object-cover" /><button type="button" onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(""); setFile(null); }} className="text-xs font-semibold text-rose-600">เอาออก</button></div> : null}<div className="flex items-end gap-2"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const selectedFile = event.target.files?.[0]; if (!selectedFile) return; if (preview) URL.revokeObjectURL(preview); setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile)); }} /><button type="button" onClick={() => fileRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="แนบรูป"><ImagePlus size={20} /></button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder="พิมพ์ข้อความถึงคนขับ..." className="min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><button type="button" onClick={() => void send()} disabled={sending || (!draft.trim() && !file)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="ส่งข้อความ"><Send size={18} /></button></div></div>
              {error ? <p className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            </>
          ) : (
            <>
              <div className="grid flex-1 place-items-center p-6 text-center text-slate-400">
                <div>
                  <MessageCircle size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">เลือกบิลจากรายการแจ้งปัญหา</p>
                </div>
              </div>
              <div className="border-t border-slate-200 bg-white p-3 lg:p-4">
                <div className="flex items-end gap-2">
                  <button type="button" disabled className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300" aria-label="แนบรูป"><ImagePlus size={20} /></button>
                  <textarea disabled rows={1} placeholder="เลือกเคสก่อนพิมพ์ข้อความ..." className="min-h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 outline-none" />
                  <button type="button" disabled className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-white" aria-label="ส่งข้อความ"><Send size={18} /></button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
