import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Validates token with the backend API
 * @returns true if token is valid, false otherwise
 */
async function validateTokenWithBackend(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/currentUser`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

/**
 * Clears all authentication data from localStorage
 */
function clearAuthData() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("currentUsername");
  localStorage.removeItem("currentUser");
}

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
      const timer = setTimeout(async () => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("currentUserId");

        if (!token || !userId) {
          console.log("User not authenticated, redirecting to login");
          router.push("/login");
        } else {
          // Validate token with backend
          const isTokenValid = await validateTokenWithBackend(token);

          if (!isTokenValid) {
            console.log(
              "Token is invalid or expired, clearing auth data and redirecting to login"
            );
            clearAuthData();
            router.push("/login");
            return;
          }

          setIsChecking(false);
        }
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
      const timer = setTimeout(async () => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("currentUserId");

        if (token && userId) {
          // Validate token with backend
          const isTokenValid = await validateTokenWithBackend(token);

          if (!isTokenValid) {
            console.log("Token is invalid or expired, clearing auth data");
            clearAuthData();
            setIsChecking(false);
            return;
          }

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
