const complete = async (messages, tools) => {
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error('Chatbot chưa được cấu hình OPENROUTER_API_KEY trên server.');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173', 'X-Title': 'MedCare' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', messages, tools, tool_choice: 'auto', parallel_tool_calls: false, max_tokens: 600, temperature: 0.2 }),
    signal: AbortSignal.timeout(25000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.choices?.[0]?.message) {
    const error = new Error(`OpenRouter không phản hồi hợp lệ (${response.status}).`);
    error.statusCode = 502;
    throw error;
  }
  return result.choices[0].message;
};
module.exports = { complete };
