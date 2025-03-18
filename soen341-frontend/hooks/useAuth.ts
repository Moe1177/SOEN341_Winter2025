import { useState, useEffect } from "react";
import type { User } from "@/lib/types";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");

  // Initialize the user's ID from environment variable
  const userId = process.env.NEXT_PUBLIC_USER_ID!;

  // Initialize the token and user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }

      const storedUsername = localStorage.getItem("currentUsername");
      if (storedUsername && !currentUser) {
        setCurrentUser({
          id: userId,
          username: storedUsername,
          email: "",
          password: "",
          channelIds: [],
          directMessageIds: [],
          adminsForWhichChannels: [],
          status: "ONLINE",
        });
      }
    }
  }, []);

  // Helper function to handle API responses
  const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error (${response.status}): ${text}`);
    }
    return response.json();
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Make the request to the correct endpoint with Authorization header
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

      const data = await handleApiResponse(response);

      if (typeof window !== "undefined" && data && data.username) {
        localStorage.setItem("currentUsername", data.username);
      }

      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching current user:", error);

      // For testing purposes fallback user
      setCurrentUser({
        id: userId,
        username: "TestUser",
        email: "test@example.com",
        password: "",
        channelIds: [],
        directMessageIds: [],
        adminsForWhichChannels: [],
        status: "ONLINE",
      });
    }
  };

  return {
    currentUser,
    setCurrentUser,
    token,
    userId,
    fetchCurrentUser,
    handleApiResponse,
  };
}
