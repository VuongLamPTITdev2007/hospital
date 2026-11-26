const { complete } = require('../services/openRouterClient');
const { schemas, execute } = require('../services/chatTools');

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (typeof message !== 'string' || !message.trim() || message.length > 1000 || !Array.isArray(history) || history.length > 20) return res.status(400).json({ success: false, message: 'Tin nhắn không hợp lệ.' });
    const safeHistory = history.slice(-8).filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string').map(({ role, content }) => ({ role, content: content.slice(0, 1000) }));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const messages = [{ role: 'system', content: `Bạn là trợ lý đặt lịch MedCare. Hôm nay là ${today}, múi giờ Việt Nam. Trả lời tiếng Việt ngắn gọn. Phải gọi công cụ để tìm bác sĩ và lịch, không tự bịa kết quả. Khi hỏi tất cả bác sĩ trống, tìm mọi bác sĩ, không yêu cầu chuyên khoa. Phải hỏi lại nếu thiếu ngày. Chuyển am/pm thành 24 giờ. Công cụ chỉ tra cứu; bệnh nhân chọn nút để đặt lịch, không tự khẳng định đã giữ hoặc thanh toán. Không chẩn đoán, không kê thuốc. Không yêu cầu người dùng nhập bệnh án hoặc thông tin cá nhân trong chat.` }, ...safeHistory, { role: 'user', content: message.trim() }];
    let options = []; let reply = '';
    for (let round = 0; round < 4; round += 1) {
      const assistant = await complete(messages, schemas);
      if (!assistant.tool_calls?.length) { reply = assistant.content || ''; break; }
      const calls = assistant.tool_calls.slice(0, 3);
      messages.push({ role: 'assistant', content: assistant.content || null, tool_calls: calls });
      for (const call of calls) {
        let result;
        try { result = await execute(call.function?.name, JSON.parse(call.function?.arguments || '{}')); }
        catch { result = { error: 'Không thể tra lịch lúc này. Hãy thử lại.' }; }
        if (Array.isArray(result.options)) options = result.options;
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    res.json({ success: true, data: { reply: reply || 'Mình chưa thể trả lời lúc này. Bạn thử lại nhé.', options } });
  } catch (error) { next(error); }
};
