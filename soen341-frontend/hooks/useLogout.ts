import { useState } from "react";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);
      const token = localStorage.getItem("authToken");

      if (token) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/auth/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error("Error logging out:", await response.text());
          }
        } catch (apiError) {
          console.error("API error during logout:", apiError);
          // Continue with local logout even if API call fails
        }
      }

      // Clear localStorage items one by one to ensure all auth data is removed
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUsername");
      localStorage.removeItem("currentUser");

      // Add a small delay to ensure all state changes are processed before redirecting
      setTimeout(() => {
        // Force a hard refresh by navigating to login page with window.location
        window.location.href = "/login";
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.clear();
      window.location.href = "/login";
    } finally {
      // Note: We don't need to set isLoggingOut to false here since we're redirecting
    }
  };

  return { logout, isLoggingOut };
}
