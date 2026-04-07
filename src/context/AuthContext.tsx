import React, { createContext, useState, useContext, ReactNode } from "react";

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
    () => localStorage.getItem("isLoggedIn") === "true"
  );

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
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, setUser, setIsLoggedIn, logout }}
    >
      {children}
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
