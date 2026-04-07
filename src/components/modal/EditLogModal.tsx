import React from "react";

interface LeditRow {
  pk_id: number | string;
  create_date?: string;
  value_new?: string;
  column?: string;
  first_name?: string;
  last_name?: string;
}

interface Transaction {
  id?: number | string;
  receive_code?: string;
}

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData: Transaction | Transaction[] | null;
  leditRows: LeditRow[];
  leditLoading: boolean;
  leditError: string | null;
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputSubmit: () => void;
}

const EditLogModal: React.FC<EditLogModalProps> = ({
  isOpen,
  onClose,
  modalData,
  leditRows,
  leditLoading,
  leditError,
  inputValue,
  onInputChange,
  onInputSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-lg min-w-[320px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            ประวัติการแก้ไข (Edit Log)
            {modalData &&
              !Array.isArray(modalData) &&
              (modalData.receive_code || modalData.id) && (
                <span className="ml-2 text-base text-gray-600 font-normal">
                  [{modalData.receive_code || modalData.id}]
                </span>
              )}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-900"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* input และปุ่ม เหนือตาราง */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            className="border px-2 py-1 rounded w-full"
            placeholder="หมายเหตุ"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
          />
          <button
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-1 rounded"
            onClick={onInputSubmit}
          >
            Add
          </button>
        </div>

        <div className="overflow-x-auto">
          {leditLoading && (
            <div className="text-blue-500 py-2">กำลังโหลด log แก้ไข...</div>
          )}
          {leditError && (
            <div className="text-red-500 py-2">{leditError}</div>
          )}

          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1">create_date</th>
                <th className="border px-2 py-1">value_new</th>
                <th className="border px-2 py-1">column</th>
                <th className="border px-2 py-1">first_name</th>
                <th className="border px-2 py-1">last_name</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(leditRows) && leditRows.length > 0 ? (
                leditRows.map((item, idx) => (
                  <tr key={item.pk_id ?? idx}>
                    <td className="border px-2 py-1">
                      {item.create_date || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {item.value_new || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {item.column || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {item.first_name || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {item.last_name || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border px-2 py-1 text-center" colSpan={5}>
                    ไม่มีข้อมูลการแก้ไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditLogModal;