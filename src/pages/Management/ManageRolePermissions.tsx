import { useEffect, useState } from "react";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import { Check, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AxiosInstance from "../../services/apiClient";
import { permissionGroups as groups } from "./permissionGroups";
import ConfirmModal from "../../components/tms/modal/ConfirmModal";

type Role = { id: number; name: string };
type Permission = { id: number; permission_code: string; permission_name: string };

const IosSwitch = styled(Switch)({
  width: 46,
  height: 28,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 2,
    transitionDuration: "180ms",
    "&.Mui-checked": { color: "#fff", transform: "translateX(18px)", "& + .MuiSwitch-track": { backgroundColor: "#2563eb", opacity: 1 } },
  },
  "& .MuiSwitch-thumb": { boxSizing: "border-box", width: 24, height: 24 },
  "& .MuiSwitch-track": { borderRadius: 14, backgroundColor: "#cbd5e1", opacity: 1 },
});

export default function ManageRolePermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleId, setRoleId] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      AxiosInstance.get<Role[]>("/roles"),
      AxiosInstance.post("/manage/permissions/initialize").then(() => AxiosInstance.get<Permission[]>("/manage/permissions")),
    ])
      .then(([rolesResponse, permissionResponse]) => {
        setRoles(rolesResponse.data);
        setPermissions(permissionResponse.data);
      })
      .catch(() => setMessage("ไม่สามารถโหลดข้อมูลได้"));
  }, []);

  useEffect(() => {
    if (!roleId) return;
    let active = true;
    setLoading(true);
    setLoaded(false);
    setSelected([]);
    setMessage("");
    AxiosInstance.get<{ permission_ids: number[] }>(`/manage/permissions/roles/${roleId}`)
      .then(({ data }) => {
        if (active) {
          setSelected(data.permission_ids);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setMessage("ไม่สามารถโหลดสิทธิ์ของ role ได้");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roleId]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await AxiosInstance.put(`/manage/permissions/roles/${roleId}`, { permission_ids: selected });
      setConfirmOpen(false);
      setMessage("บันทึกสิทธิ์แล้ว");
    } catch {
      setConfirmOpen(false);
      setMessage("ไม่สามารถบันทึกสิทธิ์ได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5 px-4 py-6 sm:px-6">
      <Link to="/manage/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft size={16} /> จัดการผู้ใช้งาน
      </Link>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck size={25} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">สิทธิ์ตั้งต้นตาม role</h1>
            <p className="mt-1 text-sm text-slate-500">เลือกเมนูและหน้าที่แต่ละ role สามารถเข้าถึงได้</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <select
          aria-label="เลือก role"
          value={roleId}
          disabled={loading || saving}
          onChange={(event) => setRoleId(event.target.value)}
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 sm:min-w-64"
        >
          <option value="">เลือก role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!roleId || loading || !loaded || saving || permissions.length === 0}
          className="whitespace-nowrap rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
        </button>
        </div>
      </div>
      {message && (
        <p role="status" className="text-sm font-medium text-slate-700">
          {message}
        </p>
      )}
      <ConfirmModal open={confirmOpen} title="ยืนยันบันทึกสิทธิ์" description={`ต้องการบันทึกสิทธิ์ของ role ${roles.find((role) => String(role.id) === roleId)?.name || "ที่เลือก"} ใช่ไหม?`} loading={saving} onClose={() => setConfirmOpen(false)} onConfirm={() => void save()} />
      {roleId && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">เปิดสิทธิ์ทั้งหมด</p>
            <p className="mt-0.5 text-sm text-slate-500">
              เปิดใช้ {selected.length}/{permissions.length} เมนู
            </p>
          </div>
          <IosSwitch
            checked={permissions.length > 0 && permissions.every((item) => selected.includes(item.id))}
            disabled={loading || saving || !loaded || permissions.length === 0}
            onChange={(_, checked) => setSelected(checked ? permissions.map((item) => item.id) : [])}
            slotProps={{ input: { "aria-label": "เปิดสิทธิ์ทั้งหมด" } }}
          />
        </div>
      )}
      {roleId &&
        (loading ? (
          <p className="text-sm text-slate-500">กำลังโหลด...</p>
        ) : permissions.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีรายการสิทธิ์</p>
        ) : (
          [
            ...groups,
            {
              name: "อื่น ๆ",
              codes: permissions
                .filter((item) => !groups.some((group) => group.codes.includes(item.permission_code)))
                .map((item) => item.permission_code),
            },
          ].map((group) => {
            const items = permissions.filter((item) => group.codes.includes(item.permission_code));
            if (!items.length) return null;
            const count = items.filter((item) => selected.includes(item.id)).length;
            return (
              <section key={group.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{group.name}</h2>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">
                      เปิดใช้ {count}/{items.length} เมนู
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-sm font-semibold text-slate-600 sm:inline">ทั้งหมด</span>
                    <IosSwitch
                      checked={count === items.length}
                      disabled={saving || !loaded}
                      onChange={(_, checked) =>
                        setSelected((current) =>
                          checked
                            ? [...current.filter((id) => !items.some((item) => item.id === id)), ...items.map((item) => item.id)]
                            : current.filter((id) => !items.some((item) => item.id === id)),
                        )
                      }
                      slotProps={{ input: { "aria-label": `เปิดสิทธิ์ทั้งหมดใน${group.name}` } }}
                    />
                  </div>
                </header>
                <div className="divide-y divide-slate-100">
                  {items.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-4 px-5 py-3.5">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${selected.includes(permission.id) ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-300"}`}
                      >
                        <Check size={16} strokeWidth={3} />
                      </span>
                      <p className="min-w-0 flex-1 text-sm font-bold text-slate-800">{permission.permission_name}</p>
                      <IosSwitch
                        checked={selected.includes(permission.id)}
                        disabled={saving || !loaded}
                        onChange={(_, checked) =>
                          setSelected((current) => (checked ? [...current, permission.id] : current.filter((id) => id !== permission.id)))
                        }
                        slotProps={{ input: { "aria-label": permission.permission_name } }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        ))}
    </div>
  );
}
