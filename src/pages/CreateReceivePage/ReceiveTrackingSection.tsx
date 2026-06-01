import { useState } from "react";

type TrackingTab = "delivery_problem" | "call_history" | "success_history" | "attachments";

const tabs: { key: TrackingTab; label: string }[] = [
  { key: "delivery_problem", label: "ปัญหาการจัดส่ง" },
  { key: "call_history", label: "ประวัติการโทร" },
  { key: "success_history", label: "ประวัติการส่งสำเร็จ" },
  { key: "attachments", label: "แนบไฟล์" },
];

export default function ReceiveTrackingSection() {
  const [activeTab, setActiveTab] = useState<TrackingTab>("delivery_problem");

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="mb-1.5 flex flex-wrap gap-4 text-[11px]">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                active
                  ? "border-b-2 border-blue-600 pb-0.5 font-semibold text-blue-700"
                  : "pb-0.5 text-slate-500 hover:text-slate-700"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "attachments" && (
        <button
          type="button"
          className="mb-1.5 rounded border border-blue-500 px-2.5 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50"
        >
          เพิ่มรูป
        </button>
      )}

      <div className="flex h-16 items-center justify-center border border-slate-200 text-center text-xs text-slate-400">
        ยังไม่มีข้อมูล
      </div>
    </div>
  );
}