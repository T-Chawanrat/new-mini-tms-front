import React from "react";

interface Props {
  isOpen: boolean;
}

const TokenExpiredModal: React.FC<Props> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
          Token หมดอายุ
        </h2>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          กรุณา Login ใหม่อีกครั้ง
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.replace("/tms/signin");
          }}
          className="w-full rounded-lg bg-red-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-600"
        >
          Login ใหม่
        </button>
      </div>
    </div>
  );
};

export default TokenExpiredModal;