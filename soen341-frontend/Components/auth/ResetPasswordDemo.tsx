"use client";
import React, { useState } from "react";
import Toast from "./Toast";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordDemo() {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <>
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={handleCloseToast}
        type={toast.type}
      />
      <div className="rounded-xl p-5 sm:p-6 shadow-xl bg-[#0e1230]/90 backdrop-blur-md border border-[#36327e]/30 flex flex-col w-full max-w-[450px] mx-auto overflow-hidden">
        {/* Small welcome message only visible on mobile/tablet in lg:hidden screens */}
        <div className="flex lg:hidden justify-center mb-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">
              Welcome to Dialogos
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              The Future of Digital Communication
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ResetPasswordForm showToast={showToast} />
        </div>
      </div>
    </>
  );
}
