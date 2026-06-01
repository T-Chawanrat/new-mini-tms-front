import { Fragment, useEffect, useMemo, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import {
  type CustomerOption,
  type GroupedRecipient,
  type PackageRow,
  type RecipientOption,
  type ShipperOption,
  type UpdatePackageForm,
  inputClass,
  labelClass,
  selectClass,
} from "./createReceiveConfig";

type ReceiveModalsProps = {
  showCustomerModal: boolean;
  showShipperModal: boolean;
  showRecipientModal: boolean;
  showPackageModal: boolean;
  showScanModal: boolean;

  customers: CustomerOption[];
  shippers: ShipperOption[];
  groupedRecipients: GroupedRecipient[];

  customerSearch: string;
  shipperSearch: string;
  recipientSearch: string;

  packageForm: PackageRow;
  scanBarcode: string;

  expandedRecipientIds: Record<string, boolean>;

  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  setShipperSearch: React.Dispatch<React.SetStateAction<string>>;
  setRecipientSearch: React.Dispatch<React.SetStateAction<string>>;
  setExpandedRecipientIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setScanBarcode: React.Dispatch<React.SetStateAction<string>>;

  updatePackageForm: UpdatePackageForm;

  selectCustomer: (selected: CustomerOption) => void;
  selectShipper: (selected: ShipperOption) => void;
  selectRecipient: (selected: RecipientOption) => void;

  closeCustomerModal: () => void;
  closeShipperModal: () => void;
  closeRecipientModal: () => void;
  closePackageModal: () => void;
  closeScanModal: () => void;

  handleSavePackage: () => void;
  handleSaveScan: () => void;
};

const paginationSx = {
  borderTop: "1px solid #e2e8f0",
  minHeight: 42,
  "& .MuiTablePagination-toolbar": {
    minHeight: 42,
    paddingLeft: "8px",
    paddingRight: "8px",
    fontSize: 12,
  },
  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
    margin: 0,
    fontSize: 12,
  },
  "& .MuiTablePagination-actions": {
    marginLeft: "8px",
  },
};

