import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  ImagePlus,
  MapPin,
  QrCode,
  ScanLine,
  Send,
  Truck,
  UserRound,
} from "lucide-react";

type Screen = "LOGIN" | "JOBS" | "CREATE_DT" | "SCAN" | "DT_DETAIL" | "CLOSE" | "ISSUE" | "CHAT";

const screens: { key: Screen; label: string }[] = [
  { key: "LOGIN", label: "1. เข้าสู่ระบบ" },
  { key: "JOBS", label: "2. งานของฉัน" },
  { key: "CREATE_DT", label: "3. สร้าง DT" },
  { key: "SCAN", label: "4. ยิงของขึ้นรถ" },
  { key: "DT_DETAIL", label: "5. รายละเอียด DT" },
  { key: "CLOSE", label: "6. ปิดงาน" },
  { key: "ISSUE", label: "7. แจ้งปัญหา" },
  { key: "CHAT", label: "8. แชทปัญหา" },
];

const Bills = () => (
  <>
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-700">DOA000021202609300001</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">บริษัท ไทยเทค จำกัด</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">รอจัดส่ง</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>3 SN</span>
        <span>ปลายทาง: บางนา</span>
      </div>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-700">DOA000021202609300015</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">บริษัท เอสเอ็มเอ็ม จำกัด</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">ส่งแล้ว</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>2 SN</span>
        <span>ปลายทาง: พระโขนง</span>
      </div>
    </div>
  </>
);

