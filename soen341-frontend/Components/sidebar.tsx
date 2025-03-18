import React from "react";
import type { User, Channel } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Hash, Plus, Settings, MessageSquare } from "lucide-react";

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
  fetchChannels?: () => void;
}

/**
 * Sidebar component that displays a list of channels and direct messages, allowing users to select or create new conversations.
 */
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
  // Helper function to check if current user is an admin of the channel
  const currentUserIsAdmin = (channel: Channel): boolean => {
    if (!currentUser || !channel.members) return false;

    return (
      channel.creatorId === currentUser.id ||
      (currentUser.adminsForWhichChannels &&
        currentUser.adminsForWhichChannels.includes(channel.id))
    );
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 flex items-center justify-between border-b border-border">
        <h2 className="font-semibold text-sm text-foreground">Dialogos Chat</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground flex items-center">
                Channels
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-secondary"
                onClick={onCreateChannel}
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={
                    activeConversationId === channel.id ? "secondary" : "ghost"
                  }
                  className={`w-full justify-start px-2 py-1.5 h-auto font-normal group relative 
                    ${activeConversationId === channel.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
                  onClick={() => onConversationSelect(channel.id, true)}
                >
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate text-sm">{channel.name}</span>
                  {/* {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                      {channel.unreadCount}
                    </span>
                  )} */}
                  {currentUserIsAdmin(channel) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewChannelInvite(channel);
                      }}
                    >
                      <Settings className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground flex items-center">
                Direct Messages
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-secondary"
                onClick={onCreateDirectMessage}
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {directMessages.length > 0 ? (
                directMessages.map((dm) => (
                  <Button
                    key={dm.id}
                    variant={
                      activeConversationId === dm.id ? "secondary" : "ghost"
                    }
                    className={`w-full justify-start px-2 py-1.5 h-auto font-normal group relative 
                    ${activeConversationId === dm.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
                    onClick={() => onConversationSelect(dm.id, false)}
                  >
                    <div className="flex items-center w-full">
                      <span className="relative mr-2 flex-shrink-0">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                            {dm.participant?.username
                              ? dm.participant.username.charAt(0)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card ${
                            dm.participant?.status === "ONLINE"
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        />
                      </span>
                      <span className="flex-1 truncate text-left text-sm">
                        {dm.participant?.username || "Unknown User"}
                      </span>
                      {dm.unreadCount && dm.unreadCount > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 flex-shrink-0">
                          {dm.unreadCount}
                        </span>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-muted-foreground flex flex-col items-center">
                  <MessageSquare className="h-8 w-8 mb-1 opacity-50" />
                  <p className="text-sm mb-2">No DMs yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-xs border-border bg-secondary/50 hover:bg-secondary"
                    onClick={onCreateDirectMessage}
                  >
                    Start a conversation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {currentUser && (
        <div className="p-3 border-t border-border flex items-center">
          <Avatar className="h-6 w-6 mr-2 border border-border">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {currentUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {currentUser.username}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  currentUser.status === "ONLINE"
                    ? "bg-green-500"
                    : "bg-gray-500"
                } mr-1`}
              />
              {currentUser.status === "ONLINE" ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
