const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;
const KAKAO_API_KEY = '1e8e1cf6caf17cc74db5ce1bf5f6c319'; // 본인의 카카오 REST API 키 입력

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: 도서 검색
app.get('/api/search', async (req, res) => {
  const { query, page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
      params: { query, page, size: 10 },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// API: 감상평 저장
app.post('/api/reviews', (req, res) => {
  const { bookId, review } = req.body;

  if (!bookId || !review) {
    return res.status(400).json({ error: 'Book ID and review are required' });
  }

  const reviewsPath = path.join(__dirname, 'data/reviews.json');
  const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
  reviews[bookId] = review;

  fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
  res.json({ message: 'Review saved successfully' });
});

// API: 감상평 불러오기
app.get('/api/reviews/:bookId', (req, res) => {
  const bookId = req.params.bookId;

  const reviewsPath = path.join(__dirname, 'data/reviews.json');
  const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
  res.json({ review: reviews[bookId] || '' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
