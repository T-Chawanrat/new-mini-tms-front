import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import SignIn from "../pages/AuthPages/SignIn";
import ChangePassword from "../pages/ChangePassword";
import ContractorCreate from "../pages/ContractorCreate";
import CreateReceivePage from "../pages/CreateReceivePage/CreateReceivePage";
import DcReceive from "../pages/DcReceive";
import DeliveryClose from "../pages/DeliveryClose";
import DeliveryCloseMediaEdit from "../pages/DeliveryCloseMediaEdit";
import DeliveryIssueInbox from "../pages/DeliveryIssueInbox";
import DeliveryPendingReportDt from "../pages/DeliveryPendingReportDt";
import DeliveryPendingReportReceive from "../pages/DeliveryPendingReportReceive";
import DeliveryPendingReportSn from "../pages/DeliveryPendingReportSn";
import DeliveryTruckCreate from "../pages/DeliveryTruckCreate";
import DeliveryTruckPrint from "../pages/DeliveryTruckPrint";
import DeliveryTruckScan from "../pages/DeliveryTruckScan";
import ImportManual from "../pages/ImportManual";
import ImportSTD from "../pages/ImportSTD";
import LabelPrintPage from "../pages/LabelPrintPage";
import ManageCustomers from "../pages/ManageCustomer";
import ManageHolidays from "../pages/ManageHolidays";
import ManagePackages from "../pages/ManagePackages";
import ManageRecipients from "../pages/ManageRecipients";
import ManageRoutes from "../pages/ManageRoutes";
import ManageShippers from "../pages/ManageShippers";
import ManageUsers from "../pages/ManageUsers";
import ManageVehicles from "../pages/ManageVehicles";
import MoveDtScan from "../pages/MoveDtScan";
import MoveHub from "../pages/MoveHub";
import MoveTkScan from "../pages/MoveTkScan";
import NotFound from "../pages/OtherPage/NotFound";
import ProductTruck from "../pages/ProductTruck";
import ProductWarehouse from "../pages/ProductWarehouse";
import ReceiveReport from "../pages/ReceiveReport";
import ReceiveReportPrint from "../pages/ReceiveReportPrint";
import RouteMap from "../pages/RouteMap";
import TruckLoadCreate from "../pages/TruckloadCreate";
import TruckLoadPrint from "../pages/TruckLoadPrint";
import TruckloadScan from "../pages/TruckloadScan";
import WarehouseScan from "../pages/WarehouseScan";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProtectedRoute><ImportSTD /></ProtectedRoute>} />
        <Route path="/manage/vehicles" element={<ManageVehicles />} />
        <Route path="/contractor-create" element={<ContractorCreate />} />
        <Route path="/manage/users" element={<ManageUsers />} />
        <Route path="/manage/customers" element={<ManageCustomers />} />
        <Route path="/std" element={<ImportSTD />} />
        <Route path="/manual" element={<ImportManual />} />
        <Route path="/manage/shippers" element={<ManageShippers />} />
        <Route path="/manage/recipients" element={<ManageRecipients />} />
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
  );
}
