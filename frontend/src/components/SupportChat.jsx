import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your DHL Virtual Assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      let botResponse = "I'm sorry, I didn't quite get that. You can ask me about tracking a package or getting shipping rates!";
      const lower = userMsg.toLowerCase();
      if (lower.includes("track") || lower.includes("consignment")) {
        botResponse = "To track a package, please paste your consignment number (e.g., DHL-XXXX-IN) in the tracking bar on the homepage.";
      } else if (lower.includes("rate") || lower.includes("cost") || lower.includes("price")) {
        botResponse = "You can calculate shipping rates by using our Rate Calculator on the homepage or start booking from your dashboard.";
      } else if (lower.includes("hello") || lower.includes("hi")) {
        botResponse = "Hello there! How can I assist you with your logistics needs today?";
      } else if (lower.includes("book")) {
        botResponse = "To book a shipment, please register or login, then navigate to your dashboard and click 'Book Shipment'.";
      }

      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 1000);
  };

  return (
    <div className="chat-widget">
      {isOpen ? (
        <div className="chat-box">
          <div className="chat-header">
            <h3>DHL Assistant</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="chat-input">
            <input 
              type="text" 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-toggle" onClick={() => setIsOpen(true)}>
          <MessageSquare size={26} />
        </div>
      )}
    </div>
  );
}
