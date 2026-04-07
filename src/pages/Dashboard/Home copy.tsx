





import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import ProductWarehouseChart from "../../components/charts/ProductWarehouseChart";
import OntruckChart from "../../components/charts/OntruckChart";
import WarehouseStdChart from "../../components/charts/WarehouseStdChart";

export default function HomeCopy() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <PageMeta title="Trantech Report" description="Trantech Report" />
      <span className="text-lg font-semibold text-gray-800 flex justify-center md:justify-start">
        {currentTime.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        })}
        &nbsp;&nbsp;&nbsp;
        {currentTime.toLocaleString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <div className="grid grid-cols-12 gap-4 md:gap-2">
        <div className="col-span-12 space-y-6 xl:col-span-3">
          <ProductWarehouseChart />
        </div>

        <div className="col-span-12 xl:col-span-3">
          <OntruckChart />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <WarehouseStdChart />
        </div>

        {/* <EcommerceMetrics /> */}
        {/* <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}
      </div>
    </>
  );
}
