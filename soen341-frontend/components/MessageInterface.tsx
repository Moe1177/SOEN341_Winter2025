"use client";
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { subscribe, unsubscribe, sendMessage, initStompClient } from '../utils/socket';

interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  senderUserName?: string;
  channelId?: string;
  isDirectMessage?: boolean;
}

interface User {
  id: string;
  username: string;
}

interface MessageInterfaceProps {
  currentUser: User | null;
  selectedUser: User | null;
}

const MessageInterface = ({ currentUser, selectedUser }: MessageInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize STOMP client on component mount
  useEffect(() => {
    initStompClient();
  }, []);

  // Fetch message history when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/messages/dm`, {
          params: {
            userId: currentUser?.id,
            otherUserId: selectedUser.id
          }
        });
        setMessages(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    };

    if (selectedUser) {
      fetchMessages();
    } else {
      // Clear messages when no user is selected
      setMessages([]);
    }
  }, [selectedUser, currentUser?.id]);

  // Subscribe to WebSocket destinations when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    
    // Subscribe to personal message queue to receive DMs
    const userQueueDestination = `/queue/user/${currentUser?.id}`;
    
    subscribe(userQueueDestination, (message) => {
      const messageData = JSON.parse(message.body);
      
      // Handle new messages
      if (messageData.content && !messageData.type) {
        // Only add messages relevant to current conversation
        if ((messageData.senderId === selectedUser.id || messageData.receiverId === selectedUser.id)) {
          setMessages(prev => [...prev, messageData]);
        }
      }
      
      // Handle message deletion notifications
      if (messageData.type === 'MESSAGE_DELETED') {
        setMessages(prev => prev.filter(msg => msg.id !== messageData.messageId));
      }
    });

    // Cleanup function to unsubscribe when component unmounts or user changes
    return () => {
      unsubscribe(userQueueDestination);
    };
  }, [selectedUser, currentUser?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Reset textarea height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
    }
    
    try {
      // Send message via STOMP WebSocket
      sendMessage(`/app/dm/${currentUser?.id}/${selectedUser.id}`, {
        content: messageContent,
        senderId: currentUser?.id,
        receiverId: selectedUser.id,
        isDirectMessage: true,
        timestamp: new Date().toISOString()
      });
      
      // We don't add the message to state here as we'll receive it back through the WebSocket
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to REST API if WebSocket fails
      try {
        const response = await axios.post(`/api/messages/dm`, {
          content: messageContent,
          senderId: currentUser?.id,
          receiverId: selectedUser.id,
          isDirectMessage: true
        }, {
          params: {
            senderId: currentUser?.id,
            recipientId: selectedUser.id
          }
        });
        
        // Add the sent message to our state
        setMessages(prev => [...prev, response.data]);
      } catch (apiError) {
        console.error('Error sending message via API:', apiError);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white">
      {selectedUser ? (
        <>
          <div className="flex items-center p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-semibold">{selectedUser.username}</h2>
          </div>

          <div 
            ref={messageContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((message, index) => (
                  <div key={message.id || index} className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col max-w-xs md:max-w-md">
                      <div className="text-xs text-gray-500">
                        {message.senderId === currentUser?.id ? 'You' : message.senderUserName || selectedUser.username}
                        {' • '}
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div
                        className={`py-2 px-4 rounded-lg ${
                          message.senderId === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex items-end space-x-2">
              <textarea
                ref={textAreaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none resize-none overflow-y-auto max-h-32 bg-gray-700 border-gray-600 text-white"
                rows={1}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed h-10"
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Select a user to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default MessageInterface;