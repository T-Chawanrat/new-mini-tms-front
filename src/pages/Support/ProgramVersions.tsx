import { CheckCircle2, GitCommitHorizontal, Rocket, Wrench } from "lucide-react";

type Release = { version: string; releasedAt: string; status?: "CURRENT"; changes: string[] };

const releases: Release[] = [
  {
    version: "v2.0.2",
    releasedAt: "อัปเดตล่าสุด",
    status: "CURRENT",
    changes: [
      "เพิ่มส่วนงาน Customer สำหรับผู้ใช้งาน role: customer",
      "ปรับ Create Receive ให้ค้นหาและแบ่งหน้าผู้ส่ง/ผู้รับจาก backend",
      "ปรับการพิมพ์ Label และแก้ปัญหาหน้าว่างตอนพิมพ์ 1 SN",
      "แก้ไขพิมพ์บิลและพิมพ์สติกเกอร์ในรายงานรับสินค้า",
      "ปรับการแสดงผล sidebar",
      ],
  },
];

export default function ProgramVersions() {
  const current = releases[0];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-1 py-2 font-thai text-slate-800">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Rocket size={25} />
            </span>
            <div>
              <p className="text-sm text-slate-500">เวอร์ชันโปรแกรม</p>
              <h1 className="mt-0.5 text-2xl font-bold text-slate-900">{current.version}</h1>
              <p className="mt-1 text-sm text-slate-600">{current.releasedAt}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">สถานะ</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 size={16} />
              ใช้งานอยู่
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal size={20} className="text-blue-600" />
          <div>
            <h2 className="font-semibold text-slate-900">ประวัติการเปลี่ยนแปลง</h2>
            <p className="text-xs text-slate-500">รายการอัปเดตของระบบ</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {releases.map((release, index) => (
            <article key={release.version} className="relative border-l-2 border-slate-200 pl-5 pb-1 last:border-transparent">
              <span
                className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white ${index === 0 ? "bg-blue-600" : "bg-slate-300"}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-800">{release.version}</h3>
                {release.status === "CURRENT" && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">CURRENT</span>
                )}
                <span className="text-xs text-slate-400">{release.releasedAt}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {release.changes.map((change) => (
                  <li key={change} className="flex gap-2">
                    <Wrench size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    {change}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
