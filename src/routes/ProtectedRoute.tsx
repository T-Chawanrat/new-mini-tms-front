import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { permissionForPath } from "./permissions";

type Props = {
  children: React.ReactNode;
  allowedRoles?: number[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isLoggedIn, user, permissions, permissionsLoading, permissionsError, isSuperAdmin } = useAuth();
  const { pathname } = useLocation();
  const token = localStorage.getItem("token");

  if (!token || !isLoggedIn) return <Navigate to="/signin" replace />;
  if (!user) return null;
  if (permissionsLoading) return <div className="p-6 text-sm text-slate-500">กำลังโหลดสิทธิ์...</div>;
  if (permissionsError) return <div className="p-6 text-sm text-red-600">ไม่สามารถโหลดสิทธิ์ได้ กรุณารีเฟรชหน้า</div>;

  const permission = permissionForPath(pathname);
  if (!isSuperAdmin && permission && !permissions.includes(permission)) {
    return <div className="p-6 text-sm text-slate-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  if (allowedRoles && !allowedRoles.includes(Number(user.role_id))) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
