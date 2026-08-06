import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import alertSound from "../../assets/sounds/alert.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber, normalizeSerialText } from "../utils/textSanitizer";

type VehicleLoadRow = {
  serial_id: string;
  serial_no: string;
  warehouse_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};

type VehicleLoadResponse = {
  success?: boolean;
  data: VehicleLoadRow[];
  loaded?: VehicleLoadRow[];
  total?: number;
};

type TruckLoadDetail = {
  truck_load_id: number;
  truck_code: string;
  warehouse_id: number | null;
  user_truck_id: number | null;
  vehicle_id: number | null;
  to_warehouse_id: number | null;
  employee_code: string | null;
  driver_name: string | null;
  license_plate: string | null;
  license_province: string | null;
  model: string | null;
  to_warehouse_name: string | null;
  is_close: string | null;
  is_go: string | null;
};

type WarehouseOption = {
  id: number | string;
  name: string;
};

type TruckLoadDetailResponse = {
  success?: boolean;
  data: TruckLoadDetail;
};

type DestinationWarning = {
  serial_id: string;
  serial_no: string;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};

type LoadProductError = {
  response?: {
    data?: {
      code?: string;
      message?: string;
      data?: DestinationWarning;
    };
  };
};

export default function TruckloadReceivePage() {
  const { truckLoadId } = useParams<{ truckLoadId: string }>();
  const navigate = useNavigate();

  const loadInputRef = useRef<HTMLInputElement | null>(null);

  const removeInputRef = useRef<HTMLInputElement | null>(null);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  const [truckLoad, setTruckLoad] = useState<TruckLoadDetail | null>(null);

  const [warehouseFilter, setWarehouseFilter] = useState("");

  const [fromWarehouseFilter, setFromWarehouseFilter] = useState("");
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);

  const [selectedDriverEmployeeCode, setSelectedDriverEmployeeCode] = useState("");

  const [selectedVehicleLicensePlate, setSelectedVehicleLicensePlate] = useState("");

  const [loadSerialInput, setLoadSerialInput] = useState("");

  const [removeSerialInput, setRemoveSerialInput] = useState("");

  const [activeScanSide, setActiveScanSide] = useState<"load" | "remove">("load");

  const [pendingRows, setPendingRows] = useState<VehicleLoadRow[]>([]);

  const [scannedRows, setScannedRows] = useState<VehicleLoadRow[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState<string | null>(null);

  const [destinationWarning, setDestinationWarning] = useState<DestinationWarning | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    successAudioRef.current = new Audio(successSound);

    errorAudioRef.current = new Audio(errorSound);
    alertAudioRef.current = new Audio(alertSound);

    successAudioRef.current.preload = "auto";
    errorAudioRef.current.preload = "auto";
    alertAudioRef.current.preload = "auto";

    return () => {
      successAudioRef.current?.pause();
      errorAudioRef.current?.pause();
      alertAudioRef.current?.pause();

      successAudioRef.current = null;
      errorAudioRef.current = null;
      alertAudioRef.current = null;
    };
  }, []);

  const playSound = useCallback((type: "success" | "error" | "alert") => {
    const audio = type === "success" ? successAudioRef.current : type === "alert" ? alertAudioRef.current : errorAudioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    void audio.play().catch((playError) => {
      console.warn(`unable to play ${type} sound:`, playError);
    });
  }, []);

  const focusLoadInput = useCallback(() => {
    window.setTimeout(() => {
      loadInputRef.current?.focus();
    }, 0);
  }, []);

  const focusRemoveInput = useCallback(() => {
    window.setTimeout(() => {
      removeInputRef.current?.focus();
    }, 0);
  }, []);

  const fetchTruckLoad = useCallback(async () => {
    if (!truckLoadId) {
      setTruckLoad(null);
      setError("กรุณาเข้าสู่หน้านี้จากรายการใบปิดบรรทุก");
      return;
    }

    try {
      setLoadingOptions(true);

      const response = await AxiosInstance.get<TruckLoadDetailResponse>(`/truck-loads/get-truck/${truckLoadId}`);

      const row = response.data?.data;

      setTruckLoad(row);
      setSelectedDriverEmployeeCode(row?.employee_code || row?.driver_name || "");
      setSelectedVehicleLicensePlate(row?.license_plate || "");
      setWarehouseFilter(row?.to_warehouse_id ? String(row.to_warehouse_id) : "");
      setFromWarehouseFilter(row?.warehouse_id ? String(row.warehouse_id) : "");
    } catch (err) {
      console.error("fetch vehicle load options error:", err);

      setTruckLoad(null);

      setError("ไม่สามารถโหลดข้อมูลตัวเลือกได้");
    } finally {
      setLoadingOptions(false);
    }
  }, [truckLoadId]);

  const fetchSerials = useCallback(async () => {
    if (!truckLoadId) {
      setPendingRows([]);
      setScannedRows([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const response = await AxiosInstance.get<VehicleLoadResponse>(`/truck-loads/${truckLoadId}/products`);

      const rows = Array.isArray(response.data?.data) ? response.data.data : [];

      setPendingRows(rows);
      setScannedRows(Array.isArray(response.data?.loaded) ? response.data.loaded : []);
      setLoadSerialInput("");
      setRemoveSerialInput("");
    } catch (err) {
      console.error("fetch vehicle load serials error:", err);

      setPendingRows([]);
      setScannedRows([]);

      setError("ไม่สามารถโหลดรายการ Serial No ได้");
    } finally {
      setLoading(false);
      focusLoadInput();
    }
  }, [truckLoadId, focusLoadInput]);

  useEffect(() => {
    void fetchTruckLoad();
  }, [fetchTruckLoad]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await AxiosInstance.get<WarehouseOption[]>("/warehouses");
        setWarehouseOptions(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("fetch warehouse filter options error:", err);
        setWarehouseOptions([]);
      }
    };

    void fetchWarehouses();
  }, []);

  useEffect(() => {
    void fetchSerials();
  }, [fetchSerials]);

  useEffect(() => {
    if (loading || loadingOptions || saving || truckLoad?.is_close === "Y") return;

    if (activeScanSide === "remove" && scannedRows.length > 0) {
      focusRemoveInput();
    } else {
      focusLoadInput();
    }
  }, [activeScanSide, focusLoadInput, focusRemoveInput, loading, loadingOptions, saving, scannedRows.length, truckLoad?.is_close]);

  const visiblePendingRows = useMemo(
    () => (fromWarehouseFilter ? pendingRows.filter((row) => String(row.warehouse_id || "") === fromWarehouseFilter) : pendingRows),
    [fromWarehouseFilter, pendingRows],
  );

  const handleLoadScan = async (value?: string) => {
    const rawSerial = (value ?? loadSerialInput).trim();

    const serial = normalizeSerialText(rawSerial);

    if (!serial) {
      focusLoadInput();
      return;
    }

    setError(null);
    setInfo(null);

    const alreadyScanned = scannedRows.some((row) => normalizeSerialText(row.serial_no) === serial);

    if (alreadyScanned) {
      playSound("error");

      setError(`SN ${rawSerial} อยู่ในรายการที่ยิงขึ้นรถแล้ว`);

      setLoadSerialInput("");
      focusLoadInput();

      return;
    }

    const targetRow = pendingRows.find(
      (row) => normalizeSerialText(row.serial_no) === serial && (!fromWarehouseFilter || String(row.warehouse_id || "") === fromWarehouseFilter),
    );

    try {
      setSaving(true);

      await AxiosInstance.post(`/truck-loads/${truckLoadId}/load-product`, {
        serial_id: targetRow?.serial_id,
        serial_no: targetRow?.serial_no || rawSerial,
      });
    } catch (err) {
      console.error("load truck product error:", err);

      const loadError = err as LoadProductError;
      if (loadError.response?.data?.code === "DESTINATION_MISMATCH" && loadError.response.data.data) {
        playSound("alert");
        setDestinationWarning(loadError.response.data.data);
        setLoadSerialInput("");
        focusLoadInput();
        return;
      }

      playSound("error");
      setError(loadError.response?.data?.message || "ไม่สามารถยิงพัสดุขึ้นรถได้");
      setLoadSerialInput("");
      focusLoadInput();
      return;
    } finally {
      setSaving(false);
    }

    playSound("success");

    await fetchSerials();
    setInfo(`ย้าย SN ${targetRow?.serial_no || rawSerial} ไปยังรายการขึ้นรถแล้ว`);

    setLoadSerialInput("");
    focusLoadInput();
  };

  const handleConfirmDestinationMismatch = async () => {
    if (!destinationWarning || !truckLoadId) return;

    try {
      setSaving(true);
      setError(null);
      setInfo(null);

      await AxiosInstance.post(`/truck-loads/${truckLoadId}/load-product`, {
        serial_id: destinationWarning.serial_id,
        serial_no: destinationWarning.serial_no,
        confirm_destination_mismatch: true,
      });

      const confirmedSerialNo = destinationWarning.serial_no;
      setDestinationWarning(null);
      playSound("success");
      await fetchSerials();
      setInfo(`ยืนยันยิง SN ${confirmedSerialNo} ขึ้นรถแล้ว`);
    } catch (err) {
      console.error("confirm destination mismatch error:", err);
      const loadError = err as LoadProductError;
      playSound("error");
      setError(loadError.response?.data?.message || "ไม่สามารถยิงพัสดุขึ้นรถได้");
    } finally {
      setSaving(false);
      focusLoadInput();
    }
  };

  const handleRemoveScan = async (value?: string) => {
    const rawSerial = (value ?? removeSerialInput).trim();

    const serial = normalizeSerialText(rawSerial);

    if (!serial) {
      focusRemoveInput();
      return;
    }

    setError(null);
    setInfo(null);

    const targetIndex = scannedRows.findIndex((row) => normalizeSerialText(row.serial_no) === serial);

    if (targetIndex === -1) {
      playSound("error");

      setError(`ไม่พบ SN ${rawSerial} ในรายการขึ้นรถแล้ว`);

      setRemoveSerialInput("");
      focusRemoveInput();

      return;
    }

    const targetRow = scannedRows[targetIndex];

    try {
      setSaving(true);

      await AxiosInstance.post(`/truck-loads/${truckLoadId}/unload-product`, {
        serial_no: targetRow.serial_no,
      });
    } catch (err) {
      console.error("unload truck product error:", err);
      playSound("error");
      setError("ไม่สามารถนำพัสดุกลับรายการรอยิงได้");
      setRemoveSerialInput("");
      focusRemoveInput();
      return;
    } finally {
      setSaving(false);
    }

    playSound("success");

    setScannedRows((previousRows) => previousRows.filter((_, index) => index !== targetIndex));

    setPendingRows((previousRows) => [targetRow, ...previousRows]);

    setInfo(`นำ SN ${targetRow.serial_no} กลับไปรายการรอยิงแล้ว`);

    setRemoveSerialInput("");
    focusRemoveInput();
  };

  const handleDeleteTruckLoad = async () => {
    if (!truckLoadId) return;

    try {
      setDeleting(true);
      setError(null);
      setInfo(null);

      await AxiosInstance.patch(`/truck-loads/${truckLoadId}/delete`);
      setDeleteConfirmOpen(false);
      navigate("/truck-create", { replace: true });
    } catch (err) {
      console.error("delete truck load error:", err);
      const deleteError = err as LoadProductError;
      setError(deleteError.response?.data?.message || "ไม่สามารถลบใบปิดบรรทุกได้");
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const disabled = loading || loadingOptions || saving || deleting;

  return (
    <div
      className={`flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800 ${disabled ? "cursor-wait" : ""}`}
    >
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">ขนของขึ้นรถ</h1>

          <p className="mt-0.5 text-xs text-slate-500">ยิง Barcode เพื่อตรวจสอบและนำพัสดุขึ้นรถตามใบปิดบรรทุกที่เลือกไว้</p>
        </div>

        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={disabled}
          className="h-9 shrink-0 rounded-md border border-red-300 bg-red-100 px-2.5 text-sm text-red-700 outline-none transition hover:bg-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
        >
          ลบใบปิดบรรทุก
        </button>
      </header>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Now Warehouse</label>
            <select
              value={fromWarehouseFilter}
              onChange={(event) => setFromWarehouseFilter(event.target.value)}
              disabled={disabled}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">ทั้งหมด</option>
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.id} value={String(warehouse.id)}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Driver</label>

            <select
              value={selectedDriverEmployeeCode}
              onChange={(event) => {
                setSelectedDriverEmployeeCode(event.target.value);

                setError(null);
                setInfo(null);
              }}
              disabled
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">เลือกพนักงานขับรถ</option>

              {(truckLoad?.employee_code || truckLoad?.driver_name) && (
                <option value={truckLoad.employee_code || truckLoad.driver_name || ""}>
                  {[truckLoad.employee_code, truckLoad.driver_name].filter(Boolean).join(" - ")}
                </option>
              )}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Vehicle</label>

            <select
              value={selectedVehicleLicensePlate}
              onChange={(event) => {
                setSelectedVehicleLicensePlate(event.target.value);

                setError(null);
                setInfo(null);
              }}
              disabled
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">เลือกรถ</option>

              {truckLoad?.license_plate && (
                <option value={truckLoad.license_plate}>
                  {[truckLoad.license_plate, truckLoad.license_province, truckLoad.model].filter(Boolean).join(" - ")}
                </option>
              )}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">To Warehouse</label>

            <select
              value={warehouseFilter}
              onChange={(event) => {
                setWarehouseFilter(event.target.value);

                setError(null);
                setInfo(null);
              }}
              disabled
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">เลือก To Warehouse</option>

              {truckLoad?.to_warehouse_id && (
                <option value={truckLoad.to_warehouse_id}>{truckLoad.to_warehouse_name || `Warehouse ${truckLoad.to_warehouse_id}`}</option>
              )}
            </select>
          </div>
        </div>

        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงขึ้นรถ</label>

            <input
              ref={loadInputRef}
              type="text"
              value={loadSerialInput}
              onFocus={() => setActiveScanSide("load")}
              onChange={(event) => setLoadSerialInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  handleLoadScan(event.currentTarget.value);
                }
              }}
              disabled={disabled || truckLoad?.is_close === "Y"}
              placeholder={truckLoad?.is_close === "Y" ? "ปิดบรรทุกแล้ว" : "ยิง SN เพื่อย้ายไปฝั่งขวา"}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div className="min-w-0 lg:border-l lg:border-slate-200 lg:pl-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงลบรายการ</label>

            <input
              ref={removeInputRef}
              type="text"
              value={removeSerialInput}
              onFocus={() => setActiveScanSide("remove")}
              onChange={(event) => setRemoveSerialInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  handleRemoveScan(event.currentTarget.value);
                }
              }}
              disabled={disabled || truckLoad?.is_close === "Y" || scannedRows.length === 0}
              placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:border-slate-200 disabled:bg-slate-100"
            />
          </div>
        </div>
      </section>

      {truckLoad?.is_close === "Y" && (
        <div className="mb-3 shrink-0 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
          ปิดบรรทุกแล้ว ไม่สามารถยิงเพิ่มหรือนำรายการออกได้
        </div>
      )}

      {error && <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {info && <div className="mb-3 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      {destinationWarning && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-amber-700">แจ้งเตือนปลายทางไม่ตรงกัน</h3>
            <p className="mt-2 text-sm text-slate-700">ของชิ้นนี้ปลายทางไม่ใช่ DC ที่เลือก ยืนยันจะยิงขึ้นรถใช่หรือไม่</p>
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <div>SN: {destinationWarning.serial_no}</div>
              <div>ปลายทางของพัสดุ: {destinationWarning.to_warehouse_name || destinationWarning.to_warehouse_id || "-"}</div>
              <div>DC ที่เลือก: {truckLoad?.to_warehouse_name || truckLoad?.to_warehouse_id || "-"}</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDestinationWarning(null);
                  focusLoadInput();
                }}
                disabled={saving}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                ไม่
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDestinationMismatch()}
                disabled={saving}
                className="h-9 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
              >
                {saving ? "กำลังบันทึก..." : "ใช่"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-red-700">ยืนยันลบใบปิดบรรทุก</h3>
            <p className="mt-2 text-sm text-slate-700">
              ต้องการลบใบปิดบรรทุก {truckLoad?.truck_code || "นี้"} ใช่หรือไม่
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                ไม่
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteTruckLoad()}
                disabled={deleting}
                className="h-9 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
              >
                {deleting ? "กำลังลบ..." : "ใช่"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการรอยิงขึ้นรถ</span>

            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              {formatThaiNumber(visiblePendingRows.length)} รายการ
            </span>
          </div>

          <SerialTable rows={visiblePendingRows} loading={loading} mode="pending" />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการที่ยิงขึ้นรถแล้ว</span>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {formatThaiNumber(scannedRows.length)} รายการ
            </span>
          </div>

          <SerialTable rows={scannedRows} loading={false} mode="scanned" />
        </section>
      </div>
    </div>
  );
}

