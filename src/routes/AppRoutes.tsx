import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ChangePassword from "../pages/ChangePassword";
import ProtectedRoute from "./ProtectedRoute";

const SignIn = lazy(() => import("../pages/AuthPages/SignIn"));
const Announcements = lazy(() => import("../pages/Announcements"));
const ContractorCreate = lazy(() => import("../pages/ContractorCreate"));
const CreateReceivePage = lazy(() => import("../pages/CreateReceivePage/CreateReceivePage"));
const DcReceive = lazy(() => import("../pages/DcReceive"));
const DeliveryClose = lazy(() => import("../pages/DeliveryClose"));
const DeliveryCloseMediaEdit = lazy(() => import("../pages/DeliveryCloseMediaEdit"));
const DeliveryIssueInbox = lazy(() => import("../pages/DeliveryIssueInbox"));
const DeliveryPendingReportDt = lazy(() => import("../pages/DeliveryPendingReportDt"));
const DeliveryPendingReportReceive = lazy(() => import("../pages/DeliveryPendingReportReceive"));
const DeliveryPendingReportSn = lazy(() => import("../pages/DeliveryPendingReportSn"));
const DeliveryTruckCreate = lazy(() => import("../pages/DeliveryTruckCreate"));
const DeliveryTruckPrint = lazy(() => import("../pages/DeliveryTruckPrint"));
const DeliveryTruckScan = lazy(() => import("../pages/DeliveryTruckScan"));
const ReceiveImport = lazy(() => import("../pages/ReceiveImport"));
const LabelPrintPage = lazy(() => import("../pages/LabelPrintPage"));
const LogLabelPrint = lazy(() => import("../pages/LogLabelPrint"));
const LogProductTruck = lazy(() => import("../pages/LogProductTruck"));
const LogProductWarehouse = lazy(() => import("../pages/LogProductWarehouse"));
const LogReceiveCreate = lazy(() => import("../pages/LogReceiveCreate"));
const LogReceiveImport = lazy(() => import("../pages/LogReceiveImport"));
const ManageCustomers = lazy(() => import("../pages/ManageCustomer"));
const ManageAnnouncements = lazy(() => import("../pages/ManageAnnouncements"));
const ManageHolidays = lazy(() => import("../pages/ManageHolidays"));
const ManagePackages = lazy(() => import("../pages/ManagePackages"));
const ManageRecipients = lazy(() => import("../pages/ManageRecipients"));
const ManageRoutes = lazy(() => import("../pages/ManageRoutes"));
const ManageShippers = lazy(() => import("../pages/ManageShippers"));
const ManageUsers = lazy(() => import("../pages/ManageUsers"));
const ManageVehicles = lazy(() => import("../pages/ManageVehicles"));
const MoveDtScan = lazy(() => import("../pages/MoveDtScan"));
const MoveHub = lazy(() => import("../pages/MoveHub"));
const MoveTkScan = lazy(() => import("../pages/MoveTkScan"));
const NotFound = lazy(() => import("../pages/OtherPage/NotFound"));
const ProductTruck = lazy(() => import("../pages/ProductTruck"));
const ProductWarehouse = lazy(() => import("../pages/ProductWarehouse"));
const ReceiveReport = lazy(() => import("../pages/ReceiveReport"));
const ReceiveReportPrint = lazy(() => import("../pages/ReceiveReportPrint"));
const RouteMap = lazy(() => import("../pages/RouteMap"));
const TruckLoadCreate = lazy(() => import("../pages/TruckloadCreate"));
const TruckLoadPrint = lazy(() => import("../pages/TruckLoadPrint"));
const TruckloadScan = lazy(() => import("../pages/TruckloadScan"));
const WarehouseScan = lazy(() => import("../pages/WarehouseScan"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">กำลังโหลด...</div>}>
      <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/dashboard" element={<Announcements />} />
        <Route path="/manage/vehicles" element={<ManageVehicles />} />
        <Route path="/contractor-create" element={<ContractorCreate />} />
        <Route path="/manage/users" element={<ManageUsers />} />
        <Route path="/manage/customers" element={<ManageCustomers />} />
        <Route path="/manage/announcements" element={<ManageAnnouncements />} />
        <Route path="/std" element={<ReceiveImport />} />
        <Route path="/manage/shippers" element={<ManageShippers />} />
        <Route path="/manage/recipients" element={<ManageRecipients />} />
        <Route path="/manage/recipients2" element={<ManageRecipients />} />
        <Route path="/manage/packages" element={<ManagePackages />} />
        <Route path="/manage/routes" element={<ManageRoutes />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/create-do" element={<CreateReceivePage />} />
        <Route path="/manage-holidays" element={<ManageHolidays />} />
        <Route path="/receive-report" element={<ReceiveReport />} />
        <Route path="/receive-report-print/:receiveBusinessId" element={<ReceiveReportPrint />} />
        <Route path="/label-print" element={<LabelPrintPage />} />
        <Route path="/warehouse-scan" element={<WarehouseScan />} />
        <Route path="/product-warehouse" element={<ProductWarehouse />} />
        <Route path="/product-truck" element={<ProductTruck />} />
        <Route path="/logs/label-print" element={<LogLabelPrint />} />
        <Route path="/logs/product-trucks" element={<LogProductTruck />} />
        <Route path="/logs/product-warehouses" element={<LogProductWarehouse />} />
        <Route path="/logs/receive-create" element={<LogReceiveCreate />} />
        <Route path="/logs/receive-imports" element={<LogReceiveImport />} />
        <Route path="/truck-scan" element={<TruckloadScan />} />
        <Route path="/truck-scan/:truckLoadId" element={<TruckloadScan />} />
        <Route path="/truck-create" element={<TruckLoadCreate />} />
        <Route path="/delivery-truck-create" element={<DeliveryTruckCreate />} />
        <Route path="/delivery-truck-scan/:truckLoadId" element={<DeliveryTruckScan />} />
        <Route path="/delivery-truck-print/:truckLoadId" element={<DeliveryTruckPrint />} />
        <Route path="/delivery-close" element={<DeliveryClose />} />
        <Route path="/delivery-close-media" element={<DeliveryCloseMediaEdit />} />
        <Route path="/delivery-issue-chat" element={<DeliveryIssueInbox />} />
        <Route path="/delivery-pending-report/dt" element={<DeliveryPendingReportDt />} />
        <Route path="/delivery-pending-report/receive" element={<DeliveryPendingReportReceive />} />
        <Route path="/delivery-pending-report/sn" element={<DeliveryPendingReportSn />} />
        <Route path="/truck-print/:truckLoadId" element={<TruckLoadPrint />} />
        <Route path="/dc-receive" element={<DcReceive />} />
        <Route path="/move" element={<MoveHub />} />
        <Route path="/move/tk/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveTkScan />} />
        <Route path="/move/dt/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveDtScan />} />
        <Route path="/map" element={<RouteMap />} />
      </Route>
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
