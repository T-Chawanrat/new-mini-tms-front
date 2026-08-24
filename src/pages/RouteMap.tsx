import { useEffect, useMemo, useState } from "react";
import L from "leaflet";

import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { ChevronDown, ChevronUp, Crosshair, GripVertical, LocateFixed, MapPin, Plus, RotateCcw, Trash2, X } from "lucide-react";

import "leaflet/dist/leaflet.css";

type RoutePoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

const DEFAULT_MAP_POSITION: [number, number] = [13.7563, 100.5018];

const createPointId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const createNumberedMarkerIcon = (index: number) => {
  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #2563eb;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.30);
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <span
          style="
            transform: rotate(45deg);
            color: white;
            font-size: 12px;
            font-weight: 700;
          "
        >
          ${index + 1}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

function MapClickHandler({
  isAddingPoint,
  onAddPoint,
  onFinishAdd,
}: {
  isAddingPoint: boolean;
  onAddPoint: (latitude: number, longitude: number) => void;
  onFinishAdd: () => void;
}) {
  useMapEvents({
    click(event) {
      if (!isAddingPoint) return;

      onAddPoint(event.latlng.lat, event.latlng.lng);

      onFinishAdd();
    },
  });

  return null;
}

function MapCursor({ isAddingPoint }: { isAddingPoint: boolean }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    container.style.cursor = isAddingPoint ? "crosshair" : "grab";

    return () => {
      container.style.cursor = "";
    };
  }, [map, isAddingPoint]);

  return null;
}

function FitMapToPoints({ points, fitTrigger }: { points: RoutePoint[]; fitTrigger: number }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.flyTo([points[0].latitude, points[0].longitude], 16, {
        duration: 0.6,
      });

      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude] as [number, number]));

    map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 16,
    });
  }, [map, fitTrigger]);

  return null;
}

function MoveMapToPosition({ position, trigger }: { position: [number, number] | null; trigger: number }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.flyTo(position, 16, {
      duration: 0.7,
    });
  }, [map, position, trigger]);

  return null;
}

