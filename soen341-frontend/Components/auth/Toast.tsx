"use client";
import React from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  type: string;
}

const Toast = ({ message, visible, onClose, type = "success" }: ToastProps) => {
  if (!visible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`fixed ${bgColor} text-white p-4 rounded-md shadow-lg z-[9999] flex justify-between items-center min-w-[300px] sm:right-4 sm:top-4 top-4 left-1/2 sm:left-auto sm:transform-none -translate-x-1/2`}
    >
      <div>{message}</div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  );
};

export default Toast;
