import { useState, useEffect } from "react";
import { format } from "date-fns";

import { downloadImage } from "../utils/DownloadImage";
import AxiosInstance from "../utils/AxiosInstance";

interface Bill {
  id: number;
  user_id: number;
  receive_code: string;
  name: string;
  surname: string;
  dc_id: string;
  license_plate: string | null;
  warehouse_name: string;
  sign: string;
  remark: string;
  created_at: string;
  images: string[];
}

export default function BillPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AxiosInstance.get("/bills");
      setBills(res.data.bills || []);
    } catch (err) {
      setError((err as Error).message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen font-thai">
        <div className="loader"></div>
      </div>
    );
  if (error)
    return (
      <div className="text-red-600 text-center mt-10 font-thai">{error}</div>
    );
  if (!bills.length)
    return (
      <div className="text-center mt-10 text-lg text-red-500 font-thai">
        ไม่มีข้อมูล
      </div>
    );

  return (
    <div className="font-thai w-full mx-auto p-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((b) => (
        <div
          key={b.id}
          className="bg-white shadow-md rounded-lg p-4 flex flex-col"
        >
          <h3 className="font-bold text-lg mb-2">
            {b.name} {b.surname}
          </h3>
          <p className="text-gray-600 mb-1">
            <span className="font-semibold">หมายเลขกล่อง:</span>
            <a
              href={b.receive_code}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline ml-1"
            >
              {b.receive_code}
            </a>
          </p>
          <p className="text-gray-600 mb-1">
            <span className="font-semibold">ทะเบียนรถ:</span>{" "}
            {b.license_plate || "-"}
          </p>
          <p className="text-gray-600 mb-1">
            <span className="font-semibold">หมายเหตุ:</span> {b.remark || "-"}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">วันที่สร้าง:</span>{" "}
            {b.created_at
              ? format(new Date(b.created_at), "dd-MM-yyyy | HH:mm")
              : "-"}
          </p>

          {b.sign && (
            <div className="mb-2">
              <p className="font-semibold text-gray-700">ลายเซ็น:</p>
              <img
                src={b.sign}
                alt="signature"
                className="w-32 h-16 object-contain border rounded mt-1 cursor-pointer"
                onClick={() => setSelectedImage(b.sign)}
              />
            </div>
          )}

          {b.images && b.images.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-gray-700 mb-1">รูปภาพ:</p>
              <div className="flex flex-wrap gap-2">
                {b.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`bill_img_${idx}`}
                    className="w-24 h-24 object-cover rounded border cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => downloadImage(b.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Modal สำหรับรูป / ลายเซ็น */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged"
              className="max-w-full max-h-[800px] rounded"
            />
            <button
              className="absolute top-4 right-4 bg-gray-300 text-black rounded-full p-2 hover:bg-gray-400"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
