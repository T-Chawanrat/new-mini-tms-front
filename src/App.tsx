import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ColumnWidthsProvider } from "./context/ColumnWidths";
import "react-datepicker/dist/react-datepicker.css";
import BillImport from "./pages/BillImport";
import BillManual from "./pages/BillManual";
import BillScanWarehouse from "./pages/BillScanWarehouse";
import BillScanDc from "./pages/BillScanDc";
import BillImportADV from "./pages/BillImportADV";
import BillImportVGT from "./pages/BillImportVGT";
import PrintLabel from "./pages/PrintLabel";
import BillReport from "./pages/BillReport";
import ProtectedRoute from "./context/ProtectedRoute";

const RoleRedirect = () => {
  const { user } = useAuth();
  const roleId = Number(user?.role_id);

  if ([1, 2, 5, 7].includes(roleId)) return <Navigate to="/import" replace />;
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
                  <ProtectedRoute allowedRoles={[1, 2, 5, 7]}>
                    <BillImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/importvgt"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 5, 7]}>
                    <BillImportVGT />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/importadv"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 5, 7]}>
                    <BillImportADV />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/input"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 5, 7]}>
                    <BillManual />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/warehouse-scan"
                element={
                  <ProtectedRoute allowedRoles={[1, 3]}>
                    <BillScanWarehouse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dc-scan"
                element={
                  <ProtectedRoute allowedRoles={[1, 4]}>
                    <BillScanDc />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/labels"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 5, 7]}>
                    <PrintLabel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={[1, 3, 4, 5, 7]}>
                    <BillReport />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />

            {/* ✅ เอา "/" ออก ไม่งั้นจะชนกับ redirect */}
            {/* <Route path="/" element={<SignIn />} /> */}

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ColumnWidthsProvider>
    </AuthProvider>
  );
}
