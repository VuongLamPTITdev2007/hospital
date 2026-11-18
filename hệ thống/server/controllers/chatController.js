const { complete } = require('../services/openRouterClient');
const { schemas, execute } = require('../services/chatTools');

const sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (typeof message !== 'string' || !message.trim() || message.length > 1000 || !Array.isArray(history)) return res.status(400).json({ success: false, message: 'Tin nhắn không hợp lệ.' });
    const safeHistory = history.slice(-8).filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string').map(({ role, content }) => ({ role, content: content.slice(0, 1000) }));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const messages = [{ role: 'system', content: `Bạn là trợ lý đặt lịch MedCare. Hôm nay là ${today}, múi giờ Việt Nam. Chỉ dùng dữ liệu tool để nói về bác sĩ và lịch. Hỏi lại khi thiếu ngày/bác sĩ/giờ. Khi người dùng chọn rõ lịch, có thể giữ chỗ; tuyệt đối không tuyên bố đã thanh toán. Không chẩn đoán hay kê thuốc. Trả lời tiếng Việt ngắn gọn.` }, ...safeHistory, { role: 'user', content: message.trim() }];
    let booking = null;
    let choices = [];
    let reply = '';
    for (let round = 0; round < 4; round += 1) {
      const assistant = await complete(messages, schemas);
      if (!assistant.tool_calls?.length) { reply = assistant.content || 'Bạn hãy cho mình biết chuyên khoa và ngày muốn khám.'; break; }
      messages.push({ role: 'assistant', content: assistant.content || null, tool_calls: assistant.tool_calls });
      for (const call of assistant.tool_calls.slice(0, 3)) {
        let result;
        try { result = await execute(call.function.name, JSON.parse(call.function.arguments || '{}'), req.user, message); }
        catch (error) { result = { error: 'Không thể thực hiện yêu cầu. Vui lòng thử lại.' }; }
        if (result.booking) booking = result.booking;
        if (result.available?.length) choices = result.available.map((timeSlot) => ({ doctorId: result.doctorId, date: result.date, timeSlot }));
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      if (booking) { reply = 'Đã giữ chỗ trong 5 phút. Vui lòng xem thông tin cọc và xác nhận thanh toán trong cửa sổ bên dưới.'; break; }
    }
    res.status(200).json({ success: true, data: { reply: reply || 'Bạn vui lòng thử hỏi lại với ngày và chuyên khoa cụ thể.', choices, booking } });
  } catch (error) { next(error); }
};
module.exports = { sendMessage };
