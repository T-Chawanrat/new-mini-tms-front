import React from "react";

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
}

const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose, image }) => {
  if (!isOpen || !image) return null;

  return (
    <div
      className="fixed inset-0 z-100000 flex items-center justify-center bg-white/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={image} alt="Enlarged" className="max-w-full max-h-[800px] rounded" />
        <button
          className="absolute top-4 right-4 bg-gray-300 text-black rounded-full p-2"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TrackingModal;