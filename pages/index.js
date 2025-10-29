import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg = { role: 'ai', content: 'Привет! Я — ИИ. Пока я не настоящий, но скоро будет!' };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Круг по центру */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            backgroundColor: isTyping ? '#bbb' : '#ddd',
            transition: 'background-color 0.3s, transform 0.3s',
            transform: isTyping ? 'scale(1.1)' : 'scale(1)',
          }}
        />
      </div>

      {/* Чат внизу */}
      <div style={{ borderTop: '1px solid #eee', padding: '16px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                margin: '4px 0',
                backgroundColor: msg.role === 'user' ? '#e0f7fa' : '#f5f5f5',
                borderRadius: '8px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                marginLeft: msg.role === 'user' ? '20%' : '0',
              }}
            >
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '8px', maxWidth: '80%' }}>
              ...
            </div>
          )}
        </div>

        <div style={{ maxWidth: '600px', margin: '12px auto 0', display: 'flex' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Напиши что-нибудь..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px 0 0 4px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '8px 16px',
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
            }}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
