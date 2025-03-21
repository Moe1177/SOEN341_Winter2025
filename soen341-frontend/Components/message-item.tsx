"use client";

import { useState, useRef, useEffect } from "react";
import type { User, WebSocketMessage } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Pencil, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import toast from "react-hot-toast";

interface MessageItemProps {
  message: WebSocketMessage;
  currentUser: User | null;
  sender: User;
  isCurrentUser: boolean;
  formatMessageTime: (date: Date) => string;
  onEditMessage: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  isUserAdmin: boolean;
}

export function MessageItem({
  message,
  sender,
  isCurrentUser,
  formatMessageTime,
  onEditMessage,
  onDeleteMessage,
  isUserAdmin,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const avatarChar = sender?.username?.[0] || "?";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if the current user can edit/delete this message
  const canModify = isCurrentUser || isUserAdmin;

  // When editing mode is activated, focus the textarea and place cursor at the end
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editedContent.length,
        editedContent.length
      );
    }
  }, [isEditing, editedContent]);

  const handleEdit = async () => {
    // Don't save if nothing changed
    if (editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    // Validate content
    if (!editedContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      const success = await onEditMessage(message.id, editedContent);

      if (success) {
        setIsEditing(false);
        toast.success("Message updated");
      } else {
        toast.error("Failed to update message");
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("An error occurred while updating the message");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const success = await onDeleteMessage(message.id);

      if (success) {
        toast.success("Message deleted");
      } else {
        toast.error("Failed to delete message");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An error occurred while deleting the message");
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  // Don't render if this message is being deleted
  if (isDeleting) {
    return null;
  }

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-2 sm:mb-3 group`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {!isCurrentUser && (
          <div className="flex-shrink-0 mr-2 sm:mr-3">
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-border">
              <AvatarFallback className="bg-secondary text-foreground text-xs sm:text-sm">
                {avatarChar}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="relative">
          {!isCurrentUser && (
            <div className="mb-1 ml-1 flex items-center">
              <span className="text-xs sm:text-sm font-medium">
                {sender?.username || "Unknown"}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
          )}

          {isEditing ? (
            <div className="mb-1">
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[60px] text-sm text-foreground resize-none"
                placeholder="Edit your message..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className="h-7 px-2 text-xs"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`${
                isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl"
                  : "bg-secondary text-secondary-foreground rounded-r-xl rounded-tl-xl"
              } px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm text-sm sm:text-base group-hover:pr-8`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Message actions dropdown - only visible on hover and for users who can modify */}
              {canModify && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-black/20"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="end"
                      className="w-32"
                    >
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}

          {isCurrentUser && !isEditing && (
            <div className="mt-1 mr-1 flex justify-end">
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatMessageTime(message.timestamp)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
