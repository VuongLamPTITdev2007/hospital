const { randomBytes, randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');

const signingKey = randomBytes(32);
const SEARCH_TTL_SECONDS = 15 * 60;

const beginSearch = () => ({
  searchId: randomUUID(),
  exp: Math.floor(Date.now() / 1000) + SEARCH_TTL_SECONDS
});

const signSearchResult = (type, search, data) => jwt.sign(
  { ...search, data }, signingKey,
  { algorithm: 'HS256', audience: type, noTimestamp: true }
);

const readSearchResult = (type, token) => {
  try {
    return { result: jwt.verify(token, signingKey, { algorithms: ['HS256'], audience: type }) };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { status: 410, message: 'Kết quả tra lịch đã hết hạn. Bạn hãy tìm lịch lại.' };
    }
    return { status: 400, message: 'Mã kết quả tra lịch không hợp lệ. Bạn hãy tìm lịch lại.' };
  }
};

module.exports = { beginSearch, signSearchResult, readSearchResult };
