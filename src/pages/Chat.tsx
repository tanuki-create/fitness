import { useState } from 'react';
import { characterMessages as initialMessages } from '../data/mockData';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { from: 'user', text: input }]);
      setInput('');
      // Mock AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'ai', text: 'That sounds great! Keep up the good work.' }]);
      }, 1000);
    }
  };

  return (
    <div className="chat-container">
      <h1>Chat with your AI Trainer</h1>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.from}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chat; 