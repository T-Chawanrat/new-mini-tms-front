import { useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { type UserType, useAuth } from "../../context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import AxiosInstance from "../../utils/AxiosInstance";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import WarehouseSelectionModal, { type WarehouseOption } from "./WarehouseSelectionModal";

type WarehouseSelectionState = {
  selectionToken: string;
  warehouses: WarehouseOption[];
};

type LoginResult = {
  token?: string;
  user?: UserType;
};

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [warehouseError, setWarehouseError] = useState("");
  const [selectingWarehouse, setSelectingWarehouse] = useState(false);
  const [warehouseSelection, setWarehouseSelection] = useState<WarehouseSelectionState | null>(null);
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useAuth();

  const completeLogin = (data: LoginResult) => {
    if (!data.token || !data.user) {
      setLoginError("ข้อมูลเข้าสู่ระบบไม่ครบถ้วน");
      return;
    }

    localStorage.setItem("token", data.token);
    AxiosInstance.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setUser(data.user);
    setIsLoggedIn(true);
    navigate("/", { replace: true });
  };

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");

    if (!username || !password) {
      setLoginError("Username and password are required.");
      return;
    }

    try {
      const response = await AxiosInstance.post("/login", { username, password });
      const data = response.data;

      if (data.selection_required && data.selection_token && Array.isArray(data.warehouses)) {
        setWarehouseSelection({
          selectionToken: data.selection_token,
          warehouses: data.warehouses,
        });
        setWarehouseError("");
        return;
      }

      if (data.token && data.user) {
        completeLogin(data);
        return;
      }

      setLoginError(data.message || "Username or password incorrect");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setLoginError(error.response?.data?.message || "An error occurred. Please try again.");
      } else {
        setLoginError("An unknown error occurred.");
      }
    }
  };

  const handleWarehouseSelect = async (warehouse: WarehouseOption) => {
    if (!warehouseSelection) return;

    try {
      setSelectingWarehouse(true);
      setWarehouseError("");

      const response = await AxiosInstance.post("/select-warehouse", {
        selection_token: warehouseSelection.selectionToken,
        warehouse_id: warehouse.warehouse_id,
      });

      completeLogin(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setWarehouseError(error.response?.data?.message || "ไม่สามารถเลือก Warehouse ได้");
      } else {
        setWarehouseError("ไม่สามารถเลือก Warehouse ได้");
      }
    } finally {
      setSelectingWarehouse(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">Sign In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enter your username and password to sign in!</p>
          </div>

          <form onSubmit={handleSignIn}>
            <div className="space-y-6">
              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && <div className="text-sm text-red-500">{loginError}</div>}

              <Button className="w-full" size="sm">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>

      <WarehouseSelectionModal
        isOpen={warehouseSelection !== null}
        warehouses={warehouseSelection?.warehouses || []}
        loading={selectingWarehouse}
        error={warehouseError}
        onSelect={(warehouse) => void handleWarehouseSelect(warehouse)}
        onCancel={() => {
          if (selectingWarehouse) return;
          setWarehouseSelection(null);
          setWarehouseError("");
        }}
      />
    </div>
  );
}
