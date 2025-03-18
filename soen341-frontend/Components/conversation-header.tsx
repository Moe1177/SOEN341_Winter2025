import type { Channel, User } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { Settings, Hash } from "lucide-react";

interface ConversationHeaderProps {
  conversation: Channel | { receiverId: string; senderUsername: string };
  receiver?: User;
  onViewChannelInvite?: () => void;
}

/**
 * ConversationHeader component that displays the header of a conversation.
 * It handles both individual conversations and channels.
 *
 * @param {Object} props - The component props.
 * @param {Conversation} props.conversation - The conversation object, either a user or a channel.
 * @param {Receiver | null} props.receiver - The receiver object for individual conversations if not a channel.
 * @param {Function | undefined} props.onViewChannelInvite - Callback function to trigger when viewing channel invite (only for group conversations).
 *
 * @returns {JSX.Element} The rendered ConversationHeader component.
 */
export function ConversationHeader({
  conversation,
  receiver,
  onViewChannelInvite,
}: ConversationHeaderProps) {
  const isChannel = "type" in conversation && conversation.type === "GROUP";
  const channel = isChannel ? (conversation as Channel) : null;

  return (
    <div className="h-10 sm:h-14 flex-1 flex items-center justify-between px-2 sm:px-4">
      <div className="flex items-center overflow-hidden">
        {isChannel ? (
          <>
            <Hash className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">
              {channel?.name}
            </span>
          </>
        ) : (
          <>
            {receiver && (
              <>
                <span className="relative mr-1.5 sm:mr-2 flex-shrink-0">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarFallback className="text-xs">
                      {receiver.username ? receiver.username.charAt(0) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full border border-background ${
                      receiver.status === "ONLINE"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  />
                </span>
                <span className="font-medium text-sm sm:text-base truncate">
                  {receiver.username}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {isChannel && onViewChannelInvite && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
          onClick={onViewChannelInvite}
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  );
}
