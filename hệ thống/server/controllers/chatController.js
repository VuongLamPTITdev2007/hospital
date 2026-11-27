const { complete } = require('../services/openRouterClient');
const { schemas, execute, getAvailabilityPage } = require('../services/chatTools');
const { vietnamDate } = require('../services/availabilityService');

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (typeof message !== 'string' || !message.trim() || message.length > 1000 || !Array.isArray(history) || history.length > 20) return res.status(400).json({ success: false, message: 'Tin nhắn không hợp lệ.' });
    const safeHistory = history.slice(-8).filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string').map(({ role, content }) => ({ role, content: content.slice(0, 1000) }));
    const today = vietnamDate(new Date());
    const instructions = [
      `Bạn là trợ lý đặt lịch MedCare. Hôm nay là ${today} theo giờ Việt Nam. Trả lời tiếng Việt ngắn gọn.`,
      'Phải gọi công cụ để tìm bác sĩ và lịch. Chỉ dùng dữ liệu trả về. Khi người dùng hỏi tất cả bác sĩ, bỏ qua bộ lọc tên và chuyên khoa.',
      'Dùng period cho hôm nay, ngày mai, tuần này hoặc tuần sau. Dùng date cho một ngày cụ thể hoặc dateFrom và dateTo cho một khoảng ngày cụ thể. Hỏi ngày nếu thiếu, trừ yêu cầu tìm lịch sớm nhất thì đặt earliest=true.',
      'Đổi am/pm thành 24 giờ. Dùng startTime cho giờ chính xác. Buổi sáng dùng timeTo=12:00, buổi chiều dùng timeFrom=12:00 và timeTo=18:00, buổi tối dùng timeFrom=18:00. Ví dụ sau 15 giờ dùng timeFrom=15:01, từ 15 giờ dùng timeFrom=15:00.',
      'Nhập phí khám theo đơn vị đồng. Ví dụ dưới 300.000 đ dùng maxFeeExclusive=300000.',
      'Lịch có sẵn sẽ hiển thị thành các nút theo ngày. Tóm tắt kết quả bằng một câu thay vì liệt kê lại từng giờ. Nếu truncated=true, nhắc người dùng bấm Xem thêm. Khi không có lịch, nêu rõ khoảng ngày đã tra.',
      'Công cụ chỉ tra cứu. Bệnh nhân chọn nút để đặt lịch. Không khẳng định đã giữ chỗ hoặc thanh toán. Không chẩn đoán, kê thuốc hay yêu cầu nhập thông tin cá nhân hoặc bệnh án trong chat.'
    ].join('\n');
    const messages = [{ role: 'system', content: instructions }, ...safeHistory, { role: 'user', content: message.trim() }];
    let options = []; let nextPage = null; let reply = '';
    for (let round = 0; round < 4; round += 1) {
      const assistant = await complete(messages, schemas);
      if (!assistant.tool_calls?.length) { reply = assistant.content || ''; break; }
      const calls = assistant.tool_calls.slice(0, 3);
      messages.push({ role: 'assistant', content: assistant.content || null, tool_calls: calls });
      for (const call of calls) {
        let result;
        try { result = await execute(call.function?.name, JSON.parse(call.function?.arguments || '{}')); }
        catch { result = { error: 'Không thể tra lịch lúc này. Hãy thử lại.' }; }
        const { nextPage: continuation, ...toolResult } = result;
        if (Array.isArray(toolResult.options)) {
          options = toolResult.options;
          nextPage = continuation;
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(toolResult) });
      }
    }
    res.json({ success: true, data: { reply: reply || 'Mình chưa thể trả lời lúc này. Bạn thử lại nhé.', options, nextPage } });
  } catch (error) { next(error); }
};

exports.loadAvailabilityPage = async (req, res, next) => {
  try {
    const { filters, after } = req.body || {};
    if (!filters || !after) return res.status(400).json({ success: false, message: 'Thiếu thông tin để tải thêm lịch.' });

    const page = await getAvailabilityPage(filters, after);
    if (page.error) return res.status(400).json({ success: false, message: page.error });
    res.json({ success: true, data: { options: page.options, nextPage: page.nextPage } });
  } catch (error) { next(error); }
};
