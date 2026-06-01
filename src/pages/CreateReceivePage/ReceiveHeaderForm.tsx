import DatePicker from "../../components/form/DatePicker";
import RequiredLabel from "../../components/form/RequiredLabel";
import {
  type PaymentOption,
  type ReceiveForm,
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
  loadingCustomers: boolean;
  loadingOptions: boolean;
  updateForm: UpdateReceiveForm;
  setForm: React.Dispatch<React.SetStateAction<ReceiveForm>>;
  onOpenCustomerModal: () => void;
  onOpenShipperModal: () => void;
  onOpenRecipientModal: () => void;
};

export default function ReceiveHeaderForm({
  form,
  payments,
  loadingCustomers,
  loadingOptions,
  updateForm,
  setForm,
  onOpenCustomerModal,
  onOpenShipperModal,
  onOpenRecipientModal,
}: ReceiveHeaderFormProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.05fr_1.15fr_0.9fr]">
        <div className="space-y-1.5">
          <div className="grid grid-cols-[92px_1fr] items-center gap-1.5">
            <label className={labelClass}>เลขที่เอกสาร</label>
            <input className={disabledInputClass} value={form.receive_code} disabled placeholder="ไม่ต้องระบุ" />

            <RequiredLabel required className={labelClass}>
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

          <div className="rounded-md border border-blue-100 bg-blue-50/70 p-1.5">
            <div className="grid grid-cols-[92px_1fr_36px] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ผู้ส่ง
              </RequiredLabel>

              <button
                type="button"
                disabled={!form.customer_id || loadingOptions}
                onClick={onOpenShipperModal}
                className={disabledButtonInputClass}
              >
                <span className="truncate">
                  {form.shipper_name
                    ? `${form.shipper_code ? `${form.shipper_code} - ` : ""}${form.shipper_name}`
                    : form.customer_id
                      ? "เลือกผู้ส่ง"
                      : "เลือกเจ้าของงานก่อน"}
                </span>
              </button>

              <button
                type="button"
                disabled={!form.customer_id || loadingOptions}
                onClick={onOpenShipperModal}
                className={iconButtonClass}
              >
                🔍
              </button>

              <RequiredLabel required className={labelClass}>
                ที่อยู่ผู้ส่ง
              </RequiredLabel>
              <input className={`${inputClass} bg-white`} value={form.shipper_address} readOnly />
              <div />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-[82px_1fr] items-center gap-1.5">
            <label className={labelClass}>Reference</label>
            <input
              className={inputClass}
              value={form.reference_no}
              onChange={(e) => updateForm("reference_no", e.target.value)}
              placeholder="Reference"
            />

            <label className={labelClass}>วันที่ส่ง</label>
            <div className={datePickerWrapClass}>
              <DatePicker
                variant="compact"
                value={form.delivery_date}
                onChange={(value) => updateForm("delivery_date", value)}
                placeholder="วันที่ส่ง"
              />
            </div>
          </div>

          <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-1.5">
            <div className="grid grid-cols-[82px_1fr_36px] items-center gap-1.5">
              <RequiredLabel required className={labelClass}>
                ผู้รับ
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

              <button
                type="button"
                disabled={!form.customer_id || loadingOptions}
                onClick={onOpenRecipientModal}
                className={iconButtonClass}
              >
                🔍
              </button>

              <RequiredLabel required className={labelClass}>
                ที่อยู่ผู้รับ
              </RequiredLabel>
              <input className={`${inputClass} bg-white`} value={form.address} readOnly />
              <div />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-[92px_1fr] items-center gap-1.5">
            <label className={labelClass}>ประเภทการจ่าย</label>
            <select
              className={selectClass}
              value={form.payment_type_id}
              onChange={(e) => updateForm("payment_type_id", e.target.value)}
            >
              <option value="">เลือก</option>
              {payments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <label className={labelClass}>หมายเหตุ</label>
            <input className={inputClass} value={form.remark} onChange={(e) => updateForm("remark", e.target.value)} />
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-1.5">
            <div className="grid grid-cols-[92px_1fr] items-center gap-1.5">
              <label className={labelClass}>COD</label>
              <div className="grid grid-cols-[18px_1fr] items-center gap-1.5">
                <input
                  type="checkbox"
                  className={checkboxInputClass}
                  checked={form.is_cod === "Y"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_cod: e.target.checked ? "Y" : "N",
                      cod: e.target.checked ? prev.cod : "",
                    }))
                  }
                />

                <input
                  className={form.is_cod === "Y" ? inputClass : disabledInputClass}
                  type="number"
                  value={form.cod}
                  disabled={form.is_cod !== "Y"}
                  onChange={(e) => updateForm("cod", e.target.value)}
                  placeholder="ยอด COD"
                />
              </div>

              <label className={labelClass}>เอกสารส่งกลับ</label>
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

                <input
                  className={form.is_document_return === "Y" ? inputClass : disabledInputClass}
                  value={form.document_return}
                  disabled={form.is_document_return !== "Y"}
                  onChange={(e) => updateForm("document_return", e.target.value)}
                  placeholder="รายละเอียด"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-1.5 lg:grid-cols-[48px_190px_48px_190px_48px_160px_92px_110px_62px_145px]">
        <RequiredLabel required className={labelClass}>
          ตำบล
        </RequiredLabel>
        <input className={readOnlyInputClass} value={form.subdistrict_name} readOnly />

        <RequiredLabel required className={labelClass}>
          อำเภอ
        </RequiredLabel>
        <input className={readOnlyInputClass} value={form.district_name} readOnly />

        <RequiredLabel required className={labelClass}>
          จังหวัด
        </RequiredLabel>
        <input className={readOnlyInputClass} value={form.province_name} readOnly />

        <RequiredLabel required className={labelClass}>
          รหัสไปรษณีย์
        </RequiredLabel>
        <input className={readOnlyInputClass} value={form.zip_code} readOnly />

        <RequiredLabel required className={labelClass}>
          เบอร์โทร
        </RequiredLabel>
        <input className={readOnlyInputClass} value={form.tel} readOnly />
      </div>
    </div>
  );
}