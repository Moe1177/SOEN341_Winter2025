"use client";
import React, { useState } from "react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";


export default function SignupFormDemo() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="rounded-none md:rounded-2xl p-6 md:p-10 shadow-input bg-white dark:bg-black min-h-[450px] flex flex-col">
      {/* Tabs for switching between Sign In and Sign Up */}
      <div className="flex justify-center mb-6">
        <button
          className={`px-6 py-2 font-medium rounded-l-lg transition-all ${!isSignUp ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          onClick={() => setIsSignUp(false)} // Sign In is on the left, so false
        >
          Sign In
        </button>
        <button
          className={`px-6 py-2 font-medium rounded-r-lg transition-all ${isSignUp ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          onClick={() => setIsSignUp(true)} // Sign Up is on the right, so true
        >
          Sign Up
        </button>
      </div>

      <div className="flex-grow">
        {isSignUp ? <SignupForm /> : <SigninForm />}
      </div>
    </div>
  );
}


/* Sign Up Form */
function SignupForm() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touchedFields, setTouchedFields] = useState({ userName: false, email: false, password: false });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }
    console.log("Sign-up form submitted", { userName, email, password });
  };

  const handleBlur = (field: string) => {
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
              setEmailError(""); // Clear error while typing
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
        disabled={!userName || !email || !password || !!emailError}
      >
        Sign Up &rarr;
      </button>
    </form>
  );
}

/* Sign In Form */
function SigninForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touchedFields, setTouchedFields] = useState({ username: false, password: false });

  const handleSubmitSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Sign-in form submitted", { username, password });
  };

  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <form className="space-y-6 w-[350px] mx-auto" onSubmit={handleSubmitSignIn}>
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
        disabled={!username || !password}
      >
        Sign In &rarr;
      </button>
    </form>
  );
}


/* Reusable Label & Input Container */
const LabelInputContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col space-y-2 w-full max-w-2xl mx-auto">{children}</div>;
};
