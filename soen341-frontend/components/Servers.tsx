"use client";
import { useState } from "react";

const Servers = () => {
  const servers = ["Server 1", "Server 2", "Server 3"];
  const channels = {
    "Server 1": ["General", "Project Help", "Social"],
    "Server 2": ["Announcements", "Gaming", "Music"],
    "Server 3": ["Tech Talk", "Design", "Marketing"],
  };

  const [showServers, setShowServers] = useState(true);
  const [showChannels, setShowChannels] = useState(false);
  const [selectedServer, setSelectedServer] = useState<keyof typeof channels | null>(null);

  const handleShowChannels = (server: keyof typeof channels) => {
    setSelectedServer(server); 
    setShowServers(false);      
    setShowChannels(true);      
  };

  const handleGoBack = () => {
    setShowServers(true);      
    setShowChannels(false);    
    setSelectedServer(null);   
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center mb-6">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-500 to-gray-200">
          Servers
        </h2>
      </div>

      {showServers && (
        <div className="flex-1 overflow-y-auto w-full">
          <ul>
            {servers.map((server, idx) => (
              <li key={idx}>
                <button
                  className="w-full border py-2 text-left text-sm font-medium text-gray-700 bg-white hover:bg-gray-200 pl-2"
                  onClick={() => handleShowChannels(server as keyof typeof channels)} // Ensure server is treated as a valid key
                >
                  {server}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showChannels && selectedServer && (
        <div className="flex-1 overflow-y-auto w-full">
          <button
            onClick={handleGoBack}
            className="w-full border py-2 text-left text-sm font-medium text-gray-700 bg-white hover:bg-gray-200 pl-2"
          >
            Back to Servers
          </button>

          <h3 className="text-xl font-semibold mb-4">{selectedServer} Channels</h3>
          <ul>
            {channels[selectedServer].map((channel, idx) => (
              <li key={idx}>
                <button className="w-full border py-2 text-left text-sm font-medium text-gray-700 bg-white hover:bg-gray-200 pl-2">
                  {channel}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Servers;
