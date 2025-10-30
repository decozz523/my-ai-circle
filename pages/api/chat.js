export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { messages } = req.body;

  // Преобразуем сообщения в формат OpenRouter
  const openRouterMessages = messages.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content,
  }));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my-ai-circle.vercel.app', // ← замени на свой URL!
        'X-Title': 'My AI Circle',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b:free', // лёгкая и бесплатная модель
        messages: openRouterMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(500).json({ error: data.message || 'AI error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Connection failed' });
  }
}
