"use client";
import React, { useState } from "react";
import { Label } from "../Components/ui/label";
import { Input } from "../Components/ui/input";


const Toast = ({ message, visible, onClose, type = "success" }) => {
  if (!visible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-md shadow-lg z-50 flex justify-between items-center min-w-[300px]`}>
        <div>{message}</div>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          &times;
        </button>
      </div>
  );
};

export default function AuthFormDemo() {
  const [authState, setAuthState] = useState("signin"); 
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUsername, setVerificationUsername] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
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
                      authState === "signin" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  onClick={() => setAuthState("signin")
                  }
                  
              >
                Sign In
              </button>
              
              <button
                  className={`px-6 py-2 font-medium rounded-r-lg transition-all ${
                      authState === "signup" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
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
          {authState === "signin" && (
              <SigninForm
                  setAuthState={setAuthState}
                  showToast={showToast}
              />
          )}
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

function VerificationForm({ email, username, setAuthState, showToast }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
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
        code: verificationCode
      });

      const response = await fetch(`http://localhost:8080/api/auth/verify-code?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || "Verification failed";
        } else {
          errorMessage = await response.text() || "Verification failed";
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

      showToast("Account verified successfully! You can now sign in.", "success");

      setAuthState("signin");

    } catch (error) {
      console.error("Verification error:", error);
      setError(error.message || "Verification failed. Please try again.");
      showToast(error.message || "Verification failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="w-[350px] mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Verify Your Account</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We've sent a verification code to <strong>{email}</strong>.
          Please enter the code below to complete your registration.
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

function SignupForm({ setAuthState, setVerificationEmail, setVerificationUsername, showToast }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touchedFields, setTouchedFields] = useState({ userName: false, email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  const handleSubmit = async (e) => {
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
        password: password
      });

      const response = await fetch(`http://localhost:8080/api/auth/register?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || "Registration failed";
        } else {
          errorMessage = await response.text() || "Registration failed";
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

      showToast("Registration successful! Please verify your account.", "success");

      setVerificationEmail(email);
      setVerificationUsername(userName);
      setAuthState("verify");

    } catch (error) {
      console.error("Registration error:", error);
      setEmailError(error.message || "Registration failed. Please try again.");
      showToast(error.message || "Registration failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  return (
      <form className="space-y-6 w-[350px] mx-auto" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label htmlFor="username">
            User Name <span className="text-red-500">*</span>
            <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">This field is required</span>
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
            <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">This field is required</span>
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
            <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">This field is required</span>
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
import { useRouter } from "next/navigation"; 
function SigninForm({ setAuthState, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touchedFields, setTouchedFields] = useState({ username: false, password: false });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitSignIn = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        username: username,
        password: password
      });

      const response = await fetch(`http://localhost:8080/api/auth/login?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || "Login failed";
        } else {
          errorMessage = await response.text() || "Login failed";
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

      if (responseData && responseData.token) {
        localStorage.setItem('authToken', responseData.token);
      }
      
      if (responseData && responseData.user) {
        localStorage.setItem('currentUser', JSON.stringify(responseData.user));
      }

      showToast("Login successful!", "success");
      
      setTimeout(() => {
        window.location.href = '/direct-messaging';
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please try again.");
      showToast(error.message || "Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field) => {
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
            <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">This field is required</span>
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
            <span className="hidden group-hover:block absolute text-xs bg-black text-white rounded-md p-1 ml-2">This field is required</span>
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

const LabelInputContainer = ({ children }) => {
  return <div className="flex flex-col space-y-2 w-full max-w-2xl mx-auto">{children}</div>;
};