export default function ReceiveModals({
  showCustomerModal,
  showShipperModal,
  showRecipientModal,
  showPackageModal,
  showScanModal,

  customers,
  shippers,
  groupedRecipients,

  customerSearch,
  shipperSearch,
  recipientSearch,

  packageForm,
  scanBarcode,

  expandedRecipientIds,

  setCustomerSearch,
  setShipperSearch,
  setRecipientSearch,
  setExpandedRecipientIds,
  setScanBarcode,

  updatePackageForm,

  selectCustomer,
  selectShipper,
  selectRecipient,

  closeCustomerModal,
  closeShipperModal,
  closeRecipientModal,
  closePackageModal,
  closeScanModal,

  handleSavePackage,
  handleSaveScan,
}: ReceiveModalsProps) {
  const [shipperPage, setShipperPage] = useState(0);
  const [shipperRowsPerPage, setShipperRowsPerPage] = useState(100);

  const [recipientPage, setRecipientPage] = useState(0);
  const [recipientRowsPerPage, setRecipientRowsPerPage] = useState(100);

  const pagedShippers = useMemo(() => {
    const start = shipperPage * shipperRowsPerPage;
    return shippers.slice(start, start + shipperRowsPerPage);
  }, [shippers, shipperPage, shipperRowsPerPage]);

  const pagedGroupedRecipients = useMemo(() => {
    const start = recipientPage * recipientRowsPerPage;
    return groupedRecipients.slice(start, start + recipientRowsPerPage);
  }, [groupedRecipients, recipientPage, recipientRowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(shippers.length / shipperRowsPerPage) - 1, 0);

    if (shipperPage > maxPage) {
      setShipperPage(maxPage);
    }
  }, [shippers.length, shipperPage, shipperRowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(groupedRecipients.length / recipientRowsPerPage) - 1, 0);

    if (recipientPage > maxPage) {
      setRecipientPage(maxPage);
    }
  }, [groupedRecipients.length, recipientPage, recipientRowsPerPage]);

  return (
    <>
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeCustomerModal}>
          <div className="w-full max-w-[560px] rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">ข้อมูลเจ้าของงาน</h3>

            <div className="mb-2 grid grid-cols-[70px_1fr] items-center gap-2">
              <label className={labelClass}>ค้นหา</label>
              <input className={inputClass} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} autoFocus />
            </div>

            <div className="max-h-[560px] overflow-y-auto border border-slate-300">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">เจ้าของงาน</th>
                    <th className="w-[80px] border-b border-slate-300 px-2 py-1.5" />
                  </tr>
                </thead>

                <tbody>
                  {customers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100">
                      <td className="border-b border-slate-200 px-2 py-1.5">
                        <div className="font-medium text-slate-700">
                          {item.code} - {item.name}
                        </div>
                      </td>

                      <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => selectCustomer(item)}
                          className="rounded bg-green-700 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-green-800"
                        >
                          ✓เลือก
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!customers.length && (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-xs text-slate-400">
                        ไม่พบข้อมูลเจ้าของงาน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={closeCustomerModal}
                className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showShipperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeShipperModal}>
          <div className="w-full max-w-[460px] rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">ข้อมูลผู้ส่ง</h3>

            <div className="mb-2 grid grid-cols-[70px_1fr] items-center gap-2">
              <label className={labelClass}>ค้นหา</label>
              <input
                className={inputClass}
                value={shipperSearch}
                onChange={(e) => {
                  setShipperSearch(e.target.value);
                  setShipperPage(0);
                }}
                autoFocus
              />
            </div>

            <div className="border border-slate-300">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">ชื่อผู้ส่ง</th>
                      <th className="w-[80px] border-b border-slate-300 px-2 py-1.5" />
                    </tr>
                  </thead>

                  <tbody>
                    {pagedShippers.map((item) => (
                      <tr key={item.shipper_id} className="hover:bg-slate-100">
                        <td className="border-b border-slate-200 px-2 py-1.5">
                          <div className="font-medium text-slate-700">
                            {item.shipper_code} - {item.shipper_name}
                          </div>
                          <div className="text-[10px] text-slate-500">{item.address || "-"}</div>
                        </td>

                        <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => selectShipper(item)}
                            className="rounded bg-green-700 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-green-800"
                          >
                            ✓เลือก
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!pagedShippers.length && (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-xs text-slate-400">
                          ไม่พบข้อมูลผู้ส่ง
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <TablePagination
                component="div"
                count={shippers.length}
                page={shipperPage}
                onPageChange={(_, newPage) => setShipperPage(newPage)}
                rowsPerPage={shipperRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setShipperRowsPerPage(Number(e.target.value));
                  setShipperPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                sx={paginationSx}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={closeShipperModal}
                className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeRecipientModal}>
          <div className="w-full max-w-[920px] rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">ข้อมูลผู้รับ</h3>

            <div className="mb-2 grid grid-cols-[70px_1fr] items-center gap-2">
              <label className={labelClass}>ค้นหา</label>
              <input
                className={inputClass}
                value={recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value);
                  setRecipientPage(0);
                }}
                autoFocus
              />
            </div>

            <div className="border border-slate-300">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="w-9 border-b border-slate-300 px-1.5 py-1.5" />
                      <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">ชื่อผู้รับ</th>
                      <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">ที่อยู่ผู้รับ</th>
                      <th className="w-[80px] border-b border-slate-300 px-2 py-1.5" />
                    </tr>
                  </thead>

                  <tbody>
                    {pagedGroupedRecipients.map(({ recipient_id, recipient, details }) => {
                      const isOpen = !!expandedRecipientIds[String(recipient_id)];
                      const firstDetail = details[0];

                      return (
                        <Fragment key={recipient_id}>
                          <tr className="hover:bg-slate-100">
                            <td className="border-b border-slate-200 px-1.5 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRecipientIds((prev) => ({
                                    ...prev,
                                    [String(recipient_id)]: !prev[String(recipient_id)],
                                  }))
                                }
                                className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white"
                              >
                                {isOpen ? "⌄" : "›"}
                              </button>
                            </td>

                            <td className="border-b border-slate-200 px-2 py-1.5">
                              <div className="font-medium text-slate-700">
                                {recipient.recipient_code} - {recipient.recipient_name}
                              </div>
                            </td>

                            <td className="border-b border-slate-200 px-2 py-1.5 text-[11px] text-slate-600">{firstDetail?.address || "-"}</td>

                            <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                              {firstDetail?.recipient_detail_id && (
                                <button
                                  type="button"
                                  onClick={() => selectRecipient(firstDetail)}
                                  className="rounded bg-green-700 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-green-800"
                                >
                                  ✓เลือก
                                </button>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr>
                              <td />
                              <td colSpan={3} className="border-b border-slate-300 bg-slate-50 p-0">
                                <table className="w-full border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-white">
                                      <th className="border-b border-slate-200 px-2 py-1.5 text-left">ชื่อผู้รับ</th>
                                      <th className="border-b border-slate-200 px-2 py-1.5 text-left">ที่อยู่</th>
                                      <th className="w-[80px] border-b border-slate-200 px-2 py-1.5" />
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {details.map((detail) => (
                                      <tr key={detail.recipient_detail_id}>
                                        <td className="border-b border-slate-200 px-2 py-1.5">
                                          {detail.recipient_detail_name || detail.recipient_name}
                                        </td>

                                        <td className="border-b border-slate-200 px-2 py-1.5">
                                          {[detail.address, detail.subdistrict_name, detail.district_name, detail.province_name, detail.zip_code]
                                            .filter(Boolean)
                                            .join(" ")}
                                        </td>

                                        <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                                          <button
                                            type="button"
                                            onClick={() => selectRecipient(detail)}
                                            className="rounded border border-blue-500 bg-white px-3 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                          >
                                            ✓เลือก
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {!pagedGroupedRecipients.length && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                          ไม่พบข้อมูลผู้รับ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <TablePagination
                component="div"
                count={groupedRecipients.length}
                page={recipientPage}
                onPageChange={(_, newPage) => setRecipientPage(newPage)}
                rowsPerPage={recipientRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRecipientRowsPerPage(Number(e.target.value));
                  setRecipientPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                sx={paginationSx}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={closeRecipientModal}
                className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closePackageModal}>
          <div className="w-full max-w-5xl rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">เพิ่มรายการสินค้า</h3>

              <button type="button" onClick={closePackageModal} className="text-xl leading-none text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[115px_1fr_36px] items-center gap-2">
                <label className="text-[11px] font-medium text-slate-700">ชื่อสินค้า</label>
                <input
                  className={inputClass}
                  value={packageForm.package_name}
                  onChange={(e) => updatePackageForm("package_name", e.target.value)}
                  placeholder="ค้นหา"
                />
                <button className="flex h-9 items-center justify-center text-slate-500" type="button">
                  🔍
                </button>

                <label className="text-[11px] font-medium text-slate-700">ขนาดสินค้า</label>
                <select
                  className={selectClass}
                  value={packageForm.package_size_name}
                  onChange={(e) => updatePackageForm("package_size_name", e.target.value)}
                >
                  <option value="">เลือกขนาดสินค้า</option>
                  <option value="BOX-S">BOX-S</option>
                  <option value="BOX-M">BOX-M</option>
                  <option value="BOX-L">BOX-L</option>
                </select>
                <div />

                <label className="text-[11px] font-medium text-slate-700">กว้างยาวสูง (ซม.)</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    className={inputClass}
                    placeholder="กว้าง"
                    value={packageForm.width}
                    onChange={(e) => updatePackageForm("width", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="ยาว"
                    value={packageForm.length}
                    onChange={(e) => updatePackageForm("length", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="สูง"
                    value={packageForm.height}
                    onChange={(e) => updatePackageForm("height", e.target.value)}
                  />
                  <input className={inputClass} placeholder="Q" value={packageForm.q} onChange={(e) => updatePackageForm("q", e.target.value)} />
                </div>
                <div />

                <label className="text-[11px] font-medium text-slate-700">น้ำหนัก</label>
                <input
                  className={inputClass}
                  placeholder="น้ำหนัก(กรัม)"
                  value={packageForm.weight}
                  onChange={(e) => updatePackageForm("weight", e.target.value)}
                />
                <div />

                <label className="text-[11px] font-medium text-slate-700">จำนวนรายการ</label>
                <input className={inputClass} type="number" value={packageForm.qty} onChange={(e) => updatePackageForm("qty", e.target.value)} />
                <div />

                <div />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSavePackage}
                className="rounded bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeScanModal}>
          <div className="w-full max-w-5xl rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-normal text-slate-900">Scan</h3>

              <button type="button" onClick={closeScanModal} className="text-xl leading-none text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[115px_1fr_36px] items-center gap-2">
                <label className="text-[11px] font-medium text-slate-700">ชื่อสินค้า</label>
                <input
                  className={inputClass}
                  value={packageForm.package_name}
                  onChange={(e) => updatePackageForm("package_name", e.target.value)}
                  placeholder="ค้นหา"
                />
                <button className="flex h-9 items-center justify-center text-slate-500" type="button">
                  🔍
                </button>

                <label className="text-[11px] font-medium text-slate-700">ขนาดสินค้า</label>
                <select
                  className={selectClass}
                  value={packageForm.package_size_name}
                  onChange={(e) => updatePackageForm("package_size_name", e.target.value)}
                >
                  <option value="">เลือกขนาดสินค้า</option>
                  <option value="BOX-S">BOX-S</option>
                  <option value="BOX-M">BOX-M</option>
                  <option value="BOX-L">BOX-L</option>
                </select>
                <div />

                <label className="text-[11px] font-medium text-slate-700">กว้างยาวสูง (ซม.)</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    className={inputClass}
                    placeholder="กว้าง"
                    value={packageForm.width}
                    onChange={(e) => updatePackageForm("width", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="ยาว"
                    value={packageForm.length}
                    onChange={(e) => updatePackageForm("length", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="สูง"
                    value={packageForm.height}
                    onChange={(e) => updatePackageForm("height", e.target.value)}
                  />
                  <input className={inputClass} placeholder="Q" value={packageForm.q} onChange={(e) => updatePackageForm("q", e.target.value)} />
                </div>
                <div />

                <label className="text-[11px] font-medium text-slate-700">น้ำหนัก</label>
                <input
                  className={inputClass}
                  placeholder="น้ำหนัก(กรัม)"
                  value={packageForm.weight}
                  onChange={(e) => updatePackageForm("weight", e.target.value)}
                />
                <div />

                <label className="text-[11px] font-medium text-slate-700">กรุณาแสกนบาร์โค้ด</label>
                <input
                  className={inputClass}
                  value={scanBarcode}
                  autoFocus
                  onChange={(e) => setScanBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveScan();
                    }
                  }}
                />
                <div />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveScan}
                className="rounded bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}