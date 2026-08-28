import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import alertSound from "../../assets/sounds/alert.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import { normalizeSerialText } from "../utils/textSanitizer";

type ProductRow = {
  serial_no: string;
  customer_name: string;
  recipient_name: string;
  now_warehouse_id: number | null;
  to_warehouse_id: number | null;
  route_id: number | null;
};

type RouteOption = {
  route_id: number;
  route_code: string | null;
  route_name: string | null;
};

type DeliveryTruck = {
  warehouse_id: number | null;
  route_id: number | null;
  truck_code: string;
  warehouse_name: string | null;
  employee_code: string | null;
  driver_name: string | null;
  license_plate: string | null;
  license_plate_province: string | null;
  model: string | null;
  route_code: string | null;
  route_name: string | null;
};

type RequestError = {
  response?: { data?: { code?: string; message?: string; data?: Partial<ProductRow> } };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const requestError = error as RequestError;
  return requestError.response?.data?.message || requestError.message || fallback;
};

export default function DeliveryTruckScan() {
  const { truckLoadId } = useParams<{ truckLoadId: string }>();
  const navigate = useNavigate();
  const loadInputRef = useRef<HTMLInputElement | null>(null);
  const removeInputRef = useRef<HTMLInputElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [loadSerial, setLoadSerial] = useState("");
  const [removeSerial, setRemoveSerial] = useState("");
  const [activeSide, setActiveSide] = useState<"load" | "remove">("load");
  const [pendingRows, setPendingRows] = useState<ProductRow[]>([]);
  const [loadedRows, setLoadedRows] = useState<ProductRow[]>([]);
  const [truck, setTruck] = useState<DeliveryTruck | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingFilter, setPendingFilter] = useState("matched");
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [routeMismatchProduct, setRouteMismatchProduct] = useState<ProductRow | null>(null);
  const routeMismatchCancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!truckLoadId) return;

    const fetchTruck = async () => {
      try {
        const response = await AxiosInstance.get<{ data?: DeliveryTruck }>(`/delivery-trucks/${truckLoadId}`);
        setTruck(response.data?.data || null);
      } catch {
        setTruck(null);
      }
    };

    void fetchTruck();
  }, [truckLoadId]);

  useEffect(() => {
    const fetchRouteOptions = async () => {
      try {
        const response = await AxiosInstance.get<{ data?: { routes?: RouteOption[] } }>("/delivery-trucks/options");
        setRouteOptions(response.data?.data?.routes || []);
      } catch {
        setRouteOptions([]);
      }
    };

    void fetchRouteOptions();
  }, []);

  const fetchProducts = async () => {
    if (!truckLoadId) return;

    try {
      const response = await AxiosInstance.get<{ data?: ProductRow[]; loaded?: ProductRow[] }>(`/delivery-trucks/${truckLoadId}/products`);
      setPendingRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setLoadedRows(Array.isArray(response.data?.loaded) ? response.data.loaded : []);
    } catch {
      setPendingRows([]);
      setLoadedRows([]);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, [truckLoadId]);

  useEffect(() => {
    if (saving || deleting) return;

    window.setTimeout(() => {
      if (activeSide === "remove" && loadedRows.length > 0) {
        removeInputRef.current?.focus();
      } else {
        loadInputRef.current?.focus();
      }
    }, 0);
  }, [activeSide, deleting, loadedRows.length, saving]);

  useEffect(() => {
    if (!routeMismatchProduct) return;
    routeMismatchCancelRef.current?.focus();
  }, [routeMismatchProduct]);

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
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch((playError) => console.warn(`unable to play ${type} sound:`, playError));
  }, []);

  const isRouteMatched = (row: ProductRow) => String(row.route_id ?? "") === String(truck?.route_id ?? "");
  const isUnassignedRouteAtDestinationWarehouse = (row: ProductRow) =>
    row.route_id === null && String(row.to_warehouse_id ?? "") === String(truck?.warehouse_id ?? "");
  const visiblePendingRows = pendingRows.filter((row) => {
    if (row.route_id === null && !isUnassignedRouteAtDestinationWarehouse(row)) return false;
    if (pendingFilter === "matched") return isRouteMatched(row);
    if (pendingFilter === "other") return !isRouteMatched(row);
    if (pendingFilter === "all") return true;
    if (pendingFilter === "unassigned") return row.route_id === null;
    return String(row.route_id) === pendingFilter;
  });
  const currentRouteLabel = [truck?.route_code, truck?.route_name].filter(Boolean).join(" - ") || "ไม่มีชื่อสายรถ";

  const loadProduct = async (serialNo: string, confirmRouteWarning = false) => {
    try {
      setSaving(true);
      setError(null);
      await AxiosInstance.post(`/delivery-trucks/${truckLoadId}/load-product`, {
        serial_no: serialNo,
        confirm_route_warning: confirmRouteWarning,
      });
      setLoadSerial("");
      await fetchProducts();
      playSound("success");
    } catch (error) {
      const requestError = error as RequestError;
      const warning = requestError.response?.data;
      if (warning?.code === "ROUTE_MISSING" || warning?.code === "ROUTE_MISMATCH") {
        const listedProduct = pendingRows.find((row) => normalizeSerialText(row.serial_no) === normalizeSerialText(serialNo));
        setRouteMismatchProduct({
          serial_no: warning.data?.serial_no || listedProduct?.serial_no || serialNo,
          customer_name: listedProduct?.customer_name || null,
          recipient_name: listedProduct?.recipient_name || "",
          now_warehouse_id: listedProduct?.now_warehouse_id || null,
          to_warehouse_id: listedProduct?.to_warehouse_id || null,
          route_id: warning.data?.route_id ?? listedProduct?.route_id ?? null,
        });
        playSound("alert");
        return;
      }
      playSound("error");
      setError(getErrorMessage(error, "ไม่สามารถยิงสินค้าขึ้นรถได้"));
    } finally {
      setSaving(false);
    }
  };

  const handleScan = async (side: "load" | "remove") => {
    const input = side === "load" ? loadSerial : removeSerial;
    const rawSerial = input.trim();
    const serial = normalizeSerialText(rawSerial);
    const targetRows = side === "load" ? pendingRows : loadedRows;
    const inputRef = side === "load" ? loadInputRef : removeInputRef;

    setActiveSide(side);

    if (!serial) {
      playSound("error");
      setError(side === "load" ? "กรุณายิง Serial No ที่ต้องการขึ้นรถ" : "กรุณายิง Serial No ที่ต้องการนำกลับรายการรอยิง");
      inputRef.current?.focus();
      return;
    }

    const hasSerial = targetRows.some((row) => normalizeSerialText(row.serial_no) === serial);
    if (side === "remove" && !hasSerial) {
      playSound("error");
      setError(`ไม่พบ SN ${rawSerial} ในรายการที่ยิงขึ้นรถแล้ว`);
      setRemoveSerial("");
      inputRef.current?.focus();
      return;
    }

    if (side === "load") {
      await loadProduct(rawSerial);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await AxiosInstance.post(`/delivery-trucks/${truckLoadId}/unload-product`, { serial_no: rawSerial });
      setRemoveSerial("");
      await fetchProducts();
      playSound("success");
    } catch (error) {
      playSound("error");
      setError(getErrorMessage(error, "ไม่สามารถนำสินค้ากลับรายการรอยิงได้"));
    } finally {
      setSaving(false);
    }
  };

  const confirmRouteMismatch = async () => {
    const product = routeMismatchProduct;
    if (!product) return;
    setRouteMismatchProduct(null);
    await loadProduct(product.serial_no, true);
  };

  const handleDelete = async () => {
    if (!truckLoadId) return;

    try {
      setDeleting(true);
      await AxiosInstance.patch(`/delivery-trucks/${truckLoadId}/delete`);
      navigate("/delivery-truck-create");
    } catch (error) {
      alert(error instanceof Error ? error.message : "ไม่สามารถลบใบรถกระจายได้");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const Table = ({ title, count, rows, mode }: { title: string; count: number; rows: ProductRow[]; mode: "pending" | "scanned" }) => {
    const isScanned = mode === "scanned";

    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <div className="flex items-center gap-2">
            {!isScanned && (
              <select
                value={pendingFilter}
                onChange={(event) => setPendingFilter(event.target.value)}
                className="h-7 max-w-[380px] rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="matched">สายรถนี้: {currentRouteLabel}</option>
                {routeOptions
                  .filter((route) => String(route.route_id) !== String(truck?.route_id ?? ""))
                  .map((route) => (
                    <option key={route.route_id} value={String(route.route_id)}>
                      {[route.route_code, route.route_name].filter(Boolean).join(" - ") || `สายรถ #${route.route_id}`}
                    </option>
                  ))}
                {pendingRows.some((row) => row.route_id === null) && <option value="unassigned">ยังไม่กำหนดสายรถ</option>}
              </select>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isScanned ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
            >
              {count} รายการ
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
              <tr>
                <th className="w-[62%] border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>
                <th className="w-[38%] border-b border-slate-200 px-3 py-2 text-left">ผู้รับ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
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
                    <td className="border-b border-slate-100 px-3 py-2">
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold ${isScanned ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"}`}
                      >
                        <span className="truncate">{row.serial_no}</span>
                      </span>
                    </td>
                    <td title={row.recipient_name || "-"} className="truncate border-b border-slate-100 px-3 py-2 text-sm text-slate-700">
                      {row.recipient_name || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-3 py-10 text-center text-sm text-slate-500">
                    {isScanned ? "ยังไม่มีรายการที่ยิงขึ้นรถ" : "ไม่มีรายการรอยิงขึ้นรถ"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/delivery-truck-create")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              title="กลับรายการใบรถ"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">ขนของขึ้นรถกระจาย</h1>
              <p className="mt-0.5 text-xs text-slate-500">ยิง Barcode เพื่อตรวจสอบและนำพัสดุขึ้นรถตามใบรถกระจายที่เลือกไว้</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={saving || deleting || loadedRows.length > 0}
          title={loadedRows.length > 0 ? "นำสินค้าออกจากรถให้หมดก่อนจึงจะลบใบรถกระจายได้" : undefined}
          className="h-9 shrink-0 rounded-md border border-red-300 bg-red-100 px-2.5 text-sm text-red-700 outline-none transition hover:bg-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          ลบใบรถกระจาย
        </button>
      </header>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Now Warehouse</label>
            <input
              value={truck?.warehouse_name || ""}
              readOnly
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 text-sm text-slate-700"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Driver</label>
            <input
              value={[truck?.employee_code, truck?.driver_name].filter(Boolean).join(" - ")}
              readOnly
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 text-sm text-slate-700"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Vehicle</label>
            <input
              value={[truck?.license_plate, truck?.license_plate_province, truck?.model].filter(Boolean).join(" - ")}
              readOnly
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-2.5 text-sm text-slate-700"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Route</label>
            <input
              value={[truck?.route_code, truck?.route_name].filter(Boolean).join(" - ")}
              readOnly
              className="h-9 w-full rounded-md border border-blue-300 bg-blue-50 px-2.5 text-sm font-semibold text-blue-800"
            />
          </div>
        </div>

        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงสินค้าขึ้นรถ</label>
            <input
              ref={loadInputRef}
              value={loadSerial}
              onFocus={() => setActiveSide("load")}
              onChange={(event) => setLoadSerial(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleScan("load");
              }}
              disabled={saving}
              placeholder="ยิง SN เพื่อย้ายไปฝั่งขวา"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงลบรายการ</label>
            <input
              ref={removeInputRef}
              value={removeSerial}
              onFocus={() => setActiveSide("remove")}
              onChange={(event) => setRemoveSerial(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleScan("remove");
              }}
              disabled={saving || loadedRows.length === 0}
              placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับ"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
            />
          </div>
        </div>
        {error && <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </section>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <Table title="รายการรอยิงขึ้นรถ" count={visiblePendingRows.length} rows={visiblePendingRows} mode="pending" />
        <Table title="รายการที่ยิงขึ้นรถแล้ว" count={loadedRows.length} rows={loadedRows} mode="scanned" />
      </div>

      <p className="sr-only">กำลังยิงที่ฝั่ง {activeSide}</p>

      {routeMismatchProduct && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-amber-700">
              {routeMismatchProduct.route_id === null ? "แจ้งเตือนยังไม่มีสายรถ" : "แจ้งเตือนสายรถไม่ตรงกัน"}
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              {routeMismatchProduct.route_id === null
                ? "สินค้านี้ยังไม่ได้กำหนดสายรถ ต้องการยิงขึ้นรถต่อใช่หรือไม่"
                : "สินค้านี้อยู่คนละสายรถกับใบรถกระจายที่เลือก ต้องการยิงขึ้นรถต่อใช่หรือไม่"}
            </p>
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <div>
                SN: <strong>{routeMismatchProduct.serial_no}</strong>
              </div>
              <div>
                ผู้รับ: <strong>{routeMismatchProduct.recipient_name || "-"}</strong>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={routeMismatchCancelRef}
                type="button"
                onClick={() => {
                  setRouteMismatchProduct(null);
                  setLoadSerial("");
                  loadInputRef.current?.focus();
                }}
                disabled={saving}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                ไม่
              </button>
              <button
                type="button"
                onClick={() => void confirmRouteMismatch()}
                disabled={saving}
                className="h-9 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
              >
                ใช่
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-red-700">ยืนยันลบใบรถกระจาย</h3>
            <p className="mt-2 text-sm text-slate-700">ต้องการลบใบรถกระจาย {truck?.truck_code || "นี้"} ใช่หรือไม่</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                ไม่
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="h-9 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
              >
                {deleting ? "กำลังลบ..." : "ใช่"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
