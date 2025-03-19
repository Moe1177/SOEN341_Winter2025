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
    <form className="space-y-6 w-[350px] mx-auto" onSubmit={handleSubmitSignIn}>
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <LabelInputContainer>
        <Label htmlFor="username">
          Username <span className="text-red-500">*</span>
          <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">
            This field is required
          </span>
        </Label>
        <div className="relative group">
          <Input
            id="username"
            placeholder="Enter your username"
            type="text"
            className="w-full"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleBlur("username")}
          />
          {touchedFields.username && !username && (
            <p className="text-red-500 text-sm">Username is required.</p>
          )}
        </div>
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
        disabled={!username || !password || isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In →"}
      </button>
    </form>
  );
}

export default SigninForm;
