import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ChangePassword from "../pages/ChangePassword";
import ProtectedRoute from "./ProtectedRoute";
import UserProfiles from "../pages/OtherPage/UserProfiles";

const SignIn = lazy(() => import("../pages/AuthPages/SignIn"));
const Announcements = lazy(() => import("../pages/Announcements"));
const ContractorCreate = lazy(() => import("../pages/Management/ContractorCreate"));
const CreateReceivePage = lazy(() => import("../pages/CreateReceivePage/CreateReceivePage"));
const DcReceive = lazy(() => import("../pages/DcReceive"));
const DeliveryClose = lazy(() => import("../pages/DeliveryClose"));
const DeliveryCloseMediaEdit = lazy(() => import("../pages/DeliveryCloseMediaEdit"));
const IssueInbox = lazy(() => import("../pages/IssueInbox"));
const PendingReportDt = lazy(() => import("../pages/PendingReportDt"));
const PendingReportReceive = lazy(() => import("../pages/PendingReportReceive"));
const PendingReportSn = lazy(() => import("../pages/PendingReportSn"));
const TruckDeliveryCreate = lazy(() => import("../pages/TruckDeliveryCreate"));
const TruckDeliveryPrint = lazy(() => import("../pages/TruckDeliveryPrint"));
const TruckDeliveryScan = lazy(() => import("../pages/TruckDeliveryScan"));
const ReceiveImport = lazy(() => import("../pages/ReceiveImport"));
const LabelPrintPage = lazy(() => import("../pages/Labels/LabelPrintPage"));
const LogLabelPrint = lazy(() => import("../pages/Logs/LogLabelPrint"));
const LogDeliveryTruck = lazy(() => import("../pages/Logs/LogDeliveryTruck"));
const LogProductTruck = lazy(() => import("../pages/Logs/LogProductTruck"));
const LogProductWarehouse = lazy(() => import("../pages/Logs/LogProductWarehouse"));
const LogReceiveCreate = lazy(() => import("../pages/Logs/LogReceiveCreate"));
const LogReceiveImport = lazy(() => import("../pages/Logs/LogReceiveImport"));
const ManageCustomers = lazy(() => import("../pages/Management/ManageCustomer"));
const ManageAnnouncements = lazy(() => import("../pages/Management/ManageAnnouncements"));
const ManageHolidays = lazy(() => import("../pages/Management/ManageHolidays"));
const ManagePackages = lazy(() => import("../pages/Management/ManagePackages"));
const ManageRecipients = lazy(() => import("../pages/Management/ManageRecipients"));
const ManageRoutes = lazy(() => import("../pages/Management/ManageRoutes"));
const ManageShippers = lazy(() => import("../pages/Management/ManageShippers"));
const ManageUsers = lazy(() => import("../pages/Management/ManageUsers"));
const ManageVehicles = lazy(() => import("../pages/Management/ManageVehicles"));
const MoveDtScan = lazy(() => import("../pages/Movement/MoveDtScan"));
const MoveHub = lazy(() => import("../pages/Movement/MoveHub"));
const MoveTkScan = lazy(() => import("../pages/Movement/MoveTkScan"));
const NotFound = lazy(() => import("../pages/OtherPage/NotFound"));
const ProductTruck = lazy(() => import("../pages/ProductTruck"));
const ProductWarehouse = lazy(() => import("../pages/ProductWarehouse"));
const ProductWarehouseSerial = lazy(() => import("../pages/ProductWarehouseSerial"));
const ReceiveReport = lazy(() => import("../pages/ReceiveReport"));
const ReceiveReportPrint = lazy(() => import("../pages/ReceiveReportPrint"));
const RouteMap = lazy(() => import("../pages/Maps/RouteMap"));
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
        <Route path="/product-warehouse/serials" element={<ProductWarehouseSerial />} />
        <Route path="/product-truck" element={<ProductTruck />} />
        <Route path="/logs/label-print" element={<LogLabelPrint />} />
        <Route path="/logs/delivery-trucks" element={<LogDeliveryTruck />} />
        <Route path="/logs/product-trucks" element={<LogProductTruck />} />
        <Route path="/logs/product-warehouses" element={<LogProductWarehouse />} />
        <Route path="/logs/receive-create" element={<LogReceiveCreate />} />
        <Route path="/logs/receive-imports" element={<LogReceiveImport />} />
        <Route path="/truck-scan" element={<TruckloadScan />} />
        <Route path="/truck-scan/:truckLoadId" element={<TruckloadScan />} />
        <Route path="/truck-create" element={<TruckLoadCreate />} />
        <Route path="/delivery-truck-create" element={<TruckDeliveryCreate />} />
        <Route path="/delivery-truck-scan/:truckLoadId" element={<TruckDeliveryScan />} />
        <Route path="/delivery-truck-print/:truckLoadId" element={<TruckDeliveryPrint />} />
        <Route path="/delivery-close" element={<DeliveryClose />} />
        <Route path="/delivery-close-media" element={<DeliveryCloseMediaEdit />} />
        <Route path="/delivery-issue-chat" element={<IssueInbox />} />
        <Route path="/delivery-pending-report/dt" element={<PendingReportDt />} />
        <Route path="/delivery-pending-report/receive" element={<PendingReportReceive />} />
        <Route path="/delivery-pending-report/sn" element={<PendingReportSn />} />
        <Route path="/truck-print/:truckLoadId" element={<TruckLoadPrint />} />
        <Route path="/dc-receive" element={<DcReceive />} />
        <Route path="/move" element={<MoveHub />} />
        <Route path="/move/tk/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveTkScan />} />
        <Route path="/move/dt/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveDtScan />} />
        <Route path="/map" element={<RouteMap />} />
      </Route>
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<NotFound />} />
      <Route path="profile" element={<UserProfiles />} />
      
      
      </Routes>
    </Suspense>
  );
}
