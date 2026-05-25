import { useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RequiredLabel = ({ children }: { children: string }) => {
  return (
    <label className="block text-xs font-medium text-slate-500 mb-1">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </label>
  );
};

type ChangePasswordProps = {
  onClose?: () => void;
  isModal?: boolean;
};

export default function ChangePassword({
  onClose,
  isModal = false,
}: ChangePasswordProps) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });

    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setSuccess("");

      if (!form.old_password) {
        setError("กรุณากรอกรหัสผ่านเดิม");
        return;
      }

      if (!form.new_password) {
        setError("กรุณากรอกรหัสผ่านใหม่");
        return;
      }

      if (form.new_password.length < 6) {
        setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }

      if (!form.confirm_password) {
        setError("กรุณายืนยันรหัสผ่านใหม่");
        return;
      }

      if (form.new_password !== form.confirm_password) {
        setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }

      if (form.old_password === form.new_password) {
        setError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
        return;
      }

      setSaving(true);

      await AxiosInstance.patch("/manage/users/change-password", {
        old_password: form.old_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });

      setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      resetForm();

      if (isModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        isModal
          ? "w-full"
          : "w-full min-h-screen bg-slate-50 px-4 py-6"
      }
    >
      {!isModal && (
        <div className="w-full max-w-[620px] mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            Change Password
          </h2>
          <p className="text-sm text-slate-500">เปลี่ยนรหัสผ่าน</p>
        </div>
      )}

      <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6 pr-8">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800">
              เปลี่ยนรหัสผ่าน
            </h3>
            <p className="text-sm text-slate-500 truncate">
              ผู้ใช้งาน: {user?.username || "-"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-green-50 text-green-600 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <RequiredLabel>รหัสผ่านเดิม</RequiredLabel>

            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className="input-modern w-full pl-4 pr-11"
                placeholder="กรอกรหัสผ่านเดิม"
                value={form.old_password}
                onChange={(e) => handleChange("old_password", e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <RequiredLabel>รหัสผ่านใหม่</RequiredLabel>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className="input-modern w-full pl-4 pr-11"
                placeholder="กรอกรหัสผ่านใหม่"
                value={form.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <RequiredLabel>ยืนยันรหัสผ่านใหม่</RequiredLabel>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="input-modern w-full pl-4 pr-11"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={form.confirm_password}
                onChange={(e) =>
                  handleChange("confirm_password", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
            >
              ล้างข้อมูล
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl text-white shadow transition ${
                saving
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}