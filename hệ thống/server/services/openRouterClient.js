const complete = async (messages, tools) => {
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error('Chatbot chưa được cấu hình API key.'); error.statusCode = 503; throw error;
  }
  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', messages, tools, tool_choice: 'auto', parallel_tool_calls: false, temperature: 0.2, max_tokens: 600 }),
      signal: AbortSignal.timeout(25000)
    });
  } catch {
    const error = new Error('Không kết nối được dịch vụ chatbot. Vui lòng thử lại.'); error.statusCode = 502; throw error;
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.choices?.[0]?.message) {
    const error = new Error(`Dịch vụ chatbot không sẵn sàng (HTTP ${response.status}).`); error.statusCode = 502; throw error;
  }
  return result.choices[0].message;
};
module.exports = { complete };
