import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [userName, setUserName] = useState('Даниил Камаev');
  const [theme, setTheme] = useState('light');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Загрузка настроек
  useEffect(() => {
    const savedName = localStorage.getItem('user-name');
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    if (savedName) setUserName(savedName);
    setTheme(savedTheme);
  }, []);

  // Применение темы
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
      const welcomeMessage = {
        role: 'ai',
        content: `Привет, Даниил! 👋\nЯ — Heso. Я здесь, чтобы помогать, отвечать на вопросы и иногда дарить хорошее настроение 😊\nО чём поговорим?`
      };
      const newChat = {
        id: Date.now().toString(),
        title: 'Добро пожаловать!',
        messages: [welcomeMessage],
        createdAt: new Date().toISOString(),
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
      setMessages([welcomeMessage]);
    }
  }, []);

  // Сохранение чатов
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

    if (newMessages.length === 1 && !chats.find(c => c.id === activeChatId)?.title?.includes('Добро пожаловать')) {
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
      setMessages(prev => [...prev, { role: 'ai', content: 'Heso сейчас недоступен. Попробуй позже! 💔' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveName = (newName) => {
    if (newName.trim()) {
      setUserName(newName.trim());
      localStorage.setItem('user-name', newName.trim());
    }
  };

  const clearAllChats = () => {
    if (confirm('Очистить все чаты? Это нельзя отменить.')) {
      localStorage.removeItem('ai-chats');
      const welcomeMessage = {
        role: 'ai',
        content: `Привет, Даниил! 👋\nЯ — Heso. Я здесь, чтобы помогать, отвечать на вопросы и иногда дарить хорошее настроение 😊\nО чём поговорим?`
      };
      const newChat = {
        id: Date.now().toString(),
        title: 'Добро пожаловать!',
        messages: [welcomeMessage],
        createdAt: new Date().toISOString(),
      };
      setChats([newChat]);
      setActiveChatId(newChat.id);
      setMessages([welcomeMessage]);
      setShowSettings(false);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || { title: 'Чат' };
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const bgColor = theme === 'dark' ? '#000' : '#f5f5f7';
  const headerBg = theme === 'dark' ? '#111' : 'white';
  const chatBg = theme === 'dark' ? '#111' : 'white';
  const inputBg = theme === 'dark' ? '#222' : 'white';
  const textColor = theme === 'dark' ? '#fff' : '#000';
  const borderColor = theme === 'dark' ? '#333' : '#e0e0e0';
  const userMsgBg = '#007AFF';
  const aiMsgBg = theme === 'dark' ? '#222' : '#e5e5ea';
  const aiMsgColor = theme === 'dark' ? '#fff' : '#000';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: bgColor, color: textColor, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden' }}>
      
      {/* Шапка */}
      <div style={{ padding: '12px 16px', backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isMobile ? (
          <button
            onClick={() => setShowChatList(true)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#007AFF'}`,
              color: theme === 'dark' ? '#aaa' : '#007AFF',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Чаты
          </button>
        ) : (
          <div style={{ fontSize: '16px', fontWeight: '600' }}>{activeChat.title}</div>
        )}
        
        <button
          onClick={() => setShowSettings(true)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: theme === 'dark' ? '#222' : '#f0f0f0',
            border: 'none',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme === 'dark' ? '#aaa' : '#555',
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Основная область */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Круг Heso */}
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
              backgroundColor: isTyping ? (theme === 'dark' ? '#555' : '#999') : (theme === 'dark' ? '#444' : '#aaa'),
              transition: 'all 0.4s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: messages.length > 0 ? '24px' : '48px',
              fontWeight: 'bold',
            }}
          >
            H
          </div>
        </div>

        {/* Чат — теперь с ограничением высоты и прокруткой */}
        <div style={{
          flex: 1,
          paddingTop: messages.length > 0 ? '100px' : '0',
          paddingBottom: '80px', // ← место для поля ввода
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
                whiteSpace: 'pre-wrap'
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '18px',
                  backgroundColor: msg.role === 'user' ? userMsgBg : aiMsgBg,
                  color: msg.role === 'user' ? 'white' : aiMsgColor,
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
              <div style={{ padding: '10px 14px', borderRadius: '18px', backgroundColor: aiMsgBg, color: aiMsgColor, fontSize: '15px' }}>
                Heso думает... 💭
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода — теперь прижато к низу */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '12px 16px', 
          borderTop: `1px solid ${borderColor}`, 
          backgroundColor: chatBg 
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Сообщение Heso..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`,
                borderRadius: '18px',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: inputBg,
                color: textColor,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '12px 20px',
                backgroundColor: input.trim() && !isTyping ? '#007AFF' : (theme === 'dark' ? '#444' : '#d0d0d0'),
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

      {/* Модалка чатов */}
      {isMobile && showChatList && (
        <>
          <div onClick={() => setShowChatList(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: chatBg, borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '70vh', zIndex: 1001, padding: '16px 0' }}>
            <div style={{ textAlign: 'center', color: theme === 'dark' ? '#aaa' : '#888', fontSize: '14px', marginBottom: '12px' }}>Мои чаты</div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => switchChat(chat.id)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#f0f0f0'}`,
                    cursor: 'pointer',
                    fontSize: '16px',
                    backgroundColor: activeChatId === chat.id ? (theme === 'dark' ? '#222' : '#f0f7ff') : 'transparent',
                    color: activeChatId === chat.id ? '#007AFF' : (theme === 'dark' ? '#fff' : '#000'),
                  }}
                >
                  {chat.title}
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <button onClick={createNewChat} style={{ padding: '10px 20px', backgroundColor: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }}>
                + Новый чат
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модалка настроек */}
      {showSettings && (
        <>
          <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2000 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: isMobile ? '90%' : '400px', backgroundColor: chatBg, borderRadius: '20px', padding: '24px', zIndex: 2001, maxHeight: '80vh', overflowY: 'auto', border: `1px solid ${borderColor}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>Личный кабинет</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: theme === 'dark' ? '#aaa' : '#666', marginBottom: '6px' }}>Ваше имя</div>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={(e) => saveName(e.target.value)}
                placeholder="Введите имя"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`,
                  borderRadius: '10px',
                  backgroundColor: inputBg,
                  color: textColor,
                  fontSize: '15px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: theme === 'dark' ? '#aaa' : '#666', marginBottom: '6px' }}>Тема</div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`,
                  borderRadius: '10px',
                  backgroundColor: inputBg,
                  color: textColor,
                  fontSize: '15px',
                }}
              >
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
                <option value="auto">Автоматически</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: theme === 'dark' ? '#222' : '#f8f8f8', borderRadius: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Информация</div>
              <div style={{ fontSize: '14px', color: theme === 'dark' ? '#bbb' : '#555' }}>
                <div>ИИ: <strong>Heso</strong></div>
                <div>Разработчик: <strong>Даниил Камаев</strong></div>
                <div>Всего чатов: <strong>{chats.length}</strong></div>
              </div>
            </div>

            <button
              onClick={clearAllChats}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ff3b30',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Очистить все чаты
            </button>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '12px',
                backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
                color: theme === 'dark' ? '#fff' : '#000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Готово
            </button>
          </div>
        </>
      )}
    </div>
  );
}
