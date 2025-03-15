import React from "react";
import type { User, Channel } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Hash, Plus, Settings, MessageSquare } from "lucide-react";
import { Input } from "@/Components/ui/input"; // ✅ Import Input component
import { useState } from "react";





interface ExtendedChannel extends Channel {
  unreadCount?: number;
}

interface DirectMessageDisplay {
  id: string;
  participant: User;
  unreadCount?: number;
}

interface SidebarProps {
  channels: ExtendedChannel[];
  directMessages: DirectMessageDisplay[];
  activeConversationId: string | null;
  onConversationSelect: (conversationId: string, isChannel: boolean) => void;
  onCreateChannel: () => void;
  onCreateDirectMessage: () => void;
  onViewChannelInvite: (channel: Channel) => void;
  currentUser: User | null;
  
}


export function Sidebar({
  channels,
  directMessages,
  activeConversationId,
  onConversationSelect,
  onCreateChannel,
  onCreateDirectMessage,
  onViewChannelInvite,
  currentUser,
}: SidebarProps) {
  const [inviteCode, setInviteCode] = useState("");

  const handleJoinChannel = async () => {
    if (!inviteCode.trim()) {
      alert("Please enter a valid invite code.");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to join a channel.");
      return;
    }

    try {
      console.log("Joining channel with invite code:", inviteCode);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/channels/join?inviteCode=${inviteCode}&userId=${currentUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Failed to join channel:", response.body);
        throw new Error("Failed to join channel. Please check the invite code.");
      }

      const updatedChannel = await response.json();
      alert(`Joined channel: ${updatedChannel.name}`);
      setInviteCode("");
    } catch (error) {
      console.error("Error joining channel:", error);
      alert("Error joining channel. Please try again.");
    }
  };

  
  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full bg-muted/20">
      <div className="p-3 flex items-center justify-between border-b">
        <div className="font-semibold">Workspace</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="text-xs font-semibold text-muted-foreground">
              CHANNELS
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onCreateChannel}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {channels.length > 0 ? (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center group">
                <Button
                  variant={
                    activeConversationId === channel.id ? "secondary" : "ghost"
                  }
                  className="w-full justify-start mb-1 px-2 font-normal relative"
                  onClick={() => onConversationSelect(channel.id, true)}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">
                    {channel.name || "Unnamed Channel"}
                  </span>
                  {channel.members && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {channel.members.length}
                    </span>
                  )}
                  {/* {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {channel.unreadCount}
                    </span>
                  )} */}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onViewChannelInvite(channel)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground flex flex-col items-center">
              <Hash className="h-8 w-8 mb-1 opacity-50" />
              <p>No channels yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onCreateChannel}
              >
                Create a channel
              </Button>
            </div>
          )}
<div className="flex items-center space-x-2 px-2 py-2">
  <Input
    type="text"
    placeholder="Enter invite code"
    value={inviteCode}
    onChange={(e) => setInviteCode(e.target.value)}
    className="flex-1"
  />
  <Button onClick={handleJoinChannel} variant="default">
    Join
  </Button>
</div>



          <div className="flex items-center justify-between px-2 py-1.5 mt-4">
            <div className="text-xs font-semibold text-muted-foreground">
              DIRECT MESSAGES
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onCreateDirectMessage}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {directMessages.length > 0 ? (
            directMessages.map((dm) => (
              <Button
                key={dm.id}
                variant={activeConversationId === dm.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 px-2 font-normal relative"
                onClick={() => onConversationSelect(dm.id, false)}
              >
                <span className="relative mr-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>
                      {dm.participant?.username
                        ? dm.participant.username.charAt(0)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
                      dm.participant?.status === "ONLINE"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  />
                </span>
                <span className="flex-1 truncate">
                  {dm.participant?.username || "Unknown User"}
                </span>
                {dm.unreadCount && dm.unreadCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {dm.unreadCount}
                  </span>
                )}
              </Button>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground flex flex-col items-center">
              <MessageSquare className="h-8 w-8 mb-1 opacity-50" />
              <p>No DMs yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onCreateDirectMessage}
              >
                Start a conversation
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {currentUser ? (
        <div className="p-3 border-t flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              {currentUser.username ? currentUser.username.charAt(0) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <div className="text-sm font-medium">
              {currentUser.username || "Anonymous"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
              {currentUser.status === "ONLINE" ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <div className="text-sm font-medium">Loading user...</div>
            <div className="text-xs text-muted-foreground">Connecting...</div>
          </div>
        </div>
      )}
    </div>
  );
}
