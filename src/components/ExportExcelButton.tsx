import { useState } from "react";
import { FileDown } from "lucide-react";
import { ExportExcel } from "../utils/ExportExcel";

interface ExportExcelButtonProps {
  url: string;
  filename: string;
  label?: string;
}

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  url,
  filename,
  label,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await ExportExcel({ url, filename });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="
    inline-flex items-center gap-2
    px-4 py-2
    rounded-full
    bg-blue-600 text-white font-medium
    shadow-sm transition
    hover:bg-blue-700
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-blue-300
  "
    >
      <FileDown className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      <span className="hidden md:inline">{label || "Export Excel"}</span>
    </button>
  );
};

export default ExportExcelButton;
