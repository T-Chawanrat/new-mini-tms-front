import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import { ArrowLeft, Check, ShieldCheck, UserRound } from "lucide-react";
import AxiosInstance from "../../services/apiClient";
import { permissionGroups } from "./permissionGroups";
import ConfirmModal from "../../components/tms/modal/ConfirmModal";
import ManageUserWarehouses from "./ManageUserWarehouses";

type Permission = { id: number; permission_code: string; permission_name: string };
type User = { id: number; username: string; first_name: string | null; last_name: string | null; role_id: number };
type Override = { permission_id: number; is_allowed: number };

const IosSwitch = styled(Switch)({
  width: 46, height: 28, padding: 0,
  "& .MuiSwitch-switchBase": { padding: 2, transitionDuration: "180ms", "&.Mui-checked": { color: "#fff", transform: "translateX(18px)", "& + .MuiSwitch-track": { backgroundColor: "#2563eb", opacity: 1 } } },
  "& .MuiSwitch-thumb": { boxSizing: "border-box", width: 24, height: 24 },
  "& .MuiSwitch-track": { borderRadius: 14, backgroundColor: "#cbd5e1", opacity: 1 },
});

export default function ManagePermissions() {
  const [params] = useSearchParams();
  const userId = params.get("user_id");
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUser(null);
    setError("");
    if (!userId || !/^[1-9]\d*$/.test(userId)) {
      setError("ไม่พบผู้ใช้งาน กรุณาเลือกจากหน้าจัดการผู้ใช้งาน");
      setLoading(false);
      return;
    }
    Promise.all([
      AxiosInstance.get<Permission[]>("/manage/permissions"),
      AxiosInstance.get<{ user: User; role_permission_ids: number[]; overrides: Override[] }>(`/manage/permissions/users/${userId}`),
    ]).then(([permissionsResponse, userResponse]) => {
      if (!active) return;
      setPermissions(permissionsResponse.data);
      setUser(userResponse.data.user);
      setRoleIds(userResponse.data.role_permission_ids);
      setOverrides(Object.fromEntries(userResponse.data.overrides.map((item) => [item.permission_id, Number(item.is_allowed) === 1])));
    }).catch(() => { if (active) setError("ไม่สามารถโหลดสิทธิ์ผู้ใช้งานได้"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const enabled = (id: number) => overrides[id] ?? roleIds.includes(id);
  const setPermission = (id: number, value: boolean) => setOverrides((current) => ({ ...current, [id]: value }));
  const resetPermission = (id: number) => setOverrides((current) => {
    const next = { ...current };
    delete next[id];
    return next;
  });

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await AxiosInstance.put(`/manage/permissions/users/${userId}`, {
        overrides: Object.entries(overrides).map(([id, is_allowed]) => ({ permission_id: Number(id), is_allowed })),
      });
      setConfirmOpen(false);
      setMessage("บันทึกสิทธิ์เมนูแล้ว");
    } catch {
      setConfirmOpen(false);
      setMessage("ไม่สามารถบันทึกสิทธิ์ได้");
    } finally {
      setSaving(false);
    }
  };

  const groups = [...permissionGroups, { name: "อื่น ๆ", codes: permissions.filter((item) => !permissionGroups.some((group) => group.codes.includes(item.permission_code))).map((item) => item.permission_code) }];
  const name = user && ([user.first_name, user.last_name].filter(Boolean).join(" ") || user.username);

  return (
    <div className="w-full space-y-5 px-4 py-6 sm:px-6">
      <Link to="/manage/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> จัดการผู้ใช้งาน</Link>
      {!loading && user && userId && <ManageUserWarehouses userId={userId} />}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={25} /></span><div><h1 className="text-xl font-bold text-slate-900">กำหนดสิทธิ์ผู้ใช้งาน</h1><p className="mt-1 text-sm text-slate-500">เลือกเมนูและหน้าที่ผู้ใช้งานสามารถเข้าถึงได้</p></div></div>
        <div className="flex items-center gap-3"><div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-4 py-3"><UserRound size={20} className="shrink-0 text-slate-500" /><span className="text-sm font-semibold text-slate-800">{loading ? "กำลังโหลด..." : name || "ไม่พบผู้ใช้งาน"}</span></div><button type="button" onClick={() => setConfirmOpen(true)} disabled={loading || saving || !user || permissions.length === 0} className="whitespace-nowrap rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}</button></div>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
      {message && <p role="status" className="text-sm font-medium text-slate-700">{message}</p>}
      {!loading && user && permissions.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีรายการสิทธิ์ กรุณาเปิดหน้าสิทธิ์ตาม role เพื่อเตรียมรายการ</p>}
      <ConfirmModal open={confirmOpen} title="ยืนยันบันทึกสิทธิ์" description={`ต้องการบันทึกสิทธิ์ของ ${name || "ผู้ใช้งาน"} ใช่ไหม?`} loading={saving} onClose={() => setConfirmOpen(false)} onConfirm={() => void save()} />
      {!loading && user && groups.map((group) => {
        const items = permissions.filter((item) => group.codes.includes(item.permission_code));
        if (!items.length) return null;
        const count = items.filter((item) => enabled(item.id)).length;
        return <section key={group.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3.5"><div><h2 className="text-base font-bold text-slate-900">{group.name}</h2><p className="mt-0.5 text-sm font-medium text-slate-500">เปิดใช้ {count}/{items.length} เมนู</p></div><div className="flex items-center gap-2"><span className="hidden text-sm font-semibold text-slate-600 sm:inline">ทั้งหมด</span><IosSwitch checked={count === items.length} disabled={saving} onChange={(_, checked) => setOverrides((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.id, checked])) }))} slotProps={{ input: { "aria-label": `เปิดสิทธิ์ทั้งหมดใน${group.name}` } }} /></div></header>
          <div className="divide-y divide-slate-100">{items.map((item) => <div key={item.id} className="flex items-center gap-4 px-5 py-3.5"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${enabled(item.id) ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-300"}`}><Check size={16} strokeWidth={3} /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{item.permission_name}</p>{overrides[item.id] !== undefined && <button type="button" disabled={saving} onClick={() => resetPermission(item.id)} className="mt-1 text-xs font-semibold text-blue-600 hover:underline">กลับไปใช้สิทธิ์ตาม role</button>}</div><IosSwitch checked={enabled(item.id)} disabled={saving} onChange={(_, checked) => setPermission(item.id, checked)} slotProps={{ input: { "aria-label": `สิทธิ์ ${item.permission_name}` } }} /></div>)}</div>
        </section>;
      })}
    </div>
  );
}