function PhoneHeader({ title, back }: { title: string; back?: boolean }) {
  return (
    <div className="flex min-h-14 items-center border-b border-slate-200 bg-white px-4">
      <button type="button" className={`mr-2 text-slate-600 ${back ? "" : "invisible"}`}>
        <ArrowLeft size={21} />
      </button>
      <div className="flex-1 text-center text-base font-bold text-slate-800">{title}</div>
      <div className="w-7" />
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <div className="min-h-[650px] bg-slate-50">{children}</div>;
}

export default function DriverMockup() {
  const [screen, setScreen] = useState<Screen>("JOBS");
  const [draft, setDraft] = useState("");
  const [snCount, setSnCount] = useState(2);
  const [scanMode, setScanMode] = useState<"LOAD" | "UNLOAD">("LOAD");
  const [messages, setMessages] = useState(["รับเรื่องแล้วค่ะ รบกวนรอการติดต่อกลับ"]);
  const go = (next: Screen) => setScreen(next);

  const renderScreen = () => {
    if (screen === "LOGIN")
      return (
        <Page>
          <div className="flex min-h-[650px] flex-col justify-center p-6">
            <div className="mb-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Truck size={32} />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-slate-800">TMS Driver</h1>
              <p className="mt-1 text-sm text-slate-500">ระบบงานจัดส่งสำหรับคนขับ</p>
            </div>
            <label className="mb-1.5 text-sm font-semibold text-slate-700">Username</label>
            <input className="mb-4 h-11 rounded-lg border border-slate-300 px-3 text-sm" placeholder="กรอก Username" />
            <label className="mb-1.5 text-sm font-semibold text-slate-700">Password</label>
            <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm" placeholder="กรอก Password" type="password" />
            <button type="button" className="mt-6 h-11 rounded-lg bg-blue-600 text-sm font-bold text-white">
              เข้าสู่ระบบ
            </button>
          </div>
        </Page>
      );
    if (screen === "JOBS")
      return (
        <Page>
          <PhoneHeader title="งานของฉัน" />
          <div className="p-4">
            <div className="rounded-xl bg-blue-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <UserRound size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold">สวัสดี สมชาย</p>
                  <p className="text-xs text-blue-100">5 ตุลาคม 2569</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-xs text-blue-100">ใบรถของฉัน</p>
                </div>
                <div className="border-l border-white/30 pl-3">
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-blue-100">บิลรอจัดส่ง</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go("CREATE_DT")}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700"
            >
              <FilePlus2 size={18} /> สร้างใบรถกระจาย (DT)
            </button>
            <h2 className="mb-2 mt-5 text-sm font-bold text-slate-700">ใบรถของฉัน</h2>
            <button
              type="button"
              onClick={() => go("DT_DETAIL")}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-800">DT20261005001</p>
                  <p className="mt-1 text-xs text-slate-500">รถ: 1ฒก 1234 กรุงเทพฯ</p>
                </div>
                <ChevronRight size={19} className="text-slate-400" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/5 rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">ยิงขึ้นรถแล้ว 2 / 5 SN</p>
            </button>
            <button type="button" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-4 text-left opacity-70">
              <p className="font-bold text-slate-800">DT20261005002</p>
              <p className="mt-1 text-xs text-slate-500">ยังไม่ได้เริ่มงาน</p>
            </button>
          </div>
        </Page>
      );
    if (screen === "CREATE_DT")
      return (
        <Page>
          <PhoneHeader title="สร้างใบรถของฉัน" back />
          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-500">ผู้สร้างใบรถ</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700"><UserRound size={17} className="text-blue-600" /> สมชาย ใจดี</div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">รถที่ได้รับมอบหมาย</label>
              <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">1ฒก 1234 กรุงเทพฯ</div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">สายรถ <span className="text-rose-500">*</span></label>
              <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option>กรุงเทพฯ - โซนบางนา</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">วันที่จัดส่ง</label>
              <input type="date" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" value="2026-10-05" readOnly />
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">สร้างแล้ว ระบบจะเปิดหน้ายิงสินค้าให้ทันที</div>
            <button type="button" onClick={() => go("SCAN")} className="h-11 w-full rounded-lg bg-blue-600 text-sm font-bold text-white">
              สร้าง DT และเริ่มยิงสินค้า
            </button>
          </div>
        </Page>
      );
    if (screen === "SCAN")
      return (
        <Page>
          <PhoneHeader title={scanMode === "LOAD" ? "ยิงสินค้าขึ้นรถ" : "นำสินค้าลงจากรถ"} back />
          <div className="p-4">
            <div className="rounded-xl bg-slate-800 p-4 text-white">
              <p className="text-xs text-slate-300">DT20261005001 · รถ 1ฒก 1234 กรุงเทพฯ</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">อยู่บนรถ</span>
                <span className="text-xl font-bold">{snCount} / 5 SN</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${snCount * 20}%` }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-200 p-1">
              <button type="button" onClick={() => setScanMode("LOAD")} className={`h-9 rounded-md text-sm font-bold ${scanMode === "LOAD" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>ยิงขึ้นรถ</button>
              <button type="button" onClick={() => setScanMode("UNLOAD")} className={`h-9 rounded-md text-sm font-bold ${scanMode === "UNLOAD" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500"}`}>นำลงรถ</button>
            </div>
            <button
              type="button"
              onClick={() => setSnCount((count) => scanMode === "LOAD" ? Math.min(5, count + 1) : Math.max(0, count - 1))}
              className={`mt-4 flex h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed ${scanMode === "LOAD" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}
            >
              <ScanLine size={42} />
              <span className="mt-3 text-sm font-bold">แตะเพื่อยิง SN</span>
              <span className="mt-1 text-xs">รองรับเครื่องสแกนบาร์โค้ด</span>
            </button>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle size={15} className="mr-1 inline" /> หาก SN ไม่ตรงสายรถ ระบบจะแจ้งเตือนก่อนเพิ่มเข้ารถ</div>
            <h2 className="mb-2 mt-5 text-sm font-bold text-slate-700">รายการบนรถ</h2>
            {["SN-24090011", "SN-24090012", "SN-24090013", "SN-24090014", "SN-24090015"].slice(0, snCount).map((sn) => (
              <div key={sn} className="mb-2 flex items-center rounded-lg border border-slate-200 bg-white p-3">
                <CheckCircle2 size={18} className="mr-2 text-emerald-600" />
                <span className="flex-1 font-mono text-sm font-semibold text-slate-700">{sn}</span>
                <span className="text-xs text-slate-400">พร้อมส่ง</span>
              </div>
            ))}
          </div>
        </Page>
      );
    if (screen === "DT_DETAIL")
      return (
        <Page>
          <PhoneHeader title="รายละเอียดงาน" back />
          <div className="p-4">
            <div className="rounded-xl bg-slate-800 p-4 text-white">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-slate-300">ใบรถกระจาย</p>
                  <p className="mt-1 text-lg font-bold">DT20261005001</p>
                </div>
                <Truck size={26} />
              </div>
              <p className="mt-3 text-xs text-slate-300">รถ 1ฒก 1234 กรุงเทพฯ · โซนบางนา</p>
            </div>
            <button
              type="button"
              onClick={() => go("SCAN")}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700"
            >
              <QrCode size={18} /> ยิงสินค้าเพิ่ม
            </button>
            <h2 className="mb-2 mt-5 text-sm font-bold text-slate-700">บิลในใบรถนี้</h2>
            <div className="space-y-3">
              <button onClick={() => go("CLOSE")} type="button" className="w-full text-left">
                <Bills />
              </button>
            </div>
          </div>
        </Page>
      );
    if (screen === "CLOSE")
      return (
        <Page>
          <PhoneHeader title="ปิดงานจัดส่ง" back />
          <div className="p-4">
            <p className="text-xs font-bold text-blue-700">DOA000021202609300001</p>
            <h2 className="mt-1 text-base font-bold text-slate-800">บริษัท ไทยเทค จำกัด</h2>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-3 text-sm font-bold text-slate-700">
                เลือกกล่องที่ต้องการปิดงาน <span className="text-rose-500">*</span>
              </p>
              {["SN-24090011", "SN-24090012", "SN-24090013"].map((sn, index) => (
                <label key={sn} className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <input type="checkbox" defaultChecked={index < 2} className="h-4 w-4" />
                  <span className="font-mono">{sn}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-700">
                รูปหลักฐานการส่ง <span className="text-rose-500">*</span>
              </p>
              <button
                type="button"
                className="mt-3 flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500"
              >
                <Camera size={20} /> ถ่ายรูปหรือเลือกรูป
              </button>
              <p className="mt-4 text-sm font-bold text-slate-700">
                ลายเซ็นผู้รับ <span className="text-rose-500">*</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="h-10 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600">อัปโหลดรูป</button>
                <button className="h-10 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600">เซ็นบนหน้าจอ</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => go("ISSUE")}
                className="h-11 rounded-lg border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700"
              >
                แจ้งปัญหา
              </button>
              <button className="h-11 rounded-lg bg-blue-600 text-sm font-bold text-white">บันทึกปิดงาน</button>
            </div>
          </div>
        </Page>
      );
    if (screen === "ISSUE")
      return (
        <Page>
          <PhoneHeader title="แจ้งปัญหาการจัดส่ง" back />
          <div className="space-y-4 p-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-bold text-blue-700">DOA000021202609300001</p>
              <p className="mt-1 text-sm text-blue-800">บริษัท ไทยเทค จำกัด</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                ประเภทปัญหา <span className="text-rose-500">*</span>
              </label>
              <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option>ติดต่อผู้รับไม่ได้</option>
                <option>หาที่อยู่ไม่พบ</option>
                <option>สินค้าเสียหาย</option>
                <option>ผู้รับปฏิเสธรับสินค้า</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                รายละเอียด <span className="text-rose-500">*</span>
              </label>
              <textarea className="min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="ระบุรายละเอียดปัญหา..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600">
                <ImagePlus size={18} /> แนบรูป
              </button>
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600">
                <MapPin size={18} /> แนบพิกัด
              </button>
            </div>
            <button type="button" onClick={() => go("CHAT")} className="h-11 w-full rounded-lg bg-rose-600 text-sm font-bold text-white">
              ส่งแจ้งปัญหา
            </button>
          </div>
        </Page>
      );
    return (
      <Page>
        <PhoneHeader title="ปัญหาการจัดส่ง" back />
        <div className="flex h-[596px] flex-col">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">ติดต่อผู้รับไม่ได้</p>
                <p className="text-xs text-blue-700">DOA000021202609300001</p>
              </div>
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">รับเรื่องแล้ว</span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-bold text-slate-600">คุณ · 10:32</p>
              <p className="mt-1 text-sm text-slate-700">โทรหาผู้รับแล้ว 2 ครั้ง แต่ยังไม่มีคนรับสายครับ</p>
            </div>
            {messages.map((message, index) => (
              <div key={index} className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-blue-600 p-3 text-white">
                <p className="text-xs font-bold text-blue-100">Admin · 10:36</p>
                <p className="mt-1 text-sm">{message}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && draft.trim()) {
                    setMessages((items) => [...items, draft]);
                    setDraft("");
                  }
                }}
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="พิมพ์ข้อความ..."
              />
              <button
                type="button"
                onClick={() => {
                  if (draft.trim()) {
                    setMessages((items) => [...items, draft]);
                    setDraft("");
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </Page>
    );
  };

  return (
    <main className="font-thai p-3 sm:p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Mockup ระบบคนขับรถ</h1>
        <p className="mt-1 text-sm text-slate-500">ออกแบบสำหรับมือถือและ tablet · ข้อมูลจำลอง ยังไม่เชื่อม API หรือแก้ flow เดิม</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 xl:block">
          <p className="col-span-2 px-2 pb-2 text-xs font-bold text-slate-400 sm:col-span-4 xl:block">เลือกหน้าตัวอย่าง</p>
          {screens.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => go(item.key)}
              className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold xl:mb-1 xl:w-full ${screen === item.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-5 shadow-sm">
          <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] border-8 border-slate-800 bg-slate-50 shadow-xl md:max-w-[720px]">
            {renderScreen()}
          </div>
        </div>
      </div>
    </main>
  );
}
