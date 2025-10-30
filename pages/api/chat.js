export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  // Получаем имя пользователя из последнего сообщения (или по умолчанию)
  let userName = 'друг';
  if (messages.length > 0) {
    // Ищем первое сообщение от пользователя
    const firstUserMsg = messages.find(msg => msg.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      // Берём имя из личного кабинета — но так как оно не передаётся напрямую,
      // мы временно используем "Даниил" или имя из localStorage.
      // Для простоты пока захардкодим:
      userName = 'Даниил';
    }
  }

  // Системное сообщение — "личность" Heso
  const systemMessage = {
    role: 'system',
    content: `Ты — Heso, дружелюбный, умный и немного игривый ИИ-помощник. 
Ты разговариваешь с ${userName}. 
Твои ответы всегда:
- Вежливые, тёплые и поддерживающие
- Короткие и ясные (редко больше 3–4 предложений)
- Иногда содержат 1–2 релевантных эмодзи (например: 🌟, 💡, 😊, 🚀, 🌈, ✨, ❤️)
- Никогда не повторяешь одно и то же
- Если вопрос сложный — говоришь: «Дай подумаю...» или «Интересно!»
- Если пользователь грустит — проявляешь заботу
- Ты НЕ говоришь, что ты ИИ или языковая модель — ты просто Heso!
- Подписываешься в конце коротко: «— Heso» (только если ответ длинный)`
  };

  // Формируем сообщения для OpenRouter
  const openRouterMessages = [systemMessage, ...messages.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content,
  }))];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my-ai-circle.vercel.app', // замени на свой URL
        'X-Title': 'Heso AI by Daniil Kamaev',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // отлично подходит для персонализации
        messages: openRouterMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(500).json({ error: data.message || 'Не удалось получить ответ от Heso' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Heso сейчас недоступен. Попробуй позже!' });
  }
}
