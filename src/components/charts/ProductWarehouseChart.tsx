import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import AxiosInstance from "../../utils/AxiosInstance";

interface ApiResponse {
  data: WarehouseData[];
}

interface WarehouseData {
  count_warehouse_15: number;
  count_warehouse_not_15: number;
}

export default function ProductWarehouseChart() {
  const [windowWidth, setWindowWidth] = useState(0);
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([
    {
      name: "Count",
      data: [],
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);

  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Sarabun, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: windowWidth < 768 ? "25%" : "18%", 
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 2,
      style: {
        fontSize: windowWidth < 768 ? "12px" : "12px",
        fontWeight: "bold",
      },
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["กทม.", "ตจว."],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { 
          fontSize: windowWidth < 768 ? "13px" : "13px" 
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: windowWidth < 768 ? "12px" : "12px",
    },
    yaxis: {
      title: { text: undefined },
      labels: {
        style: { 
          fontSize: windowWidth < 768 ? "10px" : "10px" 
        },
      },
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const fetchData = async () => {
    try {
      const { data }: { data: ApiResponse } = await AxiosInstance.get("/02");
      const countWarehouse15 = data.data[0]?.count_warehouse_15 || 0;
      const countWarehouseNot15 = data.data[0]?.count_warehouse_not_15 || 0;

      setSeries([
        {
          name: "จำนวน",
          data: [countWarehouse15, countWarehouseNot15],
        },
      ]);
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
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">สินค้าในคลัง (ไม่มีหมายเหตุ)</h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-5 sm:size-6" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="w-full">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}