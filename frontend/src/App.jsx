import React, { useEffect, useState } from 'react';

export default function App() {
  const [moments, setMoments] = useState([]);
  const [settings, setSettings] = useState({
    interval: 0,
    threshold: 0,
    allowedEmotes: []
  });
  const [newEmote, setNewEmote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeBurst, setActiveBurst] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showEmoteSelector, setShowEmoteSelector] = useState(false);

  // Mock chat messages
  const mockChat = [
    { id: 1, user: "User123", message: "Hello everyone!" },
    { id: 2, user: "Viewer456", message: "Great stream!" },
    { id: 3, user: "Fan789", message: "Love the content!" },
    { id: 4, user: "Subscriber", message: "Keep it up!" },
    { id: 5, user: "Viewer123", message: "This is amazing!" },
  ];

  useEffect(() => {
    // Fetch initial settings
    fetch('http://localhost:80/settings/')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
        console.log('Settings:', data);
      }).catch(err => {
        console.error('Failed to fetch settings:', err);
        setIsLoading(false);
      });

    const ws = new WebSocket('ws://localhost:80/ws');
    ws.onmessage = (event) => {
      console.log(event);
      if (event) {
        const newMoment = JSON.parse(event.data);
        if (newMoment.count / newMoment.total >= settings.threshold) {
          setActiveBurst(newMoment);
          setTimeout(() => {
            setActiveBurst(null);
          }, 3000);
        }
        setMoments((prev) => [...prev, newMoment]);
        setTimeout(() => {
          setMoments((prev) => prev.filter(m => m !== newMoment));
        }, 5000);
      }
    };
    return () => ws.close();
  }, [settings.threshold]);

  // Fetch settings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:80/settings/')
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Failed to fetch settings:', err));
    }, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    // Here you would typically send the message to your backend
    setChatInput('');
  };

  const insertEmote = (emote) => {
    setChatInput(prev => prev + emote);
    setShowEmoteSelector(false);
  };

  const updateInterval = (e) => {
    e.preventDefault();
    const newInterval = parseInt(e.target.interval.value);
    fetch('http://localhost:80/settings/interval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: newInterval })
    })
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, interval: data })));
  };

  const updateThreshold = (e) => {
    e.preventDefault();
    const newThreshold = parseFloat(e.target.threshold.value);
    fetch('http://localhost:80/settings/threshold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: newThreshold })
    })
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, threshold: data })));
  };

  const addEmote = (e) => {
    e.preventDefault();
    if (!newEmote) return;
    const updatedEmotes = [...settings.allowedEmotes, newEmote];
    fetch('http://localhost:80/settings/allowed-emotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedEmotes: updatedEmotes })
    })
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({ ...prev, allowedEmotes: data }));
        setNewEmote('');
      });
  };

  const removeEmote = (emote) => {
    const updatedEmotes = settings.allowedEmotes.filter(e => e !== emote);
    fetch('http://localhost:80/settings/allowed-emotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedEmotes: updatedEmotes })
    })
      .then(res => res.json())
      .then(data => setSettings(prev => ({ ...prev, allowedEmotes: data })));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Emote Reaction System</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">
              Interval: {settings.interval} | Threshold: {(settings.threshold * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-gray-800 text-white transform transition-transform duration-300 ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
              ×
            </button>
          </div>

          <form onSubmit={updateInterval} className="mb-4">
            <label className="block text-sm mb-1">Interval</label>
            <input
              type="number"
              name="interval"
              defaultValue={settings.interval}
              min="1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            />
            <button type="submit" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 rounded px-3 py-2">
              Update Interval
            </button>
          </form>

          <form onSubmit={updateThreshold} className="mb-4">
            <label className="block text-sm mb-1">Threshold</label>
            <input
              type="number"
              name="threshold"
              defaultValue={settings.threshold}
              min="0"
              max="1"
              step="0.1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            />
            <button type="submit" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 rounded px-3 py-2">
              Update Threshold
            </button>
          </form>

          <div className="mb-4">
            <label className="block text-sm mb-1">Allowed Emotes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.allowedEmotes.map((emote, i) => (
                <span key={i} className="bg-gray-700 rounded-full px-3 py-1 flex items-center">
                  <span className="mr-2">{emote}</span>
                  <button onClick={() => removeEmote(emote)} className="text-gray-400 hover:text-white">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={addEmote} className="flex gap-2">
              <input
                type="text"
                value={newEmote}
                onChange={(e) => setNewEmote(e.target.value)}
                placeholder="Add emote..."
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-2">
                Add
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className="flex-1 bg-black relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-96 bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">Live Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockChat.map((chat) => (
              <div key={chat.id} className="text-white">
                <span className="font-semibold text-blue-400">{chat.user}:</span>
                <span className="ml-2">{chat.message}</span>
              </div>
            ))}
          </div>

          {/* Emote Reactions Container */}
          <div className="h-48 relative overflow-hidden">
            {moments.map((m, i) => (
              <div
                key={i}
                className="absolute animate-float-up"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDuration: '3s',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <span className="text-4xl">{m.emote}</span>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message..."
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowEmoteSelector(!showEmoteSelector)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  😀
                </button>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Send
              </button>
            </form>

            {/* Emote Selector */}
            {showEmoteSelector && (
              <div className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded-lg p-2 w-full">
                <div className="grid grid-cols-6 gap-2">
                  {settings.allowedEmotes.map((emote, i) => (
                    <button
                      key={i}
                      onClick={() => insertEmote(emote)}
                      className="text-2xl hover:bg-gray-600 rounded p-1"
                    >
                      {emote}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Emote Burst */}
      {activeBurst && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array(Math.min(20, Math.ceil((activeBurst.count / activeBurst.total) * 30)))
            .fill()
            .map((_, idx) => (
              <div
                key={idx}
                className="absolute animate-burst"
                style={{
                  left: `${Math.random() * 90}%`,
                  top: `${Math.random() * 90}%`,
                  animationDelay: `${idx * 0.1}s`,
                  fontSize: `${Math.random() * 30 + 30}px`
                }}
              >
                {activeBurst.emote}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

