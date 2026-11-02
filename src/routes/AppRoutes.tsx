import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ChangePassword from "../pages/AuthPages/ChangePassword";
import ProtectedRoute from "./ProtectedRoute";
import UserProfiles from "../pages/AuthPages/UserProfiles";

const Announcements = lazy(() => import("../pages/Dashboard/Announcements"));
const ContractorCreate = lazy(() => import("../pages/Management/ContractorCreate"));
const CreateReceivePage = lazy(() => import("../pages/CreateReceivePage/CreateReceivePage"));
const DcReceive = lazy(() => import("../pages/Warehouse/DcReceive"));
const DeliveryClose = lazy(() => import("../pages/Delivery/DeliveryClose"));
const DeliveryCloseMediaEdit = lazy(() => import("../pages/Delivery/DeliveryCloseMediaEdit"));
const IssueInbox = lazy(() => import("../pages/Delivery/IssueInbox"));
const LabelPrintPage = lazy(() => import("../pages/Labels/LabelPrintPage"));
const LogDeliveryTruck = lazy(() => import("../pages/Logs/LogDeliveryTruck"));
const LogLabelPrint = lazy(() => import("../pages/Logs/LogLabelPrint"));
const LogProductTruck = lazy(() => import("../pages/Logs/LogProductTruck"));
const LogProductWarehouse = lazy(() => import("../pages/Logs/LogProductWarehouse"));
const LogReceiveCreate = lazy(() => import("../pages/Logs/LogReceiveCreate"));
const LogReceiveImport = lazy(() => import("../pages/Logs/LogReceiveImport"));
const ManageAnnouncements = lazy(() => import("../pages/Management/ManageAnnouncements"));
const ManageCustomers = lazy(() => import("../pages/Management/ManageCustomer"));
const ManageHolidays = lazy(() => import("../pages/Management/ManageHolidays"));
const ManagePackages = lazy(() => import("../pages/Management/ManagePackages"));
const ManagePermissions = lazy(() => import("../pages/Management/ManagePermissions"));
const ManageRecipients = lazy(() => import("../pages/Management/ManageRecipients"));
const ManageRolePermissions = lazy(() => import("../pages/Management/ManageRolePermissions"));
const ManageRoutes = lazy(() => import("../pages/Management/ManageRoutes"));
const ManageShippers = lazy(() => import("../pages/Management/ManageShippers"));
const ManageUsers = lazy(() => import("../pages/Management/ManageUsers"));
const ManageVehicles = lazy(() => import("../pages/Management/ManageVehicles"));
const MoveDtScan = lazy(() => import("../pages/Movement/MoveDtScan"));
const MoveHub = lazy(() => import("../pages/Movement/MoveHub"));
const MoveTkScan = lazy(() => import("../pages/Movement/MoveTkScan"));
const NotFound = lazy(() => import("../pages/OtherPage/NotFound"));
const PendingReportDt = lazy(() => import("../pages/Reports/PendingReportDt"));
const PendingReportReceive = lazy(() => import("../pages/Reports/PendingReportReceive"));
const PendingReportSn = lazy(() => import("../pages/Reports/PendingReportSn"));
const ProductTruck = lazy(() => import("../pages/Warehouse/ProductTruck"));
const ProductWarehouse = lazy(() => import("../pages/Warehouse/ProductWarehouse"));
const ProductWarehouseSerial = lazy(() => import("../pages/Warehouse/ProductWarehouseSerial"));
const ReceiveImport = lazy(() => import("../pages/Receive/ReceiveImport"));
const ReceiveReport = lazy(() => import("../pages/Receive/ReceiveReport"));
const ReceiveReportPrint = lazy(() => import("../pages/Receive/ReceiveReportPrint"));
const RouteMap = lazy(() => import("../pages/Maps/RouteMap"));
const SignIn = lazy(() => import("../pages/AuthPages/SignIn"));
const TruckDeliveryCreate = lazy(() => import("../pages/Truck/TruckDeliveryCreate"));
const TruckDeliveryPrint = lazy(() => import("../pages/Truck/TruckDeliveryPrint"));
const TruckDeliveryScan = lazy(() => import("../pages/Truck/TruckDeliveryScan"));
const TruckLoadCreate = lazy(() => import("../pages/Truck/TruckloadCreate"));
const TruckLoadPrint = lazy(() => import("../pages/Truck/TruckLoadPrint"));
const TruckloadScan = lazy(() => import("../pages/Truck/TruckloadScan"));
const WarehouseScan = lazy(() => import("../pages/Warehouse/WarehouseScan"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">กำลังโหลด...</div>}>
      <Routes>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Announcements />} />
          <Route path="/dashboard" element={<Announcements />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/contractor-create" element={<ContractorCreate />} />
          <Route path="/create" element={<CreateReceivePage />} />
          <Route path="/dc-receive" element={<DcReceive />} />
          <Route path="/delivery-close" element={<DeliveryClose />} />
          <Route path="/delivery-close-media" element={<DeliveryCloseMediaEdit />} />
          <Route path="/delivery-issue-chat" element={<IssueInbox />} />
          <Route path="/label-print" element={<LabelPrintPage />} />
          <Route path="/logs/delivery-trucks" element={<LogDeliveryTruck />} />
          <Route path="/logs/label-print" element={<LogLabelPrint />} />
          <Route path="/logs/product-trucks" element={<LogProductTruck />} />
          <Route path="/logs/product-warehouses" element={<LogProductWarehouse />} />
          <Route path="/logs/receive-create" element={<LogReceiveCreate />} />
          <Route path="/logs/receive-imports" element={<LogReceiveImport />} />
          <Route path="/manage/announcements" element={<ManageAnnouncements />} />
          <Route path="/manage/customers" element={<ManageCustomers />} />
          <Route path="/manage/holidays" element={<ManageHolidays />} />
          <Route path="/manage/packages" element={<ManagePackages />} />
          <Route path="/manage/permissions" element={<ManagePermissions />} />
          <Route path="/manage/recipients" element={<ManageRecipients />} />
          <Route path="/manage/role-permissions" element={<ManageRolePermissions />} />
          <Route path="/manage/routes" element={<ManageRoutes />} />
          <Route path="/manage/shippers" element={<ManageShippers />} />
          <Route path="/manage/users" element={<ManageUsers />} />
          <Route path="/manage/vehicles" element={<ManageVehicles />} />
          <Route path="/move/dt/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveDtScan />} />
          <Route path="/move" element={<MoveHub />} />
          <Route path="/move/tk/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveTkScan />} />
          <Route path="/pending-report/dt" element={<PendingReportDt />} />
          <Route path="/pending-report/receive" element={<PendingReportReceive />} />
          <Route path="/pending-report/sn" element={<PendingReportSn />} />
          <Route path="/product-truck" element={<ProductTruck />} />
          <Route path="/product-warehouse" element={<ProductWarehouse />} />
          <Route path="/product-warehouse/serials" element={<ProductWarehouseSerial />} />
          <Route path="/import" element={<ReceiveImport />} />
          <Route path="/receive-report" element={<ReceiveReport />} />
          <Route path="/receive-report-print/:receiveBusinessId" element={<ReceiveReportPrint />} />
          <Route path="/map" element={<RouteMap />} />
          <Route path="/delivery-truck-create" element={<TruckDeliveryCreate />} />
          <Route path="/delivery-truck-print/:truckLoadId" element={<TruckDeliveryPrint />} />
          <Route path="/delivery-truck-scan/:truckLoadId" element={<TruckDeliveryScan />} />
          <Route path="/truck-create" element={<TruckLoadCreate />} />
          <Route path="/truck-print/:truckLoadId" element={<TruckLoadPrint />} />
          <Route path="/truck-scan" element={<TruckloadScan />} />
          <Route path="/truck-scan/:truckLoadId" element={<TruckloadScan />} />
          <Route path="/wh-receive" element={<WarehouseScan />} />
        </Route>
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
        <Route path="profile" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
