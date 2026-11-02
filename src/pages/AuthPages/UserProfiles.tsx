import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { BadgeCheck, CreditCard, KeyRound, Mail, Phone, UserRound, Warehouse } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AxiosInstance from "../../services/apiClient";
import ChangePassword from "./ChangePassword";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type ProfileDetails = {
  employee_code?: string | null;
  title_name?: string | null;
  gender?: string | null;
  email?: string | null;
  tel?: string | null;
  role_name?: string | null;
  employment_type?: string | null;
  is_active?: number | boolean | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role_id?: number;
  warehouse_name?: string | null;
  last_login?: string | null;
  license_no?: string | null;
  license_expire?: string | null;
};

function Info({ label, value, className = "text-slate-900" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 break-words text-sm font-semibold ${className}`}>{value || "-"}</p>
    </div>
  );
}

export default function UserProfiles() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseExpire, setLicenseExpire] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const name =
    [profile?.title_name, profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || user?.username || "ผู้ใช้งาน";
  const isDriver = Number(profile?.role_id) === 7;
  const role = profile?.role_name || (isDriver ? "พนักงานขับรถ" : null);
  const lastLogin = profile?.last_login ? new Date(profile.last_login) : null;

  useEffect(() => {
    let active = true;
    AxiosInstance.get<{ data: ProfileDetails }>("/profile")
      .then(({ data }) => {
        if (!active) return;
        setProfile(data.data);
        setEmail(data.data.email || "");
        setTel(data.data.tel || "");
        setLicenseNo(data.data.license_no || "");
        setLicenseExpire(data.data.license_expire || "");
      })
      .catch(() => {
        if (active) setError("ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await AxiosInstance.patch("/profile", { email, tel, ...(isDriver ? { license_no: licenseNo, license_expire: licenseExpire } : {}) });
      setMessage("บันทึกข้อมูลสำเร็จ");
    } catch (error: unknown) {
      setError(axios.isAxiosError(error) ? error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้" : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-thai mx-auto w-full max-w-5xl space-y-3 px-4 py-4 sm:px-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">โปรไฟล์ของฉัน</h1>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-blue-600"
          aria-label="รูปโปรไฟล์"
        >
          <UserRound size={32} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-lg font-bold text-slate-900">{name}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={16} />
              {profile?.employee_code || profile?.username || user?.username || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={16} />
              {role || "ไม่ระบุตำแหน่ง"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Warehouse size={16} />
              {profile?.warehouse_name || "ไม่ระบุคลัง"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowChangePassword(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <KeyRound size={16} />
          เปลี่ยนรหัสผ่าน
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">ข้อมูลผู้ใช้งาน</h2>
        </header>
        <div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="ชื่อผู้ใช้งาน" value={profile?.username} />
          <Info label="รหัสพนักงาน" value={profile?.employee_code} />
          <Info label="ชื่อ–นามสกุล" value={name} />
          <Info label="ตำแหน่ง" value={role} />
          <Info
            label="ประเภทการจ้าง"
            value={
              profile?.employment_type === "EMPLOYEE"
                ? "พนักงานประจำ"
                : profile?.employment_type === "CONTRACTOR"
                  ? "รถเสริม"
                  : profile?.employment_type
            }
          />
          <Info label="สังกัดคลัง" value={profile?.warehouse_name} />
          <Info label="เพศ" value={profile?.gender} />
          <div>
            <p className="text-xs font-medium text-slate-500">สถานะบัญชี</p>
            <span
              className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${profile?.is_active == null ? "border-slate-200 bg-slate-100 text-slate-600" : Number(profile.is_active) === 1 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
            >
              {profile?.is_active == null ? "-" : Number(profile.is_active) === 1 ? "ใช้งาน" : "ไม่ใช้งาน"}
            </span>
          </div>
          <Info
            label="เข้าสู่ระบบล่าสุด"
            className="text-blue-700"
            value={lastLogin && !Number.isNaN(lastLogin.getTime()) ? lastLogin.toLocaleString("th-TH") : null}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">ข้อมูลติดต่อ</h2>
        </header>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={15} />
              อีเมล
            </span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="กรอกอีเมล" className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5">
              <Phone size={15} />
              เบอร์โทรศัพท์
            </span>
            <input type="tel" value={tel} onChange={(event) => setTel(event.target.value)} placeholder="กรอกเบอร์โทรศัพท์" className={inputClass} />
          </label>
        </div>
      </section>

      {isDriver && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CreditCard size={19} className="text-slate-500" />
              ข้อมูลใบขับขี่
            </h2>
          </header>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              เลขใบขับขี่
              <input value={licenseNo} onChange={(event) => setLicenseNo(event.target.value)} placeholder="กรอกเลขใบขับขี่" className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              วันหมดอายุ
              <input type="date" value={licenseExpire} onChange={(event) => setLicenseExpire(event.target.value)} className={inputClass} />
            </label>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-emerald-700">
              {message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving || !profile}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
      {showChangePassword &&
        createPortal(
          <div
            className="font-thai fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="เปลี่ยนรหัสผ่าน"
              className="relative w-full max-w-[620px]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                aria-label="ปิด"
                className="absolute right-4 top-4 z-10 rounded-lg px-2 py-1 text-slate-400 hover:bg-gray-100"
              >
                ✕
              </button>
              <ChangePassword isModal onClose={() => setShowChangePassword(false)} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
