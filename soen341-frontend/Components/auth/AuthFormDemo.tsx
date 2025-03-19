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
    <>
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={handleCloseToast}
        type={toast.type}
      />
      <div className="rounded-xl p-6 sm:p-7 md:p-8 shadow-xl bg-[#0e1230]/90 backdrop-blur-md border border-[#36327e]/30 min-h-[480px] flex flex-col w-full max-w-[450px] mx-auto overflow-hidden">
        {/* Small welcome message only visible on mobile/tablet in lg:hidden screens */}
        <div className="flex lg:hidden justify-center mb-7">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">
              Welcome to Dialogos
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              The Future of Digital Communication
            </p>
          </div>
        </div>

        {authState !== "verify" && (
          <div className="flex justify-center mb-7">
            <div className="flex w-full max-w-[300px] bg-[#1c1f45]/60 backdrop-blur-sm rounded-lg p-1 border border-[#36327e]/30">
              <button
                className={`flex-1 py-2.5 font-medium rounded-lg transition-all text-sm ${
                  authState === "signin"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-300"
                }`}
                onClick={() => setAuthState("signin")}
              >
                Sign In
              </button>

              <button
                className={`flex-1 py-2.5 font-medium rounded-lg transition-all text-sm ${
                  authState === "signup"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-300"
                }`}
                onClick={() => setAuthState("signup")}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        <div className="flex-grow flex justify-center">
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
    </>
  );
}
