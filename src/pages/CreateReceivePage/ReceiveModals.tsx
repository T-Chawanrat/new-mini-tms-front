import { Fragment, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import axios from "axios";
import TablePagination from "@mui/material/TablePagination";
import AxiosInstance from "../../utils/AxiosInstance";
import {
  type CustomerOption,
  type GroupedPackageOption,
  type GroupedRecipient,
  type PackageOption,
  type PackageRow,
  type RecipientOption,
  type ShipperOption,
  type UpdatePackageForm,
  inputClass,
  labelClass,
  selectClass,
} from "./createReceiveConfig";

type ReceiveModalsProps = {
  customerId: string;

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

  setCustomerSearch: Dispatch<SetStateAction<string>>;
  setShipperSearch: Dispatch<SetStateAction<string>>;
  setRecipientSearch: Dispatch<SetStateAction<string>>;
  setExpandedRecipientIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setScanBarcode: Dispatch<SetStateAction<string>>;

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
  customerId,

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

  const [showPackageSelectModal, setShowPackageSelectModal] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [packageError, setPackageError] = useState<string | null>(null);

  const pagedShippers = useMemo(() => {
    const start = shipperPage * shipperRowsPerPage;
    return shippers.slice(start, start + shipperRowsPerPage);
  }, [shippers, shipperPage, shipperRowsPerPage]);

  const pagedGroupedRecipients = useMemo(() => {
    const start = recipientPage * recipientRowsPerPage;
    return groupedRecipients.slice(start, start + recipientRowsPerPage);
  }, [groupedRecipients, recipientPage, recipientRowsPerPage]);

  const packageGroups = useMemo<GroupedPackageOption[]>(() => {
    const map = new Map<string, GroupedPackageOption>();

    packageOptions.forEach((item) => {
      const packageId = String(item.package_id || "");
      if (!packageId) return;

      if (!map.has(packageId)) {
        map.set(packageId, {
          package_id: packageId,
          package_code: item.package_code || "",
          package_name: item.package_name || "",
          type: item.type || "",
          details: [],
        });
      }

      if (item.package_detail_id) {
        map.get(packageId)?.details.push(item);
      }
    });

    return Array.from(map.values());
  }, [packageOptions]);

  const selectedPackageDetails = useMemo(() => {
    if (!packageForm.package_id) return [];

    return packageGroups.find((item) => item.package_id === packageForm.package_id)?.details || [];
  }, [packageGroups, packageForm.package_id]);

  const loadPackages = async (keyword = "") => {
    if (!customerId) {
      setPackageOptions([]);
      setPackageError("กรุณาเลือกเจ้าของงานก่อน");
      return;
    }

    setPackageError(null);

    try {
      const res = await AxiosInstance.get(`/receives/options/packages/${customerId}`, {
        params: keyword.trim() ? { search: keyword.trim() } : undefined,
      });

      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

      setPackageOptions(data);
    } catch (err) {
      console.error("LOAD PACKAGES ERROR:", err);

      if (axios.isAxiosError(err)) {
        setPackageError(err.response?.data?.message || "โหลดข้อมูลสินค้าไม่สำเร็จ");
      } else if (err instanceof Error) {
        setPackageError(err.message);
      } else {
        setPackageError("โหลดข้อมูลสินค้าไม่สำเร็จ");
      }
    }
  };

  const openPackageSelectModal = () => {
    if (!customerId) {
      setPackageError("กรุณาเลือกเจ้าของงานก่อน");
      return;
    }

    setPackageSearch("");
    setPackageError(null);
    setShowPackageSelectModal(true);
    loadPackages("");
  };

  const closePackageSelectModal = () => {
    setShowPackageSelectModal(false);
    setPackageSearch("");
    setPackageError(null);
  };

  const selectPackage = (selected: GroupedPackageOption) => {
    updatePackageForm("package_id", selected.package_id);
    updatePackageForm("package_code", selected.package_code || "");
    updatePackageForm("package_name", selected.package_name || "");

    updatePackageForm("package_detail_id", "");
    updatePackageForm("package_detail_code", "");
    updatePackageForm("package_detail_type", "");
    updatePackageForm("package_size_name", "");

    updatePackageForm("width", "");
    updatePackageForm("length", "");
    updatePackageForm("height", "");
    updatePackageForm("q", "");
    updatePackageForm("weight", "");
    updatePackageForm("unit_price", "0");

    closePackageSelectModal();
  };

  const selectPackageDetail = (detailId: string) => {
    if (!detailId) {
      updatePackageForm("package_detail_id", "");
      updatePackageForm("package_detail_code", "");
      updatePackageForm("package_detail_type", "");
      updatePackageForm("package_size_name", "");

      updatePackageForm("width", "");
      updatePackageForm("length", "");
      updatePackageForm("height", "");
      updatePackageForm("q", "");
      updatePackageForm("weight", "");
      updatePackageForm("unit_price", "0");
      return;
    }

    const detail = selectedPackageDetails.find((item) => String(item.package_detail_id) === detailId);
    if (!detail) return;

    updatePackageForm("package_detail_id", detail.package_detail_id != null ? String(detail.package_detail_id) : "");
    updatePackageForm("package_detail_code", detail.package_detail_code || "");
    updatePackageForm("package_detail_type", detail.package_detail_type || "");
    updatePackageForm("package_size_name", detail.package_detail_name || "");

    updatePackageForm("width", "");
    updatePackageForm("length", "");
    updatePackageForm("height", "");

    updatePackageForm("q", detail.size_max != null ? String(detail.size_max) : "");
    updatePackageForm("weight", detail.weight_max != null ? String(detail.weight_max) : "");
    updatePackageForm("unit_price", detail.cost != null ? String(detail.cost) : "0");
  };

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

  useEffect(() => {
    if (!showPackageModal && !showScanModal) return;

    setShowPackageSelectModal(false);
    setPackageSearch("");
    setPackageError(null);
  }, [showPackageModal, showScanModal]);

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
                      <th className="w-[180px] min-w-[180px] border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">รหัสผู้รับ</th>
                      <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">ชื่อผู้รับ</th>
                      <th className="w-[150px] border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">รายละเอียด</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedGroupedRecipients.map(({ recipient_id, recipient, details }) => {
                      const isOpen = !!expandedRecipientIds[String(recipient_id)];

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

                            <td className="w-[180px] min-w-[180px] border-b border-slate-200 px-2 py-1.5">
                              <div className="whitespace-nowrap font-medium text-slate-700">{recipient.recipient_code || "-"}</div>
                            </td>

                            <td className="border-b border-slate-200 px-2 py-1.5">
                              <div className="font-medium text-slate-700">{recipient.recipient_name || "-"}</div>
                            </td>
                            <td className="border-b border-slate-200 px-2 py-1.5">
                              {details.length ? (
                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                  {details.length} รายการ
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-400">
                                  ไม่มีรายละเอียด
                                </span>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr>
                              <td />
                              <td colSpan={3} className="border-b border-slate-300 bg-slate-50 p-0">
                                <div className="max-h-[360px] overflow-y-auto">
                                  <table className="w-full border-collapse text-[11px]">
                                    <thead className="sticky top-0 z-10 bg-white">
                                      <tr>
                                        <th className="border-b border-slate-200 px-2 py-1.5 text-left">ชื่อผู้รับ</th>
                                        <th className="border-b border-slate-200 px-2 py-1.5 text-left">ที่อยู่</th>
                                        <th className="w-[80px] border-b border-slate-200 px-2 py-1.5" />
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {details.map((detail, index) => (
                                        <tr key={`${detail.recipient_id}-${detail.recipient_detail_id || index}`}>
                                          <td className="border-b border-slate-200 px-2 py-1.5">
                                            {detail.recipient_detail_name || detail.recipient_name || "-"}
                                          </td>

                                          <td className="border-b border-slate-200 px-2 py-1.5">
                                            {[detail.address, detail.subdistrict_name, detail.district_name, detail.province_name, detail.zip_code]
                                              .filter(Boolean)
                                              .join(" ") || "-"}
                                          </td>

                                          <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                                            <button
                                              type="button"
                                              onClick={() => selectRecipient(detail)}
                                              className="rounded bg-green-700 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-green-800"
                                            >
                                              ✓เลือก
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
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
          <div className="w-full max-w-[680px] rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">เพิ่มรายการสินค้า</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">เลือกสินค้า รายละเอียดแพ็กเกจ แล้วระบุจำนวนรายการ</p>
              </div>

              <button type="button" onClick={closePackageModal} className="text-xl leading-none text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="space-y-3">
              {packageError && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{packageError}</div>}

              <div className="rounded-md border border-slate-200 bg-white p-2.5">
                <div className="space-y-2">
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2">
                    <label className="text-[11px] font-medium text-slate-700">ชื่อสินค้า</label>
                    <input
                      className={`${inputClass} cursor-pointer bg-white`}
                      value={packageForm.package_name}
                      readOnly
                      placeholder="ค้นหาสินค้า"
                      onClick={openPackageSelectModal}
                    />
                  </div>

                  <div className="grid grid-cols-[96px_1fr] items-center gap-2">
                    <label className="text-[11px] font-medium text-slate-700">รายละเอียด</label>
                    <select
                      className={selectClass}
                      value={packageForm.package_detail_id}
                      onChange={(e) => selectPackageDetail(e.target.value)}
                      disabled={!packageForm.package_id}
                    >
                      <option value="">เลือกรายละเอียดแพ็กเกจ</option>
                      {selectedPackageDetails.map((item) => (
                        <option key={String(item.package_detail_id)} value={String(item.package_detail_id)}>
                          {item.package_detail_name || "-"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-700">ข้อมูลขนาด / ราคา</div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">กว้าง (ซม.)</label>
                    <input className={`${inputClass} bg-white text-center`} value={packageForm.width} readOnly />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">ยาว (ซม.)</label>
                    <input className={`${inputClass} bg-white text-center`} value={packageForm.length} readOnly />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">สูง (ซม.)</label>
                    <input className={`${inputClass} bg-white text-center`} value={packageForm.height} readOnly />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">Q (ลบ.ซม.)</label>
                    <input className={`${inputClass} bg-white text-center`} value={packageForm.q} readOnly />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">น้ำหนัก (ก.ก.)</label>
                    <input className={`${inputClass} bg-white text-center`} value={packageForm.weight} readOnly />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">ราคา</label>
                    <input className={`${inputClass} bg-white text-right`} value={packageForm.unit_price} readOnly />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-2.5">
                <div className="grid grid-cols-[96px_120px] items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-700">จำนวนรายการ</label>
                  <input className={inputClass} type="number" value={packageForm.qty} onChange={(e) => updatePackageForm("qty", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
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

      {showPackageSelectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" onClick={closePackageSelectModal}>
          <div className="w-full max-w-lg rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">ข้อมูลสินค้า</h3>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                ทั้งหมด {packageGroups.length} รายการ
              </span>
            </div>

            <div className="mb-2 grid grid-cols-[70px_1fr] items-center gap-2">
              <label className={labelClass}>ค้นหา</label>
              <input
                className={inputClass}
                value={packageSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setPackageSearch(value);
                  loadPackages(value);
                }}
                autoFocus
                placeholder="ค้นหาชื่อสินค้า / รหัสสินค้า"
              />
            </div>

            {packageError && <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{packageError}</div>}

            <div className="max-h-[560px] overflow-y-auto border border-slate-300">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-300 px-2 py-1.5 text-left text-[11px]">ชื่อสินค้า</th>
                    <th className="w-[80px] border-b border-slate-300 px-2 py-1.5" />
                  </tr>
                </thead>

                <tbody>
                  {packageGroups.map((item) => (
                    <tr key={item.package_id} className="hover:bg-slate-100">
                      <td className="border-b border-slate-200 px-2 py-1.5">
                        <div className="font-medium text-slate-700">
                          {item.package_code ? `${item.package_code} - ${item.package_name}` : item.package_name}
                        </div>
                        <div className="text-[10px] text-slate-500">{item.details.length ? `มี ${item.details.length} detail` : "ไม่มี detail"}</div>
                      </td>

                      <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => selectPackage(item)}
                          className="rounded bg-green-700 px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-green-800"
                        >
                          ✓เลือก
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!packageGroups.length && (
                    <tr>
                      <td colSpan={2} className="py-6 text-center text-xs text-slate-400">
                        ไม่พบข้อมูลสินค้า
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={closePackageSelectModal}
                className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeScanModal}>
          <div className="w-full max-w-[720px] rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Scan</h3>

              <button type="button" onClick={closeScanModal} className="text-xl leading-none text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="space-y-3">
              {packageError && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{packageError}</div>}

              <div className="space-y-2">
                <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-700">ชื่อสินค้า</label>
                  <input className={inputClass} value={packageForm.package_name} readOnly placeholder="ค้นหา" onClick={openPackageSelectModal} />
                </div>

                <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-700">รายละเอียดแพ็กเกจ</label>
                  <select
                    className={selectClass}
                    value={packageForm.package_detail_id}
                    onChange={(e) => selectPackageDetail(e.target.value)}
                    disabled={!packageForm.package_id}
                  >
                    <option value="">เลือกรายละเอียดแพ็กเกจ</option>
                    {selectedPackageDetails.map((item) => (
                      <option key={String(item.package_detail_id)} value={String(item.package_detail_id)}>
                        {item.package_detail_name || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4 grid grid-cols-[42px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">กว้าง (ซม.)</label>
                    <input className={inputClass} value={packageForm.width} readOnly />
                  </div>

                  <div className="col-span-4 grid grid-cols-[32px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">ยาว (ซม.)</label>
                    <input className={inputClass} value={packageForm.length} readOnly />
                  </div>

                  <div className="col-span-4 grid grid-cols-[32px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">สูง (ซม.)</label>
                    <input className={inputClass} value={packageForm.height} readOnly />
                  </div>

                  <div className="col-span-4 grid grid-cols-[42px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">Q (ลบ.ซม.)</label>
                    <input className={inputClass} placeholder="Q" value={packageForm.q} readOnly />
                  </div>

                  <div className="col-span-4 grid grid-cols-[42px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">น้ำหนัก (ก.ก.)</label>
                    <input className={inputClass} placeholder="น้ำหนัก" value={packageForm.weight} readOnly />
                  </div>

                  <div className="col-span-4 grid grid-cols-[42px_1fr] items-center gap-1.5">
                    <label className="text-[11px] font-medium text-slate-700">ราคา</label>
                    <input className={inputClass} placeholder="ราคา" value={packageForm.unit_price} readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-700">บาร์โค้ด</label>
                  <input
                    className={inputClass}
                    value={scanBarcode}
                    autoFocus
                    placeholder="สแกนหรือกรอกบาร์โค้ด"
                    onChange={(e) => setScanBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveScan();
                      }
                    }}
                  />
                </div>
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