type SerialTableProps = {
  rows: VehicleLoadRow[];
  loading: boolean;
  mode: "pending" | "scanned";
};

function SerialTable({ rows, loading, mode }: SerialTableProps) {
  const isScanned = mode === "scanned";

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full table-fixed border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
          <tr>
            <th className="w-[45%] border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>

            <th className="w-[35%] border-b border-slate-200 px-3 py-2 text-left">CUSTOMER</th>

            <th className="w-[20%] border-b border-slate-200 px-3 py-2 text-right">TO WAREHOUSE</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                กำลังโหลดรายการ...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                {isScanned ? "ยังไม่มีรายการที่ยิงขึ้นรถ" : "ไม่มีรายการรอยิงขึ้นรถ"}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={`${mode}-${row.serial_no}-${index}`}
                className={
                  index % 2 === 0
                    ? isScanned
                      ? "bg-white hover:bg-emerald-50/50"
                      : "bg-white hover:bg-blue-50/50"
                    : isScanned
                      ? "bg-slate-50/70 hover:bg-emerald-50/50"
                      : "bg-slate-50/70 hover:bg-blue-50/50"
                }
              >
                <td title={row.serial_no} className="border-b border-slate-100 px-3 py-2">
                  <span
                    className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold ${
                      isScanned ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"
                    }`}
                  >
                    <span className="truncate">{row.serial_no}</span>
                  </span>
                </td>

                <td title={row.customer_name || "-"} className="truncate border-b border-slate-100 px-3 py-2">
                  {row.customer_name || "-"}
                </td>

                <td title={row.to_warehouse_name || "-"} className="truncate border-b border-slate-100 px-3 py-2 text-right">
                  {row.to_warehouse_name || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
