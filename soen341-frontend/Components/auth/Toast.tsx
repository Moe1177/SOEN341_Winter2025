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
      className={`fixed top-4 right-4 ${bgColor} text-white p-3 sm:p-4 rounded-md shadow-lg z-50 flex justify-between items-center w-[calc(100%-32px)] sm:w-auto sm:min-w-[300px] max-w-[500px] text-sm sm:text-base`}
    >
      <div>{message}</div>
      <button onClick={onClose} className="ml-3 sm:ml-4 text-white hover:text-gray-200 text-xl">
        &times;
      </button>
    </div>
  );
};

export default Toast;
