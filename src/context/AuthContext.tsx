import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { setTokenExpiredHandler } from "../utils/AxiosInstance"; // ✅ เพิ่ม
import TokenExpiredModal from "../components/modal/TokenExpiredModal";

export interface UserType {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  license_plate?: string;
  dc_name?: number;
  role_id: number;
}
interface AuthContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  logout: () => void;
  tokenExpired: boolean;
  triggerTokenExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<UserType | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoggedIn, setIsLoggedInState] = useState(
    () => localStorage.getItem("isLoggedIn") === "true",
  );
  const [tokenExpired, setTokenExpired] = useState(false);

  const triggerTokenExpired = () => {
    setUserState(null);
    setIsLoggedInState(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    setTokenExpired(true); // ✅ เปิด modal
  };

  useEffect(() => {
    setTokenExpiredHandler(triggerTokenExpired);
  }, []);

  // เพิ่มฟังก์ชันนี้ไว้นอก AuthProvider
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// เพิ่ม useEffect นี้ใน AuthProvider (วางไว้ใต้ useEffect ของ setTokenExpiredHandler)
useEffect(() => {
  const interval = setInterval(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      triggerTokenExpired();
    }
  }, 5000); // เช็คทุก 5 วินาที

  return () => clearInterval(interval);
}, []);

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
    setUserState(null);
    setIsLoggedInState(false);

    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        setUser,
        setIsLoggedIn,
        logout,
        tokenExpired,
        triggerTokenExpired,
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
