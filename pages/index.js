import { useState, useEffect } from 'react';

export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChatList, setShowChatList] = useState(false); // для мобильной модалки

  // Загрузка чатов
  useEffect(() => {
    const saved = localStorage.getItem('ai-chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) {
        setActiveChatId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    } else {
      const newChat = { id: Date.now().toString(), title: 'Новый чат', messages: [], createdAt: new Date().toISOString() };
      setChats([newChat]);
      setActiveChatId(newChat.id);
    }
  }, []);

  // Сохранение
  useEffect(() => {
    if (activeChatId) {
      const updated = chats.map(chat =>
        chat.id === activeChatId ? { ...chat, messages } : chat
      );
      setChats(updated);
      localStorage.setItem('ai-chats', JSON.stringify(updated));
    }
  }, [messages, activeChatId]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    setActiveChatId(newChat.id);
    setMessages([]);
    setShowChatList(false);
  };

  const switchChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
      setShowChatList(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Обновляем заголовок
    if (newMessages.length === 1) {
      const title = input.substring(0, 30) + (input.length > 30 ? '...' : '');
      const updated = chats.map(chat =>
        chat.id === activeChatId ? { ...chat, title } : chat
      );
      setChats(updated);
      localStorage.setItem('ai-chats', JSON.stringify(updated));
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const aiMsg = { role: 'ai', content: data.choices[0].message.content };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Ошибка. Попробуй позже.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || { title: 'Чат' };

  // Определяем, мобильное ли устройство
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden' }}>
      
      {/* Шапка */}
      <div style={{ padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isMobile ? (
          <button
            onClick={() => setShowChatList(true)}
            style={{
              padding: '6px 12px',
              border: '1px solid #007AFF',
              color: '#007AFF',
              backgroundColor: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Чаты ({chats.length})
          </button>
        ) : (
          <div style={{ fontSize: '16px', fontWeight: '600' }}>{activeChat.title}</div>
        )}
        <button
          onClick={createNewChat}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          + Новый
        </button>
      </div>

      {/* Основная область */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Круг — всегда виден, но ведёт себя умно */}
        <div style={{
          position: 'absolute',
          top: messages.length > 0 ? '40px' : '50%',
          left: '50%',
          transform: messages.length > 0 ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
          zIndex: 10,
          transition: 'top 0.4s, transform 0.4s',
        }}>
          <div
            style={{
              width: messages.length > 0 ? '60px' : '120px',
              height: messages.length > 0 ? '60px' : '120px',
              borderRadius: isTyping ? '40%' : '50%',
              backgroundColor: isTyping ? '#666' : '#aaa',
              transition: 'all 0.4s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* Чат */}
        <div style={{
          flex: 1,
          paddingTop: messages.length > 0 ? '100px' : '0',
          paddingBottom: '20px',
          paddingLeft: '16px',
          paddingRight: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '18px',
                  backgroundColor: msg.role === 'user' ? '#007AFF' : '#e5e5ea',
                  color: msg.role === 'user' ? 'white' : '#000',
                  fontSize: '15px',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
              <div style={{ padding: '10px 14px', borderRadius: '18px', backgroundColor: '#e5e5ea', fontSize: '15px' }}>
                ИИ думает...
              </div>
            </div>
          )}
        </div>

        {/* Поле ввода */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Сообщение..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '18px',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '12px 20px',
                backgroundColor: input.trim() && !isTyping ? '#007AFF' : '#d0d0d0',
                color: 'white',
                border: 'none',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Отправить
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно со списком чатов (только на мобильном) */}
      {isMobile && showChatList && (
        <>
          <div
            onClick={() => setShowChatList(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              maxHeight: '70vh',
              zIndex: 1001,
              padding: '16px 0',
            }}
          >
            <div style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '12px' }}>
              Мои чаты
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => switchChat(chat.id)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    backgroundColor: activeChatId === chat.id ? '#f0f7ff' : 'white',
                    color: activeChatId === chat.id ? '#007AFF' : '#000',
                  }}
                >
                  {chat.title}
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <button
                onClick={createNewChat}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                + Новый чат
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
