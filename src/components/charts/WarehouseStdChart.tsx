import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import AxiosInstance from "../../utils/AxiosInstance";

interface ApiResponse {
  data: WarehouseStandardData[];
}

interface WarehouseStandardData {
  warehouse_id: number;
  warehouse_name: string;
  no_resend_count: number;
  overdue_count: number;
  overdue_days_avg: string | null;
  overdue_days_max: number | null;
  overdue_days_min: number | null;
}

export default function WarehouseStdTable() {
  const [data, setData] = useState<WarehouseStandardData[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data }: { data: ApiResponse } = await AxiosInstance.get("/dashboard03std");
      setData(data.data);
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="font-thai overflow-hidden rounded-2xl border border-gray-200 bg-white px-3 pt-3 sm:px-5 sm:pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-2 sm:mb-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">
          สินค้าในคลัง ไม่มีและเกินวันจัดส่งใหม่
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-5 sm:size-6" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-4 py-2 text-gray-600 dark:text-gray-300">คลังปัจจุบัน</th>
              <th className="px-4 py-2 text-gray-600 dark:text-gray-300">ไม่มีวันจัดส่งใหม่</th>
              <th className="px-4 py-2 text-gray-600 dark:text-gray-300">เกินวันจัดส่งใหม่</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className={`border-t ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}`}
              >
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.warehouse_name.replace("DC ", "")}</td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.no_resend_count}</td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.overdue_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
