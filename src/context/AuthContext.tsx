import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import AxiosInstance, { setTokenExpiredHandler } from "../services/apiClient";
import TokenExpiredModal from "../components/tms/modal/TokenExpiredModal";

export interface UserType {
  id: number;
  user_id?: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role_id: number;
  warehouse_id: number | null;
  warehouse_name?: string | null;
  customer_id: number | null;
  license_no?: string | null;
  license_expire?: string | null;
  last_login?: string | null;
  zones?: any[];
  vehicles?: any[];
  license_plate?: string;
  dc_name?: number;
}

interface AuthContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  logout: () => void;
  tokenExpired: boolean;
  triggerTokenExpired: () => void;
  permissions: string[];
  permissionsLoading: boolean;
  permissionsError: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return true;
    }

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const payload = JSON.parse(atob(base64));

    if (typeof payload.exp !== "number") {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  } catch (error) {
    console.error("decode token error:", error);
    return true;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<UserType | null>(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as UserType;
    } catch (error) {
      console.error("parse stored user error:", error);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(
    () => localStorage.getItem("isLoggedIn") === "true",
  );

  const [tokenExpired, setTokenExpired] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    setPermissions([]);
    setIsSuperAdmin(false);
    setPermissionsError(false);
    if (!isLoggedIn || !user?.id) {
      setPermissionsLoading(false);
      return;
    }
    setPermissionsLoading(true);
    AxiosInstance.get<{ permissions: string[]; is_super_admin: boolean }>("/manage/permissions/me")
      .then(({ data }) => { if (active) { setPermissions(data.permissions); setIsSuperAdmin(data.is_super_admin); } })
      .catch(() => { if (active) setPermissionsError(true); })
      .finally(() => { if (active) setPermissionsLoading(false); });
    return () => { active = false; };
  }, [isLoggedIn, user?.id]);

  const clearAuthData = useCallback(() => {
    setUserState(null);
    setIsLoggedInState(false);

    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
  }, []);

  const triggerTokenExpired = useCallback(() => {
    clearAuthData();
    setTokenExpired(true);
  }, [clearAuthData]);

  useEffect(() => {
    setTokenExpiredHandler(triggerTokenExpired);
  }, [triggerTokenExpired]);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        clearAuthData();
        return;
      }

      if (isTokenExpired(token)) {
        triggerTokenExpired();
      }
    };

    checkTokenExpiration();

    const interval = window.setInterval(checkTokenExpiration, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [triggerTokenExpired]);

  const setUser = (userData: UserType | null) => {
    setUserState(userData);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  const setIsLoggedIn = (val: boolean) => {
    setIsLoggedInState(val);

    if (val) {
      localStorage.setItem("isLoggedIn", "true");
    } else {
      localStorage.removeItem("isLoggedIn");
    }
  };

  const logout = () => {
    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        logout,
        tokenExpired,
        triggerTokenExpired,
        permissions,
        permissionsLoading,
        permissionsError,
        isSuperAdmin,
      }}
    >
      {children}

      <TokenExpiredModal isOpen={tokenExpired} />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
