import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, ImagePlus, MessageCircle, Search, Send, UserRound, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../services/apiClient";
import { getUploadUrl } from "../services/uploadUrl";
import { connectSocket } from "../services/socket";

type IssueStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";
type Thread = {
  delivery_issue_id: number;
  receive_code: string;
  issue_type: string;
  issue_status: IssueStatus;
  driver_name?: string;
  updated_at: string;
  last_message: string;
  unread_count: number;
};
type Message = {
  delivery_status_message_id: number;
  sender_user_id: number;
  sender_name: string;
  role_name?: string | null;
  message_text?: string;
  created_date: string;
  media: { file_name: string; file_path: string; thumbnail_path?: string | null }[];
};
type PendingImage = { file: File; preview: string };
const time = (value?: string) =>
  value ? new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "";

export default function DeliveryIssueInbox() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedCode = searchParams.get("bill_no")?.trim() || "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState("-");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<PendingImage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = threads.find((thread) => thread.delivery_issue_id === selectedIssueId);

  const loadThreads = async () => {
    const response = await AxiosInstance.get<{ data?: Thread[] }>("/delivery-issues");
    const data = response.data.data || [];
    setThreads(data);
  };
  const loadMessages = async (deliveryIssueId: number) => {
    if (!Number.isInteger(deliveryIssueId) || deliveryIssueId <= 0) return;
    try {
      setLoading(true);
      setError("");
      const response = await AxiosInstance.get<{ data?: { thread: { recipient_name: string }; messages: Message[] } }>(
        `/delivery-issues/${deliveryIssueId}/messages`,
      );
      const data = response.data.data;
      setMessages(data?.messages || []);
      setRecipient(data?.thread.recipient_name || "-");
      setThreads((current) => current.map((thread) => (thread.delivery_issue_id === deliveryIssueId ? { ...thread, unread_count: 0 } : thread)));
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
    if (selectedIssueId) void loadMessages(selectedIssueId);
  }, [selectedIssueId]);
  useEffect(() => {
    if (requestedCode) {
      const requested = threads.find((thread) => thread.receive_code === requestedCode);
      if (requested) setSelectedIssueId(requested.delivery_issue_id);
    }
  }, [requestedCode, threads]);
  useEffect(() => {
    const socket = connectSocket();
    const refreshInbox = () => void loadThreads().catch(() => undefined);
    const joinInbox = () => {
      socket.emit("delivery-issues:inbox:join");
    };
    const refreshThread = (event: { issueId?: number }) => {
      refreshInbox();
      if (Number(event.issueId) === selectedIssueId && selectedIssueId) void loadMessages(selectedIssueId);
    };
    socket.on("connect", joinInbox);
    if (socket.connected) joinInbox();
    socket.on("delivery-issue:inbox", refreshInbox);
    socket.on("delivery-issue:message", refreshThread);
    socket.on("delivery-issue:status", refreshThread);
    return () => {
      socket.off("connect", joinInbox);
      socket.off("delivery-issue:inbox", refreshInbox);
      socket.off("delivery-issue:message", refreshThread);
      socket.off("delivery-issue:status", refreshThread);
    };
  }, [selectedIssueId]);
  useEffect(() => {
    if (!selected?.delivery_issue_id) return;
    const socket = connectSocket();
    const joinThread = () => socket.emit("delivery-issue:join", selected.delivery_issue_id);
    socket.on("connect", joinThread);
    if (socket.connected) joinThread();
    return () => {
      socket.off("connect", joinThread);
      socket.emit("delivery-issue:leave", selected.delivery_issue_id);
    };
  }, [selected?.delivery_issue_id]);

  const updateStatus = async (issueStatus: IssueStatus) => {
    if (!selectedIssueId) return;
    try {
      await AxiosInstance.patch(`/delivery-issues/${selectedIssueId}/status`, { issue_status: issueStatus });
      setThreads((current) => current.map((thread) => (thread.delivery_issue_id === selectedIssueId ? { ...thread, issue_status: issueStatus } : thread)));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  };
  const send = async () => {
    if (!selectedIssueId || (!draft.trim() && !attachments.length) || sending) return;
    try {
      setSending(true);
      setError("");
      const form = new FormData();
      if (draft.trim()) form.append("message_text", draft.trim());
      attachments.forEach(({ file }) => form.append("images", file));
      await AxiosInstance.post(`/delivery-issues/${selectedIssueId}/messages`, form);
      setDraft("");
      attachments.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setAttachments([]);
      await Promise.all([loadMessages(selectedIssueId), loadThreads()]);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถส่งข้อความได้");
    } finally {
      setSending(false);
    }
  };
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const statusMatched = threads.filter((thread) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "NEW") return Number(thread.unread_count) > 0;
      return thread.issue_status === statusFilter;
    });
    return term
      ? statusMatched.filter((thread) =>
          [thread.receive_code, thread.last_message, thread.issue_type].some((value) => value.toLowerCase().includes(term)),
        )
      : statusMatched;
  }, [query, statusFilter, threads]);
  const currentUserId = Number(user?.id ?? user?.user_id);

  return (
    <main className="h-[calc(100vh-61px)] overflow-hidden bg-slate-50 font-thai">
      <div className="grid h-full min-h-0 overflow-hidden border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-2 font-bold text-slate-700">
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={19} className="text-blue-600" /> รายการแจ้งปัญหา
              </span>
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
              {(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    if (status === "ALL") setSelectedIssueId(null);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusFilter === status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {status === "ALL" ? "ทั้งหมด" : status === "NEW" ? "ใหม่" : status === "IN_PROGRESS" ? "รับเรื่องแล้ว" : "เสร็จสิ้นแล้ว"}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 max-h-[420px] flex-1 overflow-y-auto p-2 lg:max-h-none">
            {!filtered.length ? (
              <p className="p-3 text-sm text-slate-400">ยังไม่มีรายการแจ้งปัญหา</p>
            ) : (
              filtered.map((thread) => (
                <button
                  key={thread.delivery_issue_id}
                  type="button"
                  onClick={() => setSelectedIssueId(thread.delivery_issue_id)}
                  className={`mb-2 w-full rounded-xl border p-3 text-left transition-colors ${thread.delivery_issue_id === selectedIssueId ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-blue-700">{thread.receive_code}</span>
                        <span className="shrink-0 text-xs text-slate-400">{time(thread.updated_at)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-bold text-slate-700">{thread.issue_type || "แจ้งปัญหาการจัดส่ง"}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{thread.last_message || "ยังไม่มีข้อความ"}</span>
                        {Number(thread.unread_count) > 0 ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">{Number(thread.unread_count) > 99 ? "99+" : Number(thread.unread_count)}</span> : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50">
          {selected ? (
            <>
              <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-blue-700">{selected.receive_code}</h2>
                    <div className="mt-1 text-sm font-bold text-slate-700">{selected.issue_type || "แจ้งปัญหาการจัดส่ง"}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={14} /> ผู้รับ: {recipient}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["IN_PROGRESS", "RESOLVED"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void updateStatus(status)}
                        className={
                          status === "IN_PROGRESS"
                            ? "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                            : "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                        }
                      >
                        {status === "IN_PROGRESS" ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}
                        {status === "IN_PROGRESS" ? "รับเรื่องแล้ว" : "เสร็จสิ้นแล้ว"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
                {loading ? <p className="text-center text-sm text-slate-400">กำลังโหลด...</p> : null}
                {!loading && !messages.length ? <p className="text-center text-sm text-slate-400">ยังไม่มีข้อความ</p> : null}
                {messages.map((message) => {
                  const mine = message.sender_user_id === currentUserId;
                  const mediaPadding = message.media.length ? (message.message_text ? "w-[320px] px-4 pb-2.5 pt-3" : "w-[320px] p-2.5") : "px-4 py-3";
                  return (
                    <div key={message.delivery_status_message_id} className={`flex [contain-intrinsic-size:auto_180px] [content-visibility:auto] ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] lg:max-w-[68%] ${mine ? "ml-auto text-right" : ""}`}>
                        <div className={`mb-1 w-fit text-xs font-semibold text-slate-500 ${mine ? "ml-auto" : ""}`}>
                          {message.sender_name}{message.role_name ? <span className="mx-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-blue-700">{message.role_name}</span> : null} · {time(message.created_date)}
                        </div>
                        <div
                          className={`inline-block max-w-full text-left rounded-2xl text-sm ${mediaPadding} ${mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}
                        >
                          {message.message_text ? <p className="whitespace-pre-wrap break-words">{message.message_text}</p> : null}
                          {message.media.length ? <div className={`grid gap-1.5 ${message.message_text ? "mt-2" : ""} ${message.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {message.media.map((media) => (
                              <img
                                key={media.file_path}
                                src={getUploadUrl(media.thumbnail_path || media.file_path)}
                                alt={media.file_name}
                                loading="lazy"
                                decoding="async"
                                onError={(event) => {
                                  if (event.currentTarget.src !== getUploadUrl(media.file_path)) event.currentTarget.src = getUploadUrl(media.file_path);
                                }}
                                className={message.media.length === 1 ? "max-h-72 w-full rounded-lg object-cover" : "aspect-square w-full rounded-lg object-cover"}
                              />
                            ))}
                          </div> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="shrink-0 border-t border-slate-200 bg-white p-3 lg:p-4">
                {attachments.length ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={attachment.preview} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img src={attachment.preview} alt={attachment.file.name} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAttachments((current) => {
                            const removed = current[index];
                            if (removed) URL.revokeObjectURL(removed.preview);
                            return current.filter((_, itemIndex) => itemIndex !== index);
                          })}
                          className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/75 text-white opacity-100 hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`ลบรูปที่แนบ ${index + 1}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files || []);
                      setAttachments((current) => [...current, ...selectedFiles.slice(0, Math.max(0, 4 - current.length)).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={attachments.length >= 4}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="แนบรูป"
                  >
                    <ImagePlus size={20} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="พิมพ์ข้อความถึงคนขับ..."
                    className="min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || (!draft.trim() && !attachments.length)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="ส่งข้อความ"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
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
              <div className="shrink-0 border-t border-slate-200 bg-white p-3 lg:p-4">
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300"
                    aria-label="แนบรูป"
                  >
                    <ImagePlus size={20} />
                  </button>
                  <textarea
                    disabled
                    rows={1}
                    placeholder="เลือกเคสก่อนพิมพ์ข้อความ..."
                    className="min-h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-white"
                    aria-label="ส่งข้อความ"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
