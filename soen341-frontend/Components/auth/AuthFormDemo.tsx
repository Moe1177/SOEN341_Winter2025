"use client";
import React, { useState } from "react";
import Toast from "./Toast";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";
import VerificationForm from "./VerificationForm";

export default function AuthFormDemo() {
  const [authState, setAuthState] = useState<"signin" | "signup" | "verify">(
    "signin"
  );
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUsername, setVerificationUsername] = useState("");
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
    <div className="rounded-none md:rounded-2xl p-6 md:p-10 shadow-input bg-white dark:bg-black min-h-[450px] flex flex-col">
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={handleCloseToast}
        type={toast.type}
      />

      {authState !== "verify" && (
        <div className="flex justify-center mb-6">
          <button
            className={`px-6 py-2 font-medium rounded-l-lg transition-all ${
              authState === "signin"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setAuthState("signin")}
          >
            Sign In
          </button>

          <button
            className={`px-6 py-2 font-medium rounded-r-lg transition-all ${
              authState === "signup"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setAuthState("signup")}
          >
            Sign Up
          </button>
        </div>
      )}

      <div className="flex-grow">
        {authState === "signup" && (
          <SignupForm
            setAuthState={setAuthState}
            setVerificationEmail={setVerificationEmail}
            setVerificationUsername={setVerificationUsername}
            showToast={showToast}
          />
        )}
        {authState === "signin" && <SigninForm showToast={showToast} />}
        {authState === "verify" && (
          <VerificationForm
            email={verificationEmail}
            username={verificationUsername}
            setAuthState={setAuthState}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
