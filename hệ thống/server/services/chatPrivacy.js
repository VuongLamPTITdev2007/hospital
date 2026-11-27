const { fold } = require('./availabilityService');

const privateIdentifiers = /\b(?:bearer\s+[\w.-]{8,}|eyJ[\w-]+\.[\w-]+\.[\w-]+|sk-(?:or-v1-|proj-)?[\w-]{12,}|mongodb(?:\+srv)?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\d{12})\b/i;
const phoneNumber = /(?:^|[^\w+])(?:\+84[ .-]?|0)[35789](?:[ .-]?\d){8}(?!\d)/;
const privateFields = /\b(?:benh an|chan doan|tien su benh|trieu chung|ket qua xet nghiem|mat khau|api[_ ]?key|jwt[_ ]?secret|mongo[_ ]?uri)\s*[:=]\s*\S/;

const containsPrivateChatData = (content) => {
  const secrets = [process.env.OPENROUTER_API_KEY, process.env.JWT_SECRET, process.env.MONGO_URI];
  return privateIdentifiers.test(content) || phoneNumber.test(content) || privateFields.test(fold(content)) ||
    secrets.some((secret) => secret && secret.length >= 8 && content.includes(secret));
};

const privacyReply = 'Bạn hãy gửi riêng câu hỏi tra lịch. Hãy nhập triệu chứng hoặc thông tin cá nhân ở bước đặt lịch.';

module.exports = { containsPrivateChatData, privacyReply };
