"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import LabelInputContainer from "../ui/LabelInputContainer";

interface TouchedFields {
  userName: boolean;
  email: boolean;
  password: boolean;
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
  const [emailError, setEmailError] = useState("");
  const [touchedFields, setTouchedFields] = useState({
    userName: false,
    email: false,
    password: false,
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
    <form className="space-y-6 w-[350px] mx-auto" onSubmit={handleSubmit}>
      <LabelInputContainer>
        <Label htmlFor="username">
          User Name <span className="text-red-500">*</span>
          <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">
            This field is required
          </span>
        </Label>
        <div className="relative group">
          <Input
            id="username"
            placeholder="JohnDoe"
            type="text"
            className="w-full"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={() => handleBlur("userName")}
          />
          {touchedFields.userName && !userName && (
            <p className="text-red-500 text-sm">User Name is required.</p>
          )}
        </div>
      </LabelInputContainer>

      <LabelInputContainer>
        <Label htmlFor="email">
          Email Address <span className="text-red-500">*</span>
          <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">
            This field is required
          </span>
        </Label>
        <div className="relative group">
          <Input
            id="email"
            placeholder="your-email@example.com"
            type="email"
            className="w-full"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            onBlur={() => handleBlur("email")}
          />
          {touchedFields.email && !email && (
            <p className="text-red-500 text-sm">Email is required.</p>
          )}
        </div>
        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
      </LabelInputContainer>

      <LabelInputContainer>
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
          <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">
            This field is required
          </span>
        </Label>
        <div className="relative group">
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            className="w-full"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
          />
          {touchedFields.password && !password && (
            <p className="text-red-500 text-sm">Password is required.</p>
          )}
        </div>
      </LabelInputContainer>

      <button
        className="bg-gradient-to-br from-black to-neutral-600 dark:from-zinc-900 dark:to-zinc-900 block w-full text-white rounded-md h-12 font-medium shadow-input disabled:opacity-50"
        type="submit"
        disabled={!userName || !email || !password || !!emailError || isLoading}
      >
        {isLoading ? "Processing..." : "Sign Up →"}
      </button>
    </form>
  );
}

export default SignupForm;
