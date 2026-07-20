import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ColumnWidthsProvider } from "./context/ColumnWidths";
import "react-datepicker/dist/react-datepicker.css";
import BillImport from "./pages/BillImport";
// import BillManual from "./pages/ImportManual";
// import BillScanWarehouse from "./pages/BillScanWarehouse";
import BillScanDc from "./pages/BillScanDc";
import BillImportADV from "./pages/BillImportADV";
import BillImportVGT from "./pages/BillImportVGT";
import PrintLabel from "./pages/PrintLabel";
import BillReport from "./pages/BillReport";
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
import WarehouseReceivePage from "./pages/WarehouseReceivePage";
// import ImportVGT from "./pages/ImportVGT";
// import ImportADV from "./pages/ImportADV";

const RoleRedirect = () => {
  const { user } = useAuth();
  const roleId = Number(user?.role_id);

  if ([1, 2, 5, 6, 7, 8, 9, 10].includes(roleId)) return <Navigate to="/import" replace />;
  if (roleId === 3) return <Navigate to="/warehouse-scan" replace />;
  if (roleId === 4) return <Navigate to="/dc-scan" replace />;

  return <Navigate to="/signin" replace />;
};

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
                    <RoleRedirect />
                  </ProtectedRoute>
                }
              />

              <Route
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
              {/* <Route
                path="/input"
                element={
                  <ProtectedRoute
                    allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  >
                    <BillManual />
                  </ProtectedRoute>
                }
              /> */}
              {/* <Route
                path="/warehouse-scan"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillScanWarehouse />
                  </ProtectedRoute>
                }
              /> */}
              <Route
                path="/dc-scan"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <BillScanDc />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/labels"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    <PrintLabel />
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
              />
              <Route path="/manage/vehicles" element={<ManageVehicles />} />
              <Route path="/manage/users" element={<ManageUsers />} />
              <Route path="/manage/customers" element={<ManageCustomers />} />
              <Route path="/std" element={<ImportSTD />} />
              <Route path="/manual" element={<ImportManual />} />
              <Route path="/manage/shippers" element={<ManageShippers />} />
              <Route path="/manage/recipients" element={<ManageRecipients />} />
              <Route path="/manage/packages" element={<ManagePackages />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/create-do" element={<CreateReceivePage />} />
              <Route path="/manage-holidays" element={<ManageHolidays />} />
              <Route path="/receive-report" element={<ReceiveReport />} />
             <Route path="/label-print" element={<LabelPrintPage />} />
             <Route path="/warehouse-scan" element={<WarehouseReceivePage />} />
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
