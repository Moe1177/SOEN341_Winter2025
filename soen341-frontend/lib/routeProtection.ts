import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Add a small delay to allow the auth token to be processed
      const timer = setTimeout(() => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("currentUserId");

        if (!token || !userId) {
          console.log("User not authenticated, redirecting to login");
          router.push("/login");
        }
        setIsChecking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [router]);

  return { isChecking };
}

/**
 * Hook to redirect authenticated users away from auth pages
 * Redirects to chat if user is already authenticated
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Add a small delay to allow the auth token to be processed
      const timer = setTimeout(() => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("currentUserId");

        if (token && userId) {
          console.log("User already authenticated, redirecting to chat");
          router.push("/chat");
        } else {
          setIsChecking(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [router]);

  return { isChecking };
}
