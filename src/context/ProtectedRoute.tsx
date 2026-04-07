















import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactNode;
  allowedRoles?: number[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isLoggedIn, user } = useAuth();

  
  if (!isLoggedIn) return <Navigate to="/signin" replace />;

  
  if (!user) return null; 

  
  if (allowedRoles && !allowedRoles.includes(Number(user.role_id))) {
    return <Navigate to="/signin" replace />; 
  }

  return <>{children}</>;
};

export default ProtectedRoute;


