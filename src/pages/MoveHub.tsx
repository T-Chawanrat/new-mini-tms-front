import { useSearchParams } from "react-router-dom";

import MoveDc from "./MoveDc";
import MoveDt from "./MoveDt";
import MoveTk from "./MoveTk";

const tabs = [
  { id: "tk", label: "ย้ายระหว่างใบปิดบรรทุก", component: MoveTk },
  { id: "dt", label: "ย้ายขึ้นรถกระจาย", component: MoveDt },
  { id: "dc", label: "ย้ายระหว่างคลัง", component: MoveDc },
] as const;

export default function MoveHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabId = tabs.some((tab) => tab.id === searchParams.get("tab")) ? searchParams.get("tab")! : "tk";
  const ActivePage = tabs.find((tab) => tab.id === activeTabId)!.component;

  return (
    <div className="h-[calc(100vh-61px)] overflow-hidden bg-slate-50">
      <nav className="flex h-11 shrink-0 items-end gap-1 border-b border-slate-200 bg-white px-3" aria-label="เมนูย้ายสินค้า">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`h-9 rounded-t-md px-4 text-sm font-medium transition ${
                active
                  ? "border border-b-white border-blue-200 bg-white text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <ActivePage />
    </div>
  );
}
