import { useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import DatePicker from "../components/form/DatePicker";
import RequiredLabel from "../components/form/RequiredLabel";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import {
  cleanEmailInput,
  cleanNumberInput,
} from "../utils/textSanitizer";

type Option = {
  id: number;
  name?: string;
  province_name?: string;
};

type ContractorForm = {
  title_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  citizen_id: string;
  email: string;
  tel: string;
  license_no: string;
  license_expire: string;
  license_plate: string;
  license_plate_province_id: string;
  brand_id: string;
  model: string;
  color: string;
  vehicle_type_id: string;
  max_load_kg: string;
};

const emptyForm: ContractorForm = {
  title_name: "",
  first_name: "",
  last_name: "",
  gender: "",
  citizen_id: "",
  email: "",
  tel: "",
  license_no: "",
  license_expire: "",
  license_plate: "",
  license_plate_province_id: "",
  brand_id: "",
  model: "",
  color: "",
  vehicle_type_id: "",
  max_load_kg: "",
};

export default function ContractorCreate() {
  const { user } = useAuth();
  const [form, setForm] = useState<ContractorForm>(emptyForm);
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    username: string;
    defaultPassword: string;
  } | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [provinceResponse, brandResponse, vehicleTypeResponse] =
          await Promise.all([
            AxiosInstance.get("/provinces"),
            AxiosInstance.get("/vehicle-brands"),
            AxiosInstance.get("/vehicle-types"),
          ]);

        setProvinces(provinceResponse.data || []);
        setBrands(brandResponse.data || []);
        setVehicleTypes(vehicleTypeResponse.data || []);
      } catch (requestError: any) {
        setError(
          requestError.response?.data?.message ||
            "ไม่สามารถโหลดข้อมูลตัวเลือกได้",
        );
      }
    };

    loadOptions();
  }, []);

  const setValue = (field: keyof ContractorForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const validate = () => {
    if (!form.first_name.trim()) return "กรุณากรอกชื่อคนขับ";
    if (!form.last_name.trim()) return "กรุณากรอกนามสกุลคนขับ";
    if (!/^\d{9,10}$/.test(form.tel)) return "กรุณากรอกเบอร์โทร 9-10 หลัก";
    if (!form.license_no.trim()) return "กรุณากรอกเลขใบขับขี่";
    if (!form.license_expire) return "กรุณาเลือกวันหมดอายุใบขับขี่";
    if (!form.license_plate.trim()) return "กรุณากรอกทะเบียนรถ";
    if (!form.license_plate_province_id) return "กรุณาเลือกจังหวัดทะเบียน";
    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setLoading(true);

      const response = await AxiosInstance.post("/contractors", {
        user: {
          title_name: form.title_name || null,
          first_name: form.first_name,
          last_name: form.last_name,
          gender: form.gender || null,
          citizen_id: form.citizen_id || null,
          email: form.email || null,
          tel: form.tel || null,
          license_no: form.license_no.slice(0, 8),
          license_expire: form.license_expire,
        },
        vehicle: {
          license_plate: form.license_plate.slice(0, 7),
          license_plate_province_id: form.license_plate_province_id,
          brand_id: form.brand_id || null,
          model: form.model || null,
          color: form.color || null,
          vehicle_type_id: form.vehicle_type_id || null,
          max_load_kg: form.max_load_kg || null,
        },
      });

      setSuccess({
        username: response.data.username,
        defaultPassword: response.data.password,
      });
      setForm(emptyForm);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message || "ไม่สามารถสร้างรถเสริมได้",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-4 md:p-5">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">
          สร้างคนขับและรถเสริม
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          สร้างบัญชีคนขับรถเสริมและข้อมูลรถพร้อมกันสำหรับคลังที่กำลังใช้งาน
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-700">ข้อมูลบัญชีคนขับ</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {user?.warehouse_name || "ไม่พบชื่อคลัง"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <RequiredLabel>คำนำหน้า</RequiredLabel>
              <select
                className={inputClass}
                value={form.title_name}
                onChange={(event) => setValue("title_name", event.target.value)}
              >
                <option value="">เลือกคำนำหน้า</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
            </div>
            <div>
              <RequiredLabel>เพศ</RequiredLabel>
              <select
                className={inputClass}
                value={form.gender}
                onChange={(event) => setValue("gender", event.target.value)}
              >
                <option value="">เลือกเพศ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
            <div>
              <RequiredLabel required>ชื่อ</RequiredLabel>
              <input
                className={inputClass}
                value={form.first_name}
                onChange={(event) => setValue("first_name", event.target.value)}
              />
            </div>
            <div>
              <RequiredLabel required>นามสกุล</RequiredLabel>
              <input
                className={inputClass}
                value={form.last_name}
                onChange={(event) => setValue("last_name", event.target.value)}
              />
            </div>
            <div>
              <RequiredLabel>เลขบัตรประชาชน</RequiredLabel>
              <input
                className={inputClass}
                value={form.citizen_id}
                maxLength={13}
                onChange={(event) =>
                  setValue(
                    "citizen_id",
                    cleanNumberInput(event.target.value).slice(0, 13),
                  )
                }
              />
            </div>
            <div>
              <RequiredLabel required>เบอร์โทร (ใช้เป็น Password)</RequiredLabel>
              <input
                className={inputClass}
                value={form.tel}
                maxLength={10}
                onChange={(event) =>
                  setValue("tel", cleanNumberInput(event.target.value).slice(0, 10))
                }
              />
            </div>
            <div>
              <RequiredLabel>Email</RequiredLabel>
              <input
                className={inputClass}
                value={form.email}
                onChange={(event) =>
                  setValue("email", cleanEmailInput(event.target.value))
                }
              />
            </div>
            <div>
              <RequiredLabel required>เลขใบขับขี่</RequiredLabel>
              <input
                className={inputClass}
                value={form.license_no}
                maxLength={8}
                onChange={(event) =>
                  setValue("license_no", cleanNumberInput(event.target.value).slice(0, 8))
                }
              />
            </div>
            <div>
              <RequiredLabel required>วันหมดอายุใบขับขี่</RequiredLabel>
              <DatePicker
                value={form.license_expire}
                onChange={(value) =>
                  setValue("license_expire", value)
                }
                placeholder="วันหมดอายุใบขับขี่"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 border-b border-slate-100 pb-3 font-semibold text-slate-700">
            ข้อมูลรถเสริม
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <RequiredLabel required>ทะเบียนรถ</RequiredLabel>
              <input
                className={inputClass}
                value={form.license_plate}
                maxLength={7}
                onChange={(event) =>
                  setValue("license_plate", event.target.value.replace(/\s/g, "").slice(0, 7))
                }
              />
            </div>
            <div>
              <RequiredLabel required>จังหวัดทะเบียน</RequiredLabel>
              <select
                className={inputClass}
                value={form.license_plate_province_id}
                onChange={(event) =>
                  setValue("license_plate_province_id", event.target.value)
                }
              >
                <option value="">เลือกจังหวัดทะเบียน</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.province_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <RequiredLabel>ยี่ห้อรถ</RequiredLabel>
              <select
                className={inputClass}
                value={form.brand_id}
                onChange={(event) => setValue("brand_id", event.target.value)}
              >
                <option value="">เลือกยี่ห้อรถ</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <RequiredLabel>ประเภทรถ</RequiredLabel>
              <select
                className={inputClass}
                value={form.vehicle_type_id}
                onChange={(event) =>
                  setValue("vehicle_type_id", event.target.value)
                }
              >
                <option value="">เลือกประเภทรถ</option>
                {vehicleTypes.map((vehicleType) => (
                  <option key={vehicleType.id} value={vehicleType.id}>
                    {vehicleType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <RequiredLabel>รุ่นรถ</RequiredLabel>
              <input
                className={inputClass}
                value={form.model}
                onChange={(event) => setValue("model", event.target.value)}
              />
            </div>
            <div>
              <RequiredLabel>สีรถ</RequiredLabel>
              <input
                className={inputClass}
                value={form.color}
                onChange={(event) => setValue("color", event.target.value)}
              />
            </div>
            <div>
              <RequiredLabel>น้ำหนักบรรทุกสูงสุด (kg)</RequiredLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.max_load_kg}
                onChange={(event) => setValue("max_load_kg", event.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "กำลังบันทึก..." : "สร้างคนขับและรถเสริม"}
          </button>
        </div>
      </form>

      {success && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-[scaleIn_180ms_ease-out] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                ✓
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                สร้าง User ชั่วคราวสำเร็จ
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                กรุณาจด Username และ Password ก่อนปิดหน้าต่างนี้
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Username</span>
                <strong className="text-base text-slate-800">
                  {success.username}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                <span className="text-sm text-slate-500">Password</span>
                <strong className="text-base text-slate-800">
                  {success.defaultPassword}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              รับทราบและปิด
            </button>
          </div>
        </div>
      )}
      </div>
    </LocalizationProvider>
  );
}
