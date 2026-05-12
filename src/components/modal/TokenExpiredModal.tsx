import React from "react";

interface Props {
  isOpen: boolean;
}

const TokenExpiredModal: React.FC<Props> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Token หมดอายุ
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          กรุณา Login ใหม่อีกครั้ง
        </p>
        <button
          onClick={() => { window.location.href = "/tms/signin"; }}
          className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
        >
          Login ใหม่
        </button>
      </div>
    </div>
  );
};

export default TokenExpiredModal;