"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import LabelInputContainer from "../ui/LabelInputContainer";
import { Loader2 } from "lucide-react";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface TouchedFields {
  userName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword:boolean
}

interface SignupFormProps {
  setAuthState: (state: "signin" | "signup" | "verify") => void;
  setVerificationEmail: (email: string) => void;
  setVerificationUsername: (username: string) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

function SignupForm({
  setAuthState,
  setVerificationEmail,
  setVerificationUsername,
  showToast,
}: SignupFormProps) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [touchedFields, setTouchedFields] = useState({
    userName: false,
    email: false,
    password: false,
    confirmPassword:false
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        username: userName,
        email: email,
        password: password,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/register?${params.toString()}`,
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
          errorMessage = errorData.message || "Registration failed";
        } else {
          errorMessage = (await response.text()) || "Registration failed";
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Sign-up successful", data);
      } else {
        const message = await response.text();
        console.log("Sign-up successful", message);
      }

      showToast(
        "Registration successful! Please verify your account.",
        "success"
      );

      setVerificationEmail(email);
      setVerificationUsername(userName);
      setAuthState("verify");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
        setEmailError(error.message || "Login failed. Please try again.");
        showToast(error.message || "Login failed. Please try again.", "error");
      } else {
        console.error("Unexpected error:", error);
        setEmailError("An unexpected error occurred. Please try again.");
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleBlur = (field: keyof TouchedFields) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <LoadingOverlay
        isLoading={isLoading}
        message="Creating your account..."
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label htmlFor="username" className="text-white text-sm mb-1.5">
            User Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="username"
            placeholder="JohnDoe"
            type="text"
            className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={() => handleBlur("userName")}
            disabled={isLoading}
          />
          {touchedFields.userName && !userName && (
            <p className="text-red-400 text-xs mt-1">User Name is required.</p>
          )}
        </LabelInputContainer>

        <LabelInputContainer>
          <Label htmlFor="email" className="text-white text-sm mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            placeholder="your-email@example.com"
            type="email"
            className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            onBlur={() => handleBlur("email")}
            disabled={isLoading}
          />
          {touchedFields.email && !email && (
            <p className="text-red-400 text-xs mt-1">Email is required.</p>
          )}
          {emailError && (
            <p className="text-red-400 text-xs mt-1">{emailError}</p>
          )}
        </LabelInputContainer>

        <LabelInputContainer>
      {/* Password Field */}
      <Label htmlFor="password" className="text-white text-sm mb-1.5">
        Password <span className="text-red-400">*</span>
      </Label>
      <div className="relative mb-4">
        <Input
          id="password"
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur("password")}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {touchedFields.password && !password && (
        <p className="text-red-400 text-xs mt-1">Password is required.</p>
      )}

      {/* Confirm Password Field */}
      <Label htmlFor="confirmPassword" className="text-white text-sm mb-1.5">
        Confirm Password <span className="text-red-400">*</span>
      </Label>
      <div className="relative mb-4">
        <Input
          id="confirmPassword"
          placeholder="••••••••"
          type={showConfirmPassword ? "text" : "password"}
          className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {touchedFields.confirmPassword && !confirmPassword && (
        <p className="text-red-400 text-xs mt-1">Confirm password is required.</p>
      )}
      {touchedFields.confirmPassword && password !== confirmPassword && confirmPassword && (
        <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>
      )}
        </LabelInputContainer>

        <button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 w-full text-white rounded-md h-11 font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 mt-6 flex items-center justify-center"
          type="submit"
          disabled={
            !userName || !email || !password || !!emailError || isLoading
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            "Sign Up →"
          )}
        </button>
      </form>
    </div>
  );
}

export default SignupForm;
