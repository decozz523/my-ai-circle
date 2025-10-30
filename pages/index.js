import { useState, useEffect } from 'react';

export default function Home() {
  // Все чаты
  const [chats, setChats] = useState([]);
  // Текущий активный чат
  const [activeChatId, setActiveChatId] = useState(null);
  // Сообщения текущего чата
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Загружаем чаты из localStorage при старте
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
      // Создаём первый чат
      const newChat = {
        id: Date.now().toString(),
        title: 'Новый чат',
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
    }
  }, []);

  // Сохраняем чаты при изменении
  useEffect(() => {
    if (activeChatId && chats.length > 0) {
      const updatedChats = chats.map(chat =>
        chat.id === activeChatId ? { ...chat, messages } : chat
      );
      setChats(updatedChats);
      localStorage.setItem('ai-chats', JSON.stringify(updatedChats));
    }
  }, [messages, activeChatId, chats]);

  // Создать новый чат
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
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Обновляем заголовок чата (берём первые 30 символов)
    if (newMessages.length === 1) {
      const updatedChats = chats.map(chat =>
        chat.id === activeChatId
          ? { ...chat, title: input.substring(0, 30) + (input.length > 30 ? '...' : '') }
          : chat
      );
      setChats(updatedChats);
      localStorage.setItem('ai-chats', JSON.stringify(updatedChats));
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
      const errorMsg = { role: 'ai', content: 'Не удалось получить ответ. Попробуй позже.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Переключение чата
  const switchChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || { title: 'Чат' };

  return (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Боковая панель — как в Messages на iPhone */}
      <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <button
            onClick={createNewChat}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Новый чат
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => switchChat(chat.id)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f5f5f5',
                backgroundColor: activeChatId === chat.id ? '#f0f7ff' : 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeChatId === chat.id ? '600' : 'normal',
                color: activeChatId === chat.id ? '#007AFF' : '#000',
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Основная область: круг + чат */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Круг по центру (только если нет сообщений) */}
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: isTyping ? '40%' : '50%',
                backgroundColor: isTyping ? '#999' : '#ccc',
                transition: 'border-radius 0.4s, background-color 0.3s, transform 0.3s',
                transform: isTyping ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          </div>
        )}

        {/* Чат (если есть сообщения) */}
        {messages.length > 0 && (
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '18px',
                    backgroundColor: msg.role === 'user' ? '#007AFF' : '#e5e5ea',
                    color: msg.role === 'user' ? 'white' : '#000',
                    fontSize: '15px',
                    lineHeight: 1.4,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '18px',
                    backgroundColor: '#e5e5ea',
                    fontSize: '15px',
                  }}
                >
                  ИИ думает...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Поле ввода */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
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
    </div>
  );
}
