import React, { useCallback } from "react";
import { Channel, User } from "@/lib/types";

// Define the hook to take props for setChannels and setUsersMap
const useConversations = (
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
  setUsersMap: React.Dispatch<React.SetStateAction<Record<string, User>>>,
  token: string
) => {
  const promoteToAdmin = useCallback(
    async (userId: string, channelId: string) => {
      console.log(`Promoting user ${userId} to admin for channel ${channelId}`);
      try {
        // The backend expects query parameters, not a JSON body
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/promote?channelId=${channelId}&userIdToPromote=${userId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to promote user: ${errorText}`);
          return false;
        }

        setChannels((prev) => {
          return prev.map((channel) => {
            if (channel.id === channelId) {
              console.log(
                `Adding ${userId} to adminIds for channel ${channel.name}`
              );
              
              const adminIds = channel.adminIds || [];
              
              if (!adminIds.includes(userId)) {
                return {
                  ...channel,
                  adminIds: [...adminIds, userId],
                };
              }
            }
            return channel;
          });
        });

        
        setUsersMap((prev) => {
          const user = prev[userId];
          if (user) {
            console.log(
              `Updating usersMap for user ${user.username} with new admin status for channel ${channelId}`
            );
            
            const adminsForWhichChannels = user.adminsForWhichChannels || [];
            // Only add if not already there
            if (!adminsForWhichChannels.includes(channelId)) {
              return {
                ...prev,
                [userId]: {
                  ...user,
                  adminsForWhichChannels: [
                    ...adminsForWhichChannels,
                    channelId,
                  ],
                },
              };
            }
          }
          return prev;
        });

        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 200);
        });
      } catch (error) {
        console.error("Error promoting user to admin:", error);
        return false;
      }
    },
    [setChannels, setUsersMap, token]
  );

  return { promoteToAdmin };
};

export default useConversations;
