import { useState, useEffect } from "react";
import type { User } from "@/lib/types";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Initialize the token, userId, and user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }

      const storedUserId = localStorage.getItem("currentUserId");
      if (storedUserId) {
        setUserId(storedUserId);
      }

      const storedUsername = localStorage.getItem("currentUsername");
      if (storedUsername && !currentUser) {
        try {
          // Try to get the complete user object from localStorage
          const storedUser = localStorage.getItem("currentUser");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            if (parsedUser.id) {
              setUserId(parsedUser.id);
            }
          } else {
            // Fallback to creating a minimal user object
            setCurrentUser({
              id: storedUserId || "",
              username: storedUsername,
              email: "",
              password: "",
              channelIds: [],
              directMessageIds: [],
              adminsForWhichChannels: [],
              status: "ONLINE" as "ONLINE" | "OFFLINE",
            });
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
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

      if (typeof window !== "undefined") {
        if (data && data.username) {
          localStorage.setItem("currentUsername", data.username);
        }
        if (data && data.id) {
          localStorage.setItem("currentUserId", data.id);
          setUserId(data.id);
        }
      }

      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching current user:", error);

      // Only use fallback if absolutely necessary
      if (!currentUser && typeof window !== "undefined") {
        const storedUserId = localStorage.getItem("currentUserId");
        const storedUsername = localStorage.getItem("currentUsername");

        if (storedUserId && storedUsername) {
          const fallbackUser = {
            id: storedUserId,
            username: storedUsername,
            email: "",
            password: "",
            channelIds: [],
            directMessageIds: [],
            adminsForWhichChannels: [],
            status: "ONLINE" as "ONLINE" | "OFFLINE",
          };
          setCurrentUser(fallbackUser);
          setUserId(storedUserId);
        }
      }
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
