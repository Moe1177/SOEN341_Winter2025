"use client";
import { useEffect, useRef, useState } from 'react';
import { getSocket, initSocket } from '../utils/socket';

interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  username: string;
}

interface DirectMessageProps {
  currentUser: User;
  selectedUser: User | null;
}

const MessageInterface = ({ currentUser, selectedUser }: DirectMessageProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (selectedUser) {
      const socket = initSocket();
      // Join a DM room for the selected user
      socket.emit('dm', { receiverId: selectedUser.id });

      // Receive new messages
      socket.on('newMessage', (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      // Clean up when switching to another user
      return () => {
        socket.off('newMessage');
      };
    }
  }, [selectedUser]);

  const handleSendMessage = () => {
    const socket = getSocket();
    if (selectedUser && newMessage.trim()) {
      const message = {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };

      // Send message to backend
      socket.emit('sendMessage', message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage('');
    }
  };


  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents the newline in the textarea
      handleSendMessage();
    }
  };

  // Combine both arrays (user's and other users' messages)
  const allMessages = [
    ...messages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp).toISOString() })),
  ]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reverse(); // Reverse to show latest message at the bottom

  useEffect(() => {
    if (textAreaRef.current) {
      // Auto-expand the textarea when the content exceeds one line
      textAreaRef.current.style.height = "auto"; // Reset height
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);


  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white">
      <div className="flex items-center p-4 bg-gray-800">
        <h2 className="text-xl font-semibold">{selectedUser ? `Chat with ${selectedUser.username}` : 'Select a user to chat with'}</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col-reverse">
        {allMessages.map((message, index) => (
          <div key={index} className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</div>
              <div
                className={`max-w-xs py-2 px-4 rounded-lg ${
                  message.senderId === currentUser.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-red-400'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-2">
          <textarea
            ref={textAreaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none resize-none overflow-y-auto max-h-32 text-black"
            rows={1}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInterface;