export default function RouteMap() {
  const [points, setPoints] = useState<RoutePoint[]>([]);

  const [isAddingPoint, setIsAddingPoint] = useState(false);

  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

  const [locationError, setLocationError] = useState("");

  /*
   * ตำแหน่งปัจจุบัน
   *
   * แยกออกจาก points
   * เพราะไม่ใช่จุดของ route
   */
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const [mapTargetPosition, setMapTargetPosition] = useState<[number, number] | null>(null);

  const [moveMapTrigger, setMoveMapTrigger] = useState(0);

  const [fitMapTrigger, setFitMapTrigger] = useState(0);

  const routePositions = useMemo<[number, number][]>(() => points.map((point) => [point.latitude, point.longitude]), [points]);

  const addPoint = (latitude: number, longitude: number) => {
    setPoints((prev) => [
      ...prev,
      {
        id: createPointId(),

        name: prev.length === 0 ? "จุดเริ่มต้น" : `จุดหมาย ${prev.length}`,

        latitude,
        longitude,
      },
    ]);
  };

  const toggleAddPointMode = () => {
    setIsAddingPoint((prev) => !prev);
  };

  /*
   * ==========================================
   * CURRENT LOCATION
   *
   * 1. อ่านตำแหน่ง
   * 2. แสดงจุดสีน้ำเงิน
   * 3. เลื่อนแผนที่ไปหา
   *
   * ไม่เพิ่มเข้า points
   * ==========================================
   */

  const useCurrentLocation = () => {
    setIsAddingPoint(false);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

        const location: [number, number] = [latitude, longitude];

        // เก็บ location แยกจาก route points
        setCurrentLocation(location);

        // เลื่อนแผนที่ไปตำแหน่งเรา
        setMapTargetPosition(location);

        setMoveMapTrigger((prev) => prev + 1);
      },

      (error) => {
        console.error("Geolocation error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิด Location Permission");

          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("ไม่สามารถระบุตำแหน่งปัจจุบันได้");

          return;
        }

        if (error.code === error.TIMEOUT) {
          setLocationError("ใช้เวลาระบุตำแหน่งนานเกินไป กรุณาลองใหม่");

          return;
        }

        setLocationError("ไม่สามารถอ่านตำแหน่งปัจจุบันได้");
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  };

  const updatePointPosition = (id: string, latitude: number, longitude: number) => {
    setPoints((prev) =>
      prev.map((point) =>
        point.id === id
          ? {
              ...point,
              latitude,
              longitude,
            }
          : point,
      ),
    );
  };

  const updatePointName = (id: string, name: string) => {
    setPoints((prev) =>
      prev.map((point) =>
        point.id === id
          ? {
              ...point,
              name,
            }
          : point,
      ),
    );
  };

  const removePoint = (id: string) => {
    setPoints((prev) => prev.filter((point) => point.id !== id));
  };

  const movePoint = (currentIndex: number, direction: "up" | "down") => {
    setPoints((prev) => {
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];

      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];

      return next;
    });
  };

  const handleDrop = (targetId: string) => {
    if (!draggedPointId) {
      return;
    }

    if (draggedPointId === targetId) {
      setDraggedPointId(null);
      return;
    }

    setPoints((prev) => {
      const fromIndex = prev.findIndex((point) => point.id === draggedPointId);

      const targetIndex = prev.findIndex((point) => point.id === targetId);

      if (fromIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const next = [...prev];

      const [movingPoint] = next.splice(fromIndex, 1);

      next.splice(targetIndex, 0, movingPoint);

      return next;
    });

    setDraggedPointId(null);
  };

  const focusPoint = (point: RoutePoint) => {
    setIsAddingPoint(false);

    setMapTargetPosition([point.latitude, point.longitude]);

    setMoveMapTrigger((prev) => prev + 1);
  };

  const focusAllPoints = () => {
    setIsAddingPoint(false);

    setFitMapTrigger((prev) => prev + 1);
  };

  const clearPoints = () => {
    if (points.length === 0) {
      return;
    }

    const confirmed = window.confirm("ต้องการลบจุดทั้งหมดหรือไม่?");

    if (!confirmed) {
      return;
    }

    // ลบเฉพาะ route points
    // currentLocation ยังอยู่
    setPoints([]);

    setIsAddingPoint(false);
  };

  const resetMapView = () => {
    setIsAddingPoint(false);

    setMapTargetPosition(DEFAULT_MAP_POSITION);

    setMoveMapTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative h-[calc(100vh-61px)] w-full overflow-hidden bg-slate-100">
      {/* =========================
          MAP
      ========================== */}

      <MapContainer center={DEFAULT_MAP_POSITION} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler isAddingPoint={isAddingPoint} onAddPoint={addPoint} onFinishAdd={() => setIsAddingPoint(false)} />

        <MapCursor isAddingPoint={isAddingPoint} />

        <FitMapToPoints points={points} fitTrigger={fitMapTrigger} />

        <MoveMapToPosition position={mapTargetPosition} trigger={moveMapTrigger} />

        {/* =========================
            CURRENT LOCATION

            จุดสีน้ำเงินเหมือน Google Maps
            ไม่ใช่ Route Point
        ========================== */}

        {currentLocation && (
          <>
            {/* วงแสงรอบตำแหน่ง */}

            <CircleMarker
              center={currentLocation}
              radius={16}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
                weight: 1,
              }}
              interactive={false}
            />

            {/* จุดกลาง */}

            <CircleMarker
              center={currentLocation}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#2563eb",
                fillOpacity: 1,
                weight: 3,
              }}
              interactive={false}
            />
          </>
        )}

        {/* =========================
            ROUTE LINE
        ========================== */}

        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#2563eb",
              weight: 4,
              opacity: 0.8,
              dashArray: "8 8",
            }}
          />
        )}

        {/* =========================
            ROUTE MARKERS
        ========================== */}

        {points.map((point, index) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={createNumberedMarkerIcon(index)}
            draggable={!isAddingPoint}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;

                const position = marker.getLatLng();

                updatePointPosition(point.id, position.lat, position.lng);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* =========================
          ADD MODE NOTICE
      ========================== */}

      {isAddingPoint && (
        <div className="absolute left-1/2 top-4 z-[1100] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-lg">
            <Crosshair size={18} className="text-blue-600" />

            <div>
              <div className="text-sm font-semibold text-slate-800">เลือกตำแหน่ง</div>

              <div className="text-xs text-slate-500">คลิกบนแผนที่ 1 ครั้งเพื่อเพิ่มจุด</div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingPoint(false)}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              title="ยกเลิก"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================
          LEFT PANEL
      ========================== */}

      <div className="absolute left-4 top-4 z-[1000] flex max-h-[calc(100%-32px)] w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">จัดเส้นทาง</h2>

            <p className="mt-0.5 text-xs text-slate-500">{points.length} จุด</p>
          </div>

          <div className="flex items-center gap-1">
            {/* CURRENT LOCATION */}

            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
              title="ตำแหน่งปัจจุบัน"
            >
              <LocateFixed size={17} />
            </button>

            {/* FIT POINTS */}

            <button
              type="button"
              onClick={focusAllPoints}
              disabled={points.length === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              title="แสดงทุกจุด"
            >
              <MapPin size={17} />
            </button>

            {/* RESET VIEW */}

            <button
              type="button"
              onClick={resetMapView}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              title="กลับมุมมองเริ่มต้น"
            >
              <RotateCcw size={17} />
            </button>

            {/* CLEAR */}

            <button
              type="button"
              onClick={clearPoints}
              disabled={points.length === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
              title="ลบทุกจุด"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* INFO */}

        {!isAddingPoint && (
          <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            เลื่อนแผนที่และซูมได้ตามปกติ กดเพิ่มจุดเมื่อต้องการปักหมุด
          </div>
        )}

        {isAddingPoint && (
          <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700">
            คลิกตำแหน่งบนแผนที่ 1 ครั้งเพื่อเพิ่มจุด
          </div>
        )}

        {/* LOCATION ERROR */}

        {locationError && <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">{locationError}</div>}

        {/* POINT LIST */}

        <div className="flex-1 overflow-y-auto p-3">
          {points.length === 0 ? (
            <div className="flex min-h-[190px] flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <MapPin size={24} className="text-slate-400" />
              </div>

              <div className="text-sm font-medium text-slate-700">ยังไม่มีจุด</div>

              <div className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">กดเพิ่มจุดบนแผนที่ แล้วเลือกตำแหน่งที่ต้องการ</div>
            </div>
          ) : (
            <div className="space-y-2">
              {points.map((point, index) => (
                <div
                  key={point.id}
                  draggable
                  onDragStart={() => setDraggedPointId(point.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={() => handleDrop(point.id)}
                  onDragEnd={() => setDraggedPointId(null)}
                  className={`group flex items-center gap-2 rounded-xl border bg-white p-2 transition ${
                    draggedPointId === point.id
                      ? "border-blue-300 bg-blue-50 opacity-60"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {/* DRAG */}

                  <div className="cursor-grab text-slate-300 active:cursor-grabbing" title="ลากเพื่อจัดลำดับ">
                    <GripVertical size={18} />
                  </div>

                  {/* NUMBER */}

                  <button
                    type="button"
                    onClick={() => focusPoint(point)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
                    title="ไปยังจุดนี้"
                  >
                    {index + 1}
                  </button>

                  {/* NAME */}

                  <div className="min-w-0 flex-1">
                    <input
                      value={point.name}
                      onChange={(event) => updatePointName(point.id, event.target.value)}
                      className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-700 outline-none"
                    />

                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </div>
                  </div>

                  {/* ORDER */}

                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePoint(index, "up")}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-20"
                      title="เลื่อนขึ้น"
                    >
                      <ChevronUp size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={index === points.length - 1}
                      onClick={() => movePoint(index, "down")}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-20"
                      title="เลื่อนลง"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() => removePoint(point.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    title="ลบจุด"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================
            FOOTER
        ========================== */}

        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={toggleAddPointMode}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition ${
              isAddingPoint ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : "border-blue-200 bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isAddingPoint ? (
              <>
                <X size={17} />
                ยกเลิกการเพิ่มจุด
              </>
            ) : (
              <>
                <Plus size={17} />
                เพิ่มจุดบนแผนที่
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
