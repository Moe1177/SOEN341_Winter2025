"use client";

import { useState, useRef, useEffect } from "react";
import type { User, WebSocketMessage, FileInfo } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Pencil, Trash2, Check, X, MoreHorizontal, FileText, Image, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

interface MessageItemProps {
  message: WebSocketMessage;
  currentUser: User | null;
  sender: User;
  isCurrentUser: boolean;
  formatMessageTimeAction: (date: Date) => string;
  onEditMessageAction: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessageAction: (messageId: string) => Promise<boolean>;
  isUserAdmin: boolean;
}

export function MessageItem({
  message,
  sender,
  isCurrentUser,
  formatMessageTimeAction,
  onEditMessageAction,
  onDeleteMessageAction,
  isUserAdmin,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const avatarChar = sender?.username?.[0] || "?";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { token } = useAuth();
  const [, forceRender] = useState({});
  const [backupToken, setBackupToken] = useState<string | null>(null);

  // Log token from useAuth for debugging
  useEffect(() => {
    console.log("Token from useAuth:", token ? "exists" : "null");
    
    // If no token from useAuth, try to get from localStorage
    if (!token) {
      try {
        const localToken = localStorage.getItem('authToken');
        console.log("Backup token from localStorage:", localToken ? "exists" : "null");
        setBackupToken(localToken);
      } catch (err) {
        console.error("Error reading backup token:", err);
      }
    }
    
    // Test direct token access
    if (message.hasAttachment && message.attachments && message.attachments.length > 0) {
      const testToken = token || backupToken || localStorage.getItem('authToken');
      if (!testToken) {
        console.error("No authentication token available for attachments");
      } else {
        console.log("Auth token available for attachments:", testToken.substring(0, 10) + "...");
        
        // Test token with a small fetch request
        const testUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/currentUser`;
        fetch(testUrl, {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        })
        .then(response => {
          console.log("Token test response status:", response.status);
          if (!response.ok) {
            console.error("Token validation failed with status:", response.status);
          } else {
            console.log("Token is valid");
          }
        })
        .catch(err => {
          console.error("Token validation request failed:", err);
        });
      }
    }
  }, [token, backupToken, message.hasAttachment, message.attachments]);

  const canModify = isCurrentUser || isUserAdmin;

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
      const success = await onEditMessageAction(message.id, editedContent);

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
      const success = await onDeleteMessageAction(message.id);

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
  
  const getAuthToken = () => {
    // First try to use the token from useAuth
    if (token) {
      return token;
    }
    
    // Then try the backup token we got
    if (backupToken) {
      return backupToken;
    }
    
    // Last resort: directly check localStorage
    try {
      const storedToken = localStorage.getItem('authToken');
      console.log('Direct localStorage check for authToken:', storedToken ? 'exists' : 'null');
      return storedToken;
    } catch (error) {
      console.error('Error accessing localStorage directly:', error);
      return null;
    }
  };

  const handleDownloadAttachment = (attachment: FileInfo) => {
    try {
      // Get the token directly from useAuth with fallback
      const currentToken = token || backupToken || localStorage.getItem('authToken');
      
      if (!currentToken) {
        toast.error("You need to be logged in to download files");
        console.error("Token is null when trying to download attachment");
        return;
      }
      
      // Log for debugging
      console.log("Using token for download:", !!currentToken, currentToken.substring(0, 10) + "...");
      
      const fileUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/files/${attachment.fileId}`;
      
      toast.loading("Downloading file...", { id: "download-toast" });
      
      // Use fetch with credentials instead of just opening a window
      fetch(`${fileUrl}?token=${encodeURIComponent(currentToken)}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${currentToken}`
        }
      })
      .then(response => {
        toast.dismiss("download-toast");
        
        if (response.ok) {
          return response.blob();
        }
        
        if (response.status === 401) {
          // Authentication issue
          toast.error("Authentication error. Please try logging in again.");
          throw new Error("Authentication error");
        } else {
          throw new Error(`Error downloading file: ${response.status}`);
        }
      })
      .then(blob => {
        // Create object URL
        const url = window.URL.createObjectURL(blob);
        
        // Create link for download
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Download complete");
      })
      .catch(error => {
        toast.dismiss("download-toast");
        console.error("Error downloading file:", error);
        if (!error.message.includes("Authentication error")) {
          toast.error("Failed to download file. Please try again.");
        }
      });
    } catch (error) {
      toast.dismiss("download-toast");
      console.error("Error initiating download:", error);
      toast.error("Failed to download file. Please try logging in again.");
    }
  };
  
  const isImageFile = (contentType: string) => {
    return contentType.startsWith('image/');
  };

  // For image rendering, use the token directly from useAuth with fallback
  const getImageUrl = (fileId: string) => {
    const currentToken = token || backupToken || localStorage.getItem('authToken');
    if (!currentToken) {
      console.error("No token available for image URL");
      return '';
    }
    
    console.log("Using token for image URL:", currentToken.substring(0, 10) + "...");
    return `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/messages/files/${fileId}?token=${encodeURIComponent(currentToken)}`;
  };

  // Don't render if this message is being deleted
  if (isDeleting) {
    return null;
  }

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-2 sm:mb-3 group pr-5`}
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
                {formatMessageTimeAction(message.timestamp)}
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
              } px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm text-sm sm:text-base relative group/message`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              
              {/* Attachments */}
              {message.hasAttachment && message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center border border-[#36327e]/50 rounded-lg px-2 py-1.5 bg-black/20"
                    >
                      {isImageFile(attachment.contentType) ? (
                        <div className="w-full">
                          <div className="mb-1 flex justify-between items-center">
                            <span className="text-xs truncate max-w-[200px]">{attachment.filename}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => handleDownloadAttachment(attachment)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="relative rounded overflow-hidden">
                            {(token || backupToken) ? (
                              <img 
                                src={getImageUrl(attachment.fileId)}
                                alt={attachment.filename}
                                className="w-full h-auto max-h-[200px] object-contain cursor-pointer"
                                onClick={() => handleDownloadAttachment(attachment)}
                                onError={() => {
                                  console.error("Image failed to load");
                                }}
                              />
                            ) : (
                              <div 
                                className="w-full h-[120px] bg-gray-700 flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                  const refreshedToken = getAuthToken();
                                  if (refreshedToken) {
                                    toast.success("Retrying image load");
                                    // Force a re-render
                                    forceRender({});
                                  } else {
                                    toast.error("Please log in to view images");
                                  }
                                }}
                              >
                                <span className="text-xs text-gray-300">Click to retry loading image</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0 mr-2">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 truncate mr-2">
                            <div className="text-xs truncate">{attachment.filename}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-shrink-0 h-6 w-6 p-0"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canModify && (
                <div className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover/message:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-black/20 bg-[#0e1230]/80 backdrop-blur-sm shadow-md"
                      >
                        <MoreHorizontal className="h-4 w-4 text-white" />
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
                {formatMessageTimeAction(message.timestamp)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
