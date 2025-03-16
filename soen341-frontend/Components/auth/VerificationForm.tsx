"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import LabelInputContainer from "../ui/LabelInputContainer";

interface VerificationFormProps {
  email: string;
  username: string;
  setAuthState: (state: "signin" | "signup" | "verify") => void;
  showToast: (message: string, type: "success" | "error") => void;
}

function VerificationForm({
  email,
  username,
  setAuthState,
  showToast,
}: VerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!verificationCode) {
      setError("Verification code is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        username: username,
        code: verificationCode,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/verify-code?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || "Verification failed";
        } else {
          errorMessage = (await response.text()) || "Verification failed";
        }

        throw new Error(errorMessage);
      }

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      console.log("Verification successful", responseData);

      showToast(
        "Account verified successfully! You can now sign in.",
        "success"
      );

      setAuthState("signin");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
        setError(error.message || "Login failed. Please try again.");
        showToast(error.message || "Login failed. Please try again.", "error");
      } else {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[350px] mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        Verify Your Account
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        We&apos;ve sent a verification code to <strong>{email}</strong>. Please
        enter the code below to complete your registration.
      </p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label htmlFor="verificationCode">
            Verification Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="verificationCode"
            placeholder="Enter your verification code"
            type="text"
            className="w-full"
            required
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </LabelInputContainer>

        <button
          className="bg-gradient-to-br from-black to-neutral-600 dark:from-zinc-900 dark:to-zinc-900 block w-full text-white rounded-md h-12 font-medium shadow-input disabled:opacity-50"
          type="submit"
          disabled={!verificationCode || isLoading}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>

        <p className="text-center text-sm">
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => setAuthState("signup")}
          >
            Back to Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}

export default VerificationForm;
