import { useState } from "react";
import type { Channel, User } from "@/lib/types";

// Extended channel interface with unread count
interface ExtendedChannel extends Channel {
  unreadCount?: number;
}

export function useChannels(
  userId: string,
  token: string,
  handleApiResponse: (response: Response) => Promise<unknown>
) {
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Fetch all channels for the current user
  const fetchChannels = async () => {
    try {
      console.log("Fetching channels for user:", userId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/user/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = (await handleApiResponse(response)) as Channel[];
      console.log("Fetched channels data:", JSON.stringify(data));

      // Map the channels and add unreadCount property
      const extendedChannels = data.map((channel: Channel) => {
        // Make sure channel has an adminIds field, even if empty
        if (!channel.adminIds) {
          channel.adminIds = [];
        }

        console.log(
          `Channel ${channel.name} (${channel.id}) admin IDs:`,
          channel.adminIds
        );

        return {
          ...channel,
          unreadCount: 0,
        };
      });

      console.log(
        "Processed channels with adminIds:",
        extendedChannels.map((c: Channel) => ({
          id: c.id,
          name: c.name,
          adminIds: c.adminIds || [],
          members: c.members || [],
        }))
      );

      setChannels(extendedChannels);
      return extendedChannels;
    } catch (error) {
      console.error("Error fetching channels:", error);
      return [];
    }
  };

  // Fetch all members of a specific channel with their details
  const fetchChannelMembers = async (
    channelId: string,
    currentUser: User | null,
    usersMap: Record<string, User>,
    setUsersMap: (usersMap: Record<string, User>) => void
  ) => {
    try {
      const selectedChannel = channels.find((c) => c.id === channelId);
      if (
        !selectedChannel ||
        !selectedChannel.members ||
        selectedChannel.members.length === 0
      ) {
        console.log("No members found for this channel");
        return;
      }

      console.log(
        `Fetching details for ${selectedChannel.members.length} members`
      );

      // Create a copy of the current usersMap
      const updatedUsersMap = { ...usersMap };

      // Add current user to usersMap if not already there
      if (currentUser && !updatedUsersMap[currentUser.id]) {
        updatedUsersMap[currentUser.id] = currentUser;
      }

      // Fetch details for each member not already in the usersMap
      const fetchPromises = selectedChannel.members
        .filter(
          (memberId) =>
            !updatedUsersMap[memberId] && memberId !== currentUser?.id
        )
        .map(async (memberId) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/${memberId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              console.error(
                `Failed to fetch user ${memberId}: ${response.statusText}`
              );
              return null;
            }

            const userData = await response.json();
            return userData;
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            return null;
          }
        });

      const results = await Promise.all(fetchPromises);

      // Add fetched users to the map
      results.forEach((user) => {
        if (user && user.id) {
          updatedUsersMap[user.id] = user;
        }
      });

      // Update the usersMap state
      setUsersMap(updatedUsersMap);
      console.log(
        `Updated usersMap with ${Object.keys(updatedUsersMap).length} users`
      );
    } catch (error) {
      console.error("Error fetching channel members:", error);
    }
  };

  // Create a new channel
  const createChannel = async (name: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/create-channel?userId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
          }),
        }
      );

      const data = (await handleApiResponse(response)) as Channel;
      const extendedChannel: ExtendedChannel = { ...data, unreadCount: 0 };
      setChannels((prev) => [...prev, extendedChannel]);
      return data;
    } catch (error) {
      console.error("Error creating channel:", error);
      return null;
    }
  };

  // Get a specific channel by ID
  const getChannelById = (channelId: string): Channel | null => {
    return channels.find((c) => c.id === channelId) || null;
  };

  return {
    channels,
    setChannels,
    selectedChannel,
    setSelectedChannel,
    fetchChannels,
    fetchChannelMembers,
    createChannel,
    getChannelById,
  };
}
