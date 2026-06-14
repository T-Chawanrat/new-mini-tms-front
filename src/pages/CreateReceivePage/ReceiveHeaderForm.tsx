import DatePicker from "../../components/form/DatePicker";
import RequiredLabel from "../../components/form/RequiredLabel";
import {
  type PaymentOption,
  type ReceiveForm,
  type ShipperROCodeOption,
  type UpdateReceiveForm,
  buttonInputClass,
  checkboxInputClass,
  datePickerWrapClass,
  disabledButtonInputClass,
  disabledInputClass,
  iconButtonClass,
  inputClass,
  labelClass,
  readOnlyInputClass,
  selectClass,
} from "./createReceiveConfig";

type ReceiveHeaderFormProps = {
  form: ReceiveForm;
  payments: PaymentOption[];
  roCodes: ShipperROCodeOption[];
  loadingCustomers: boolean;
  loadingOptions: boolean;
  loadingROCodes: boolean;
  updateForm: UpdateReceiveForm;
  setForm: React.Dispatch<React.SetStateAction<ReceiveForm>>;
  onOpenCustomerModal: () => void;
  onOpenShipperModal: () => void;
  onOpenRecipientModal: () => void;
};

export default function ReceiveHeaderForm({
  form,
  payments,
  roCodes,
  loadingCustomers,
  loadingOptions,
  loadingROCodes,
  updateForm,
  setForm,
  onOpenCustomerModal,
  onOpenShipperModal,
  onOpenRecipientModal,
}: ReceiveHeaderFormProps) {
  return (
    <div className="space-y-2">
      {/* แถวบน */}
      <div className="rounded-md border border-slate-200 bg-white p-2">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[178px_1.55fr_1fr_204px]">
          <div className="grid grid-cols-[58px_110px] items-center gap-1.5">
            <label className={`${labelClass} whitespace-nowrap`}>เลขที่บิล</label>
            <input className={disabledInputClass} value={form.receive_code} disabled placeholder="Auto" />
          </div>

          <div className="grid grid-cols-[78px_1fr] items-center gap-1.5">
            <RequiredLabel required className={`${labelClass} whitespace-nowrap`}>
              เจ้าของงาน
            </RequiredLabel>
            <button type="button" onClick={onOpenCustomerModal} className={buttonInputClass}>
              <span className="truncate">
                {form.customer_name
                  ? `${form.customer_code ? `${form.customer_code} - ` : ""}${form.customer_name}`
                  : loadingCustomers
                    ? "กำลังโหลด..."
                    : "เลือกเจ้าของงาน"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-[66px_1fr] items-center gap-1.5">
            <label className={`${labelClass} whitespace-nowrap`}>Reference</label>
            <input
              className={inputClass}
              value={form.reference_no}
              onChange={(e) => updateForm("reference_no", e.target.value)}
              placeholder="Reference"
            />
          </div>

          <div className="grid grid-cols-[58px_155px] items-center gap-1.5">
            <label className={`${labelClass} whitespace-nowrap`}>วันที่ส่ง</label>
            <div className={datePickerWrapClass}>
              <DatePicker
                variant="compact"
                value={form.delivery_date}
                onChange={(value) => updateForm("delivery_date", value)}
                placeholder="วันที่ส่ง"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ผู้ส่ง / ผู้รับ */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {/* ผู้ส่ง */}
        <div className="rounded-md border border-blue-100 bg-blue-50/70 p-2">
          <div className="mb-2 border-b border-blue-100 pb-1.5 text-xs font-semibold text-blue-900">ข้อมูลผู้ส่ง</div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[74px_1fr_36px] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                รหัสผู้ส่ง
              </RequiredLabel>

              <button type="button" disabled={!form.customer_id || loadingOptions} onClick={onOpenShipperModal} className={disabledButtonInputClass}>
                <span className="truncate">
                  {form.shipper_name
                    ? `${form.shipper_code ? `${form.shipper_code}` : ""}`
                    : form.customer_id
                      ? "เลือกผู้ส่ง"
                      : "เลือกเจ้าของงานก่อน"}
                </span>
              </button>

              <button type="button" disabled={!form.customer_id || loadingOptions} onClick={onOpenShipperModal} className={iconButtonClass}>
                🔍
              </button>
            </div>

            <div className="grid grid-cols-[74px_1fr] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ชื่อผู้ส่ง
              </RequiredLabel>
              <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_name || ""} readOnly />
            </div>

            <div className="grid grid-cols-[74px_1fr] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ที่อยู่
              </RequiredLabel>
              <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_address} readOnly />
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-12 grid grid-cols-[74px_1fr] items-center gap-1.5 md:col-span-6">
                <RequiredLabel required className={labelClass}>
                  ตำบล
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_subdistrict_name} readOnly />
              </div>

              <div className="col-span-12 grid grid-cols-[58px_1fr] items-center gap-1.5 md:col-span-6">
                <RequiredLabel required className={labelClass}>
                  อำเภอ
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_district_name} readOnly />
              </div>

              <div className="col-span-12 grid grid-cols-[74px_1fr] items-center gap-1.5 md:col-span-5">
                <RequiredLabel required className={labelClass}>
                  จังหวัด
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_province_name} readOnly />
              </div>

              <div className="col-span-6 grid grid-cols-[46px_1fr] items-center gap-1.5 md:col-span-3">
                <RequiredLabel required className={labelClass}>
                  รหัส
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_zip_code} readOnly />
              </div>

              <div className="col-span-6 grid grid-cols-[44px_1fr] items-center gap-1.5 md:col-span-4">
                <RequiredLabel required className={labelClass}>
                  โทร
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.shipper_tel} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* ผู้รับ */}
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-2">
          <div className="mb-2 border-b border-emerald-100 pb-1.5 text-xs font-semibold text-emerald-900">ข้อมูลผู้รับ</div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[74px_1fr_36px] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                รหัสผู้รับ
              </RequiredLabel>

              <button
                type="button"
                disabled={!form.customer_id || loadingOptions}
                onClick={onOpenRecipientModal}
                className={disabledButtonInputClass}
              >
                <span className="truncate">
                  {form.recipient_name
                    ? `${form.recipient_code ? `${form.recipient_code} - ` : ""}${form.recipient_name}`
                    : form.customer_id
                      ? "เลือกผู้รับ"
                      : "เลือกเจ้าของงานก่อน"}
                </span>
              </button>

              <button type="button" disabled={!form.customer_id || loadingOptions} onClick={onOpenRecipientModal} className={iconButtonClass}>
                🔍
              </button>
            </div>

            <div className="grid grid-cols-[74px_1fr] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ชื่อผู้รับ
              </RequiredLabel>
              <input className={`${readOnlyInputClass} bg-white`} value={form.recipient_detail_name || ""} readOnly />
            </div>

            <div className="grid grid-cols-[74px_1fr] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ที่อยู่
              </RequiredLabel>
              <input className={`${readOnlyInputClass} bg-white`} value={form.address} readOnly />
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-12 grid grid-cols-[74px_1fr] items-center gap-1.5 md:col-span-6">
                <RequiredLabel required className={labelClass}>
                  ตำบล
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.subdistrict_name} readOnly />
              </div>

              <div className="col-span-12 grid grid-cols-[58px_1fr] items-center gap-1.5 md:col-span-6">
                <RequiredLabel required className={labelClass}>
                  อำเภอ
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.district_name} readOnly />
              </div>

              <div className="col-span-12 grid grid-cols-[74px_1fr] items-center gap-1.5 md:col-span-5">
                <RequiredLabel required className={labelClass}>
                  จังหวัด
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.province_name} readOnly />
              </div>

              <div className="col-span-6 grid grid-cols-[46px_1fr] items-center gap-1.5 md:col-span-3">
                <RequiredLabel required className={labelClass}>
                  รหัส
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.zip_code} readOnly />
              </div>

              <div className="col-span-6 grid grid-cols-[44px_1fr] items-center gap-1.5 md:col-span-4">
                <RequiredLabel required className={labelClass}>
                  โทร
                </RequiredLabel>
                <input className={`${readOnlyInputClass} bg-white`} value={form.tel} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-2">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[230px_1fr_200px_370px]">
          <div className="grid grid-cols-[88px_135px] items-center gap-1.5">
            <label className={labelClass}>ประเภทการจ่าย</label>

            <select className={selectClass} value={form.payment_type_id} onChange={(e) => updateForm("payment_type_id", e.target.value)}>
              {payments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-1.5">
            <label className={`${labelClass} whitespace-nowrap`}>เงื่อนไขการจัดส่ง</label>
            <input
              className={inputClass}
              value={form.remark}
              onChange={(e) => updateForm("remark", e.target.value)}
              placeholder="เงื่อนไขการจัดส่ง"
            />
          </div>

          <div className="grid grid-cols-[40px_150px] items-center gap-1.5">
            <label className={labelClass}>COD</label>

            <div className="grid grid-cols-[18px_125px] items-center gap-1.5">
              <input
                type="checkbox"
                className={checkboxInputClass}
                checked={form.is_cod === "Y"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    is_cod: e.target.checked ? "Y" : "N",
                    cod: e.target.checked ? prev.cod || "0.00" : "",
                  }))
                }
              />

              <input
                className={form.is_cod === "Y" ? inputClass : disabledInputClass}
                type="number"
                step="0.01"
                min="0"
                value={form.cod}
                disabled={form.is_cod !== "Y"}
                onChange={(e) => updateForm("cod", e.target.value)}
                onBlur={() => {
                  if (form.is_cod !== "Y") return;

                  const value = Number(form.cod || 0);
                  updateForm("cod", value.toFixed(2));
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-[88px_1fr] items-center gap-1.5">
            <label className={labelClass}>เอกสารรับกลับ</label>

            <div className="grid grid-cols-[18px_1fr] items-center gap-1.5">
              <input
                type="checkbox"
                className={checkboxInputClass}
                checked={form.is_document_return === "Y"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    is_document_return: e.target.checked ? "Y" : "N",
                    document_return: e.target.checked ? prev.document_return : "",
                  }))
                }
              />

              <select
                className={form.is_document_return === "Y" ? selectClass : disabledInputClass}
                value={form.document_return}
                disabled={form.is_document_return !== "Y" || loadingROCodes || !form.shipper_id}
                onChange={(e) => updateForm("document_return", e.target.value)}
              >
                <option value="">
                  {loadingROCodes
                    ? "กำลังโหลด..."
                    : !form.shipper_id
                      ? "เลือกผู้ส่งก่อน"
                      : roCodes.length === 0
                        ? "ไม่มีเอกสารรับกลับ"
                        : "เลือกเอกสารรับกลับ"}
                </option>

                {roCodes.map((item) => (
                  <option key={item.ro_code_id} value={String(item.ro_code_id)}>
                    {item.ro_code} - {item.ro_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
