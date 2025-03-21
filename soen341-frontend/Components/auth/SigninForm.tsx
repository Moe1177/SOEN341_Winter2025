"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { useRouter } from "next/navigation";
import LabelInputContainer from "../ui/LabelInputContainer";

interface SigninFormProps {
  showToast: (message: string, type: "success" | "error") => void;
}

function SigninForm({ showToast }: SigninFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touchedFields, setTouchedFields] = useState({
    username: false,
    password: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmitSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        username: username,
        password: password,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/login?${params.toString()}`,
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
          errorMessage = errorData.message || "Login failed";
        } else {
          errorMessage = (await response.text()) || "Login failed";
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      console.log("Login successful", responseData);

      if (typeof window !== "undefined") {
        if (responseData && responseData.token) {
          localStorage.setItem("authToken", responseData.token);
        }

        if (responseData && responseData.user) {
          localStorage.setItem(
            "currentUser",
            JSON.stringify(responseData.user)
          );

          // Store the user ID in localStorage for easy access
          if (responseData.user.id) {
            localStorage.setItem("currentUserId", responseData.user.id);
          }
        }
      }

      showToast("Login successful!", "success");

      setTimeout(() => {
        router.push("/chat");
      }, 1000);
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

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form className="space-y-5" onSubmit={handleSubmitSignIn}>
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <LabelInputContainer>
          <Label htmlFor="username" className="text-white text-sm mb-1.5">
            Username <span className="text-red-400">*</span>
          </Label>
          <Input
            id="username"
            placeholder="Enter your username"
            type="text"
            className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleBlur("username")}
          />
          {touchedFields.username && !username && (
            <p className="text-red-400 text-xs mt-1">Username is required.</p>
          )}
        </LabelInputContainer>

        <LabelInputContainer>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="password" className="text-white text-sm">
              Password <span className="text-red-400">*</span>
            </Label>
            <a href="#" className="text-blue-400 hover:text-blue-300 text-xs">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            className="w-full h-11 text-white bg-[#1c1f45]/50 border-[#36327e]/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-md"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
          />
          {touchedFields.password && !password && (
            <p className="text-red-400 text-xs mt-1">Password is required.</p>
          )}
        </LabelInputContainer>

        <button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 block w-full text-white rounded-md h-11 font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 mt-6"
          type="submit"
          disabled={!username || !password || isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In →"}
        </button>
      </form>
    </div>
  );
}

export default SigninForm;
