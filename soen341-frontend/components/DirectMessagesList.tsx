"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusIcon } from 'lucide-react';

interface User {
  id: string;
  username: string;
}

interface DirectMessagesListProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
}

const DirectMessagesList = ({ currentUser, onSelectUser, selectedUser }: DirectMessagesListProps) => {
  const [dmUsers, setDmUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewDmModal, setShowNewDmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users that the current user has DM'd with
  useEffect(() => {
    const fetchDmUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:8080/api/channels/67c4dc6427eab20817da216e`
        );
        setDmUsers(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching DM users:', error);
        setIsLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchDmUsers();
    }
  }, [currentUser]);

  // Fetch all users for the new DM modal
  const handleNewChannelClick = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/channels/create-channel?userId=${currentUser.id}`,
        {
          name: "Test Channel From Frontend",
          creatorId: "67c4dc6427eab20817da216e",
          inviteCode: "34620",
          members: ["67c4dc6427eab20817da216e"],
          isDirectMessage: false,
          directMessageMembers: [],
        }
      );
      // Filter out the current user and users already in DM list
      const filteredUsers = response.data.filter(
        (user: User) => 
          user.id !== currentUser.id && 
          !dmUsers.some(dmUser => dmUser.id === user.id)
      );
      setAllUsers(filteredUsers);
      setShowNewDmModal(true);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const startNewConversation = async (user: User) => {
    try {
      await axios.post("http://localhost:8080/api/channels/dm", {
        user1Id: currentUser.id,
        user2Id: user.id,
      });

      // Add user to DM list if not already there
      if (!dmUsers.some((dmUser) => dmUser.id === user.id)) {
        setDmUsers((prev) => [...prev, user]);
      }
      onSelectUser(user);
      setShowNewDmModal(false);
    } catch (error) {
      console.error("Error creating direct message channel:", error);
      if (!dmUsers.some((dmUser) => dmUser.id === user.id)) {
        setDmUsers((prev) => [...prev, user]);
      }
      onSelectUser(user);
      setShowNewDmModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Direct Messages</h2>
        <button 
          onClick={handleNewChannelClick}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          title="New Message"
        >
          <PlusIcon size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p>Loading conversations...</p>
          </div>
        ) : dmUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p>No conversations yet</p>
            <button 
              onClick={() => startNewConversation(currentUser)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <ul>
            {dmUsers.map((user) => (
              <li key={user.id}>
                <button 
                  className={`w-full text-left py-3 px-4 transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-600' 
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => onSelectUser(user)}
                >
                  {user.username}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New DM Modal */}
      {showNewDmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-80 max-h-96 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Conversation</h3>
              <button 
                onClick={() => setShowNewDmModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {allUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-4">No users available</p>
              ) : (
                <ul>
                  {allUsers.map((user) => (
                    <li key={user.id}>
                      <button 
                        className="w-full text-left py-2 px-3 hover:bg-gray-700 rounded"
                        onClick={() => startNewConversation(user)}
                      >
                        {user.username}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessagesList;