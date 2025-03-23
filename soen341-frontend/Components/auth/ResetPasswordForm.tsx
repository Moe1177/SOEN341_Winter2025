"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { useRouter } from "next/navigation";
import LabelInputContainer from "../ui/LabelInputContainer";
import { Loader2 } from "lucide-react";

interface ResetPasswordFormProps {
  showToast: (message: string, type: "success" | "error") => void;
  setAuthState?: React.Dispatch<React.SetStateAction<string>>;
}

enum ResetPasswordStep {
  REQUEST_CODE = "REQUEST_CODE",
  RESET_PASSWORD = "RESET_PASSWORD",
}

function ResetPasswordForm({
  showToast,
  setAuthState,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentStep, setCurrentStep] = useState<ResetPasswordStep>(
    ResetPasswordStep.REQUEST_CODE
  );

  const [touchedFields, setTouchedFields] = useState({
    email: false,
    verificationCode: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRequestCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({email}),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || "Failed to send reset code";
        } else {
          errorMessage = (await response.text()) || "Failed to send reset code";
        }

        throw new Error(errorMessage);
      }

      showToast("Reset code sent to your email!", "success");
      setCurrentStep(ResetPasswordStep.RESET_PASSWORD);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Reset code request error:", error.message);
        setError(
          error.message || "Failed to send reset code. Please try again."
        );
        showToast(
          error.message || "Failed to send reset code. Please try again.",
          "error"
        );
      } else {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!verificationCode) {
      setError("Verification code is required");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resetCode: verificationCode,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || "Password reset failed";
        } else {
          errorMessage = (await response.text()) || "Password reset failed";
        }

        throw new Error(errorMessage);
      }

      showToast(
        "Password reset successful! You can now login with your new password.",
        "success"
      );

      // Redirect to login page after successful password reset
      setTimeout(() => {
        if (setAuthState) {
          setAuthState("signin");
        } else {
          router.push("/login");
        }
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Password reset error:", error.message);
        setError(
          error.message || "Failed to reset password. Please try again."
        );
        showToast(
          error.message || "Failed to reset password. Please try again.",
          "error"
        );
      } else {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const renderRequestCodeForm = () => (
    <form className="space-y-5" onSubmit={handleRequestCode}>
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <LabelInputContainer>
        <Label htmlFor="email" className="text-white text-sm mb-1.5">
          Email <span className="text-red-400">*</span>
        </Label>
        <Input
          id="email"
          placeholder="Enter your email"
          type="email"
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur("email")}
        />
        {touchedFields.email && !email && (
          <p className="text-red-400 text-xs mt-1">Email is required.</p>
        )}
      </LabelInputContainer>

      <button
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full text-white rounded-md h-11 font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 mt-6 flex items-center justify-center"
        type="submit"
        disabled={!email || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Sending Code...</span>
          </>
        ) : (
          "Send Reset Code →"
        )}
      </button>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form className="space-y-5" onSubmit={handleResetPassword}>
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="text-center mb-4">
        <p className="text-gray-300 text-sm">
          We&apos;ve sent a verification code to <strong>{email}</strong>.
        </p>
      </div>

      <LabelInputContainer>
        <Label htmlFor="verificationCode" className="text-white text-sm mb-1.5">
          Verification Code <span className="text-red-400">*</span>
        </Label>
        <Input
          id="verificationCode"
          placeholder="Enter verification code"
          type="text"
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          onBlur={() => handleBlur("verificationCode")}
        />
        {touchedFields.verificationCode && !verificationCode && (
          <p className="text-red-400 text-xs mt-1">
            Verification code is required.
          </p>
        )}
      </LabelInputContainer>

      <LabelInputContainer>
        <Label htmlFor="newPassword" className="text-white text-sm mb-1.5">
          New Password <span className="text-red-400">*</span>
        </Label>
        <Input
          id="newPassword"
          placeholder="Enter new password"
          type="password"
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={() => handleBlur("newPassword")}
        />
        {touchedFields.newPassword && !newPassword && (
          <p className="text-red-400 text-xs mt-1">New password is required.</p>
        )}
        {touchedFields.newPassword && newPassword && newPassword.length < 6 && (
          <p className="text-red-400 text-xs mt-1">
            Password must be at least 6 characters.
          </p>
        )}
      </LabelInputContainer>

      <LabelInputContainer>
        <Label htmlFor="confirmPassword" className="text-white text-sm mb-1.5">
          Confirm Password <span className="text-red-400">*</span>
        </Label>
        <Input
          id="confirmPassword"
          placeholder="Confirm new password"
          type="password"
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
        />
        {touchedFields.confirmPassword && !confirmPassword && (
          <p className="text-red-400 text-xs mt-1">
            Confirm password is required.
          </p>
        )}
        {touchedFields.confirmPassword &&
          confirmPassword &&
          newPassword !== confirmPassword && (
            <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>
          )}
      </LabelInputContainer>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setCurrentStep(ResetPasswordStep.REQUEST_CODE)}
          className="text-blue-400 hover:text-blue-300 text-xs"
        >
          ← Change Email
        </button>

        <button
          type="button"
          onClick={() => {
            const mockEvent = {
              preventDefault: () => {},
            } as React.FormEvent<HTMLFormElement>;
            handleRequestCode(mockEvent);
          }}
          className="text-blue-400 hover:text-blue-300 text-xs"
        >
          Resend Code
        </button>
      </div>

      <button
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full text-white rounded-md h-11 font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 mt-6 flex items-center justify-center"
        type="submit"
        disabled={
          !verificationCode ||
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword ||
          isLoading
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Resetting Password...</span>
          </>
        ) : (
          "Reset Password →"
        )}
      </button>
    </form>
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Reset Password
      </h2>

      {currentStep === ResetPasswordStep.REQUEST_CODE &&
        renderRequestCodeForm()}
      {currentStep === ResetPasswordStep.RESET_PASSWORD &&
        renderResetPasswordForm()}

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            if (setAuthState) {
              setAuthState("signin");
            } else {
              router.push("/login");
            }
          }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Remember your password? Sign in
        </button>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
