"use client";
import { useState, useEffect } from 'react';
import DirectMessagesList from './DirectMessagesList';
import MessageInterface from './MessageInterface';
import axios from 'axios';

interface User {
  id: string;
  username: string;
}

const DirectMessagingPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/auth/me');
        setCurrentUser(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>You need to be logged in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar for DM list - takes 1/4 of the screen on larger displays */}
      <div className="w-full md:w-1/4 border-r border-gray-700">
        <DirectMessagesList 
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
        />
      </div>
      
      {/* Main chat area - takes 3/4 of the screen on larger displays */}
      <div className="hidden md:block md:w-3/4">
        <MessageInterface 
          currentUser={currentUser}
          selectedUser={selectedUser}
        />
      </div>

    </div>
  );
};

export default DirectMessagingPage;