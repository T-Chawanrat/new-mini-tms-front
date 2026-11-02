import { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import AxiosInstance from "../../services/apiClient";
import ConfirmModal from "../../components/tms/modal/ConfirmModal";

type WarehouseOption = { id: number; name: string };

const IosSwitch = styled(Switch)({
  width: 46, height: 28, padding: 0,
  "& .MuiSwitch-switchBase": { padding: 2, transitionDuration: "180ms", "&.Mui-checked": { color: "#fff", transform: "translateX(18px)", "& + .MuiSwitch-track": { backgroundColor: "#2563eb", opacity: 1 } } },
  "& .MuiSwitch-thumb": { boxSizing: "border-box", width: 24, height: 24 },
  "& .MuiSwitch-track": { borderRadius: 14, backgroundColor: "#cbd5e1", opacity: 1 },
});

export default function ManageUserWarehouses({ userId }: { userId: string }) {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setSelected([]);
    setLoading(true);
    setError("");
    setLoadFailed(false);
    setMessage("");
    Promise.all([
      AxiosInstance.get<WarehouseOption[]>("/warehouses"),
      AxiosInstance.get<{ warehouse_ids: number[] }>(`/manage/permissions/users/${userId}/warehouses`),
    ])
      .then(([options, permissions]) => {
        if (!active) return;
        const ids = permissions.data.warehouse_ids.map(Number);
        setWarehouses(options.data);
        setSelected(ids);
        if (ids.some((id) => !options.data.some((warehouse) => Number(warehouse.id) === id))) {
          setLoadFailed(true);
          setError("มีสิทธิ์คลังเดิมที่ไม่พบในรายการคลัง กรุณาตรวจสอบข้อมูลก่อนบันทึก");
        }
      })
      .catch(() => { if (active) { setLoadFailed(true); setError("ไม่สามารถโหลดสิทธิ์คลังได้"); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await AxiosInstance.put(`/manage/permissions/users/${userId}/warehouses`, { warehouse_ids: selected });
      setMessage("บันทึกสิทธิ์คลังแล้ว");
    } catch (error: any) {
      setError(error.response?.data?.message || "ไม่สามารถบันทึกสิทธิ์คลังได้");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
        <div><h2 className="text-base font-bold text-slate-900">สิทธิ์เข้าใช้งานคลัง</h2><p className="mt-0.5 text-sm font-medium text-slate-500">เลือกแล้ว {selected.length} จาก {warehouses.length} คลัง</p></div>
        <button type="button" onClick={() => setConfirmOpen(true)} disabled={loading || saving || loadFailed} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">บันทึกสิทธิ์คลัง</button>
      </header>
      <div className="p-5">
        {message && <p role="status" className="mb-3 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
        {loading ? <p className="text-sm text-slate-500">กำลังโหลดรายการคลัง...</p> : loadFailed ? null : warehouses.length === 0 ? <p className="text-sm text-slate-500">ไม่พบรายการคลัง</p> : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {warehouses.map((warehouse) => {
              const checked = selected.includes(Number(warehouse.id));
              return <div key={warehouse.id} className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 ${checked ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${checked ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}><Warehouse size={18} /></span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{warehouse.name}</span>
                <IosSwitch checked={checked} disabled={saving} onChange={(_, enabled) => { setMessage(""); setError(""); setSelected((current) => enabled ? [...current, Number(warehouse.id)] : current.filter((id) => id !== Number(warehouse.id))); }} slotProps={{ input: { "aria-label": `สิทธิ์คลัง ${warehouse.name}` } }} />
              </div>;
            })}
          </div>
        )}
      </div>
      <ConfirmModal open={confirmOpen} title="ยืนยันบันทึกสิทธิ์คลัง" description={`ต้องการบันทึกสิทธิ์เข้าใช้งาน ${selected.length} คลังใช่ไหม?`} loading={saving} onClose={() => setConfirmOpen(false)} onConfirm={() => void save()} />
    </section>
  );
}
