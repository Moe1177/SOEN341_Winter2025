"use client";
import { button } from "framer-motion/client";
import React, { useState, useEffect, useRef } from "react";

const MessageInterface = () => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "User 1", content: "Hey! How's it going?", profileImage: "https://randomuser.me/api/portraits/men/1.jpg", timestamp: "2025-02-09T12:00:00", isOwnMessage: false },
    { sender: "User 2", content: "Good morning!", profileImage: "https://randomuser.me/api/portraits/men/2.jpg", timestamp: "2025-02-09T12:05:00", isOwnMessage: false },
    { sender: "User 3", content: "Are you free later?", profileImage: "https://randomuser.me/api/portraits/men/3.jpg", timestamp: "2025-02-09T12:10:00", isOwnMessage: false },
  ]);

  const [userMessages, setUserMessages] = useState([
    { content: "Hey there!", timestamp: "2025-02-09T12:15:00", isOwnMessage: true },
    { content: "I'm doing good, you?", timestamp: "2025-02-09T12:20:00", isOwnMessage: true },
    { content: "Sure, what's up?", timestamp: "2025-02-09T12:25:00", isOwnMessage: true },
  ]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newUserMessage = {
        content: newMessage,
        timestamp: new Date().toISOString(),
        isOwnMessage: true,
      };

      // Add the new message to the user's messages
      setUserMessages((prevMessages) => [...prevMessages, newUserMessage]);

      // Scroll to the bottom after adding the message
      setNewMessage(""); // Reset the input field
    }
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
    ...userMessages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp).toISOString() })),
  ]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort messages by timestamp
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
      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col-reverse">
        {/* Messages */}
        {allMessages.map((message, idx) => (
          <div key={idx} className={`flex ${message.isOwnMessage ? "justify-end" : "justify-start"} mb-4`}>
            {/* Display other users' profile images */}
            {!message.isOwnMessage /*&& (
              <img
                src={message.profileImage}
                alt={`${message.sender}'s profile`}
                className="h-10 w-10 rounded-full mr-4"
              />
            )*/}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">{message.timestamp}</div>
              <div
                className={`max-w-xs py-2 px-4 rounded-lg ${
                  message.isOwnMessage ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : "bg-gradient-to-r from-yellow-500 to-red-400"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {/* Scroll reference */}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bottom-4 right-4 flex w-full p-4 border rounded-lg shadow-lg">
        <textarea
          ref={textAreaRef}
          value={newMessage}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress} // Handle sending with Enter key
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none resize-none overflow-y-auto max-h-32 text-black"
          rows={1}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInterface;
