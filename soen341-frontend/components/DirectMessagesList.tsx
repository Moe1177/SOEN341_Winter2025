const DirectMessages = () => {
    const DMChats = [
      "Message 1", "Message 2", "Message 3", "Message 2", "Message 3", 
      "Message 2", "Message 3", "Message 2", "Message 3", "Message 2", 
      "Message 3", "Message 2", "Message 3", "Message 2", "Message 3", 
      "Message 2", "Message 3", "Message 2", "Message 3", "Message 2", 
      "Message 3", "Message 2", "Message 3", "Message 2", "Message 3", 
      "Message 2", "Message 3", "Message 2", "Message 3", "Message 2", 
      "Message 3", "Message 2", "Message 3", "Message 2", "Message 3", 
      "Message 2", "Message 3", "Message 2", "Message 3", "Message 2", 
      "Message 3", "Message 2", "Message 3"
    ];
  
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center mb-6">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-slate-600 to-slate-200">
            DMs
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto w-full">
          <ul>
            {DMChats.map((DMChats, idx) => (
              <li key={idx}>
                <button className="w-full border py-2 text-left text-sm font-medium text-gray-700 bg-white hover:bg-gray-200 pl-2">
                  {DMChats}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  export default DirectMessages;
  