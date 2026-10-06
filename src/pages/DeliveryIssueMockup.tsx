import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Image,
  MapPin,
  MessageCircle,
  PhoneOff,
  Send,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

type IssueStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

type Issue = {
  id: number;
  dt: string;
  receiveCode: string;
  driver: string;
  type: string;
  detail: string;
  time: string;
  status: IssueStatus;
  unread?: boolean;
};

const issues: Issue[] = [
  { id: 1, dt: "DT20261005001", receiveCode: "DOA000021202609300001", driver: "สมชาย ใจดี", type: "ติดต่อผู้รับไม่ได้", detail: "โทรแล้วไม่มีคนรับสาย", time: "10:32", status: "NEW", unread: true },
  { id: 2, dt: "DT20261005002", receiveCode: "DOA000021202609300015", driver: "วิชัย ขนส่ง", type: "สินค้าเสียหาย", detail: "กล่องด้านนอกบุบ 1 กล่อง", time: "10:20", status: "IN_PROGRESS", unread: true },
  { id: 3, dt: "DT20261005003", receiveCode: "DOA000021202609300022", driver: "สมชาย ใจดี", type: "หาที่อยู่ไม่พบ", detail: "พิกัดไม่ตรงกับหน้าบ้าน", time: "09:45", status: "RESOLVED" },
];

const statusStyle: Record<IssueStatus, string> = {
  NEW: "bg-rose-100 text-rose-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<IssueStatus, string> = {
  NEW: "ใหม่",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "แก้ไขแล้ว",
};

const issueIcon = (type: string) => {
  if (type === "ติดต่อผู้รับไม่ได้") return <PhoneOff size={18} />;
  if (type === "สินค้าเสียหาย") return <AlertTriangle size={18} />;
  return <MapPin size={18} />;
};

export default function DeliveryIssueMockup() {
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<IssueStatus | "ALL">("ALL");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { sender: "สมชาย ใจดี", time: "10:32", text: "โทรหาผู้รับแล้ว 2 ครั้ง แต่ยังไม่มีคนรับสายครับ", mine: false },
    { sender: "สมชาย ใจดี", time: "10:33", text: "แนบรูปหน้าสถานที่ไว้ให้ตรวจสอบครับ", mine: false, image: true },
    { sender: "Admin", time: "10:36", text: "รับเรื่องแล้วค่ะ รบกวนรอการติดต่อกลับ", mine: true },
  ]);
  const filteredIssues = useMemo(() => filter === "ALL" ? issues : issues.filter((issue) => issue.status === filter), [filter]);
  const selected = issues.find((issue) => issue.id === selectedId) || issues[0];

  const send = () => {
    if (!draft.trim()) return;
    setMessages((current) => [...current, { sender: "Admin", time: "ตอนนี้", text: draft.trim(), mine: true }]);
    setDraft("");
  };

  return (
    <main className="font-thai p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">แจ้งปัญหาการจัดส่ง</h1>
          <p className="mt-1 text-sm text-slate-500">ตัวอย่างหน้าจอสำหรับรับเรื่องจากคนขับ</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">ตัวอย่าง ยังไม่เชื่อมข้อมูลจริง</span>
      </div>

      <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-700"><MessageCircle size={19} className="text-blue-600" /> รายการแจ้งปัญหา</div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">2 ใหม่</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "NEW", "IN_PROGRESS", "RESOLVED"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${filter === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {item === "ALL" ? "ทั้งหมด" : statusLabel[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2 lg:max-h-[610px]">
            {filteredIssues.map((issue) => (
              <button key={issue.id} type="button" onClick={() => setSelectedId(issue.id)} className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${issue.id === selected.id ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${issue.status === "NEW" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}>{issueIcon(issue.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold text-blue-700">{issue.dt}</span><span className="shrink-0 text-xs text-slate-400">{issue.time}</span></div>
                    <div className="mt-0.5 truncate text-sm font-bold text-slate-700">{issue.type}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">{issue.detail}</div>
                  </div>
                  {issue.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" /> : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-800">{selected.type}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[selected.status]}`}>{statusLabel[selected.status]}</span></div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Truck size={14} /> {selected.dt}</span>
                  <span>Receive Code: {selected.receiveCode}</span>
                  <span className="inline-flex items-center gap-1"><UserRound size={14} /> {selected.driver}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"><Clock3 size={16} /> รับเรื่องแล้ว</button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 size={16} /> แก้ไขแล้ว</button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><span className="h-px flex-1 bg-slate-200" /> วันนี้ <span className="h-px flex-1 bg-slate-200" /></div>
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] lg:max-w-[68%]">
                  <div className={`mb-1 text-xs font-semibold text-slate-500 ${message.mine ? "text-right" : ""}`}>{message.sender} · {message.time}</div>
                  <div className={`rounded-2xl px-4 py-3 text-sm ${message.mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"}`}>
                    {message.text}
                    {message.image ? <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-slate-200 text-slate-500"><Image size={24} /><span className="ml-2 text-xs">รูปสถานที่จากคนขับ</span></div> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-3 lg:p-4">
            <div className="flex items-end gap-2">
              <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="แนบรูป"><Image size={20} /></button>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="พิมพ์ข้อความถึงคนขับ..." rows={1} className="min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={send} disabled={!draft.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="ส่งข้อความ"><Send size={18} /></button>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Wrench size={14} /> ตัวอย่างนี้แยกรายการแจ้งปัญหาออกจากข้อความสนทนา และยังไม่มีการบันทึกข้อมูลจริง</div>
    </main>
  );
}
