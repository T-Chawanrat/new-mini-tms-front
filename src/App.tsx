import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { ColumnWidthsProvider } from "./context/ColumnWidths";
import "react-datepicker/dist/react-datepicker.css";
// import BillImport from "./pages/BillImport";
// import BillScanDc from "./pages/BillScanDc";
// import BillImportADV from "./pages/BillImportADV";
// import BillImportVGT from "./pages/BillImportVGT";
// import BillReport from "./pages/BillReport";
import ProtectedRoute from "./context/ProtectedRoute";
import ManageVehicles from "./pages/ManageVehicles";
import ManageUsers from "./pages/ManageUsers";
import ManageCustomers from "./pages/ManageCustomer";
import ImportSTD from "./pages/ImportSTD";
import ManageShippers from "./pages/ManageShippers";
import ManageRecipients from "./pages/ManageRecipients";
import ManagePackages from "./pages/ManagePackages";
import ImportManual from "./pages/ImportManual";
import ChangePassword from "./pages/ChangePassword";
import CreateReceivePage from "./pages/CreateReceivePage/CreateReceivePage";
import ManageHolidays from "./pages/ManageHolidays";
import ReceiveReport from "./pages/ReceiveReport";
import LabelPrintPage from "./pages/LabelPrintPage";
import WarehouseScan from "./pages/WarehouseScan";
import ProductWarehouse from "./pages/ProductWarehouse";
import ProductTruck from "./pages/ProductTruck";
import TruckloadScan from "./pages/TruckloadScan";
import TruckLoadCreate from "./pages/TruckloadCreate";
import TruckLoadPrint from "./pages/TruckLoadPrint";
import DcReceive from "./pages/DcReceive";
import MoveTk from "./pages/MoveTk";
import MoveTkScan from "./pages/MoveTkScan";
import ContractorCreate from "./pages/ContractorCreate";
import DeliveryTruckCreate from "./pages/DeliveryTruckCreate";
import DeliveryTruckScan from "./pages/DeliveryTruckScan";
import DeliveryTruckPrint from "./pages/DeliveryTruckPrint";
import RouteMap from "./pages/RouteMap";
import ManageRoutes from "./pages/ManageRoutes";
import MoveDtScan from "./pages/MoveDtScan";
import MoveDc from "./pages/MoveDc";

export default function App() {
  return (
    <AuthProvider>
      <ColumnWidthsProvider>
        <Router basename="/tms">
          <ScrollToTop />
          <Routes>
            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              {/* ✅ default route หลัง login */}
              <Route
                index
                element={
                  <ProtectedRoute>
                    <ImportSTD />
                  </ProtectedRoute>
                }
              />

              {/* <Route
                path="/import"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/importvgt"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillImportVGT />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/importadv"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillImportADV />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dc-scan"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillScanDc />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillReport />
                  </ProtectedRoute>
                }
              /> */}
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
              <Route path="/truck-print/:truckLoadId" element={<TruckLoadPrint />} />
              <Route path="/dc-receive" element={<DcReceive />} />
              <Route path="/move-tk" element={<MoveTk />} />
              <Route path="/move-tk/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveTkScan />} />
              <Route path="/move-dt" element={<MoveDtScan />} />
              <Route path="/move-dt/:sourceTruckLoadId/to/:targetTruckLoadId" element={<MoveDtScan />} />
              <Route path="/move-dc" element={<MoveDc />} />
              <Route path="/map" element={<RouteMap />} />
              {/* <Route path="/vgt" element={<ImportVGT />} />
              <Route path="/adv" element={<ImportADV />} /> */}
            </Route>

            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ColumnWidthsProvider>
    </AuthProvider>
  );
}
