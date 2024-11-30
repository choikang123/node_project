require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Failed to connect to MongoDB Atlas:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB 모델 정의
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

const Review = mongoose.model('Review', new mongoose.Schema({
  bookId: { type: String, required: true },
  review: { type: String, required: true },
  username: { type: String, required: true },
}));

// 회원가입
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다.' });
  }

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ message: '회원가입 성공!' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: '아이디가 이미 존재합니다.' });
    } else {
      res.status(500).json({ error: '회원가입에 실패했습니다.' });
    }
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: '로그인에 실패했습니다.' });
  }
});

// 리뷰 저장
app.post('/api/reviews', async (req, res) => {
  const { bookId, review } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newReview = new Review({ bookId, review, username: decoded.username });
    await newReview.save();
    res.json({ message: '리뷰가 저장되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '리뷰 저장에 실패했습니다.' });
  }
});

// 리뷰 조회
app.get('/api/reviews/:bookId', async (req, res) => {
  const { bookId } = req.params;

  try {
    const reviews = await Review.find({ bookId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: '리뷰 조회에 실패했습니다.' });
  }
});

// 책 검색 API
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    // 카카오 책 검색 API 호출
    const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` },
      params: { query },
    });

    const books = response.data.documents.map((doc) => ({
      id: doc.isbn, // ISBN을 고유 ID로 사용
      title: doc.title,
      authors: doc.authors,
      thumbnail: doc.thumbnail || '/default-thumbnail.jpg',
      publisher: doc.publisher,
      datetime: doc.datetime,
      contents: doc.contents,
    }));

    res.json({ books });
  } catch (err) {
    console.error('책 검색 오류:', err);
    res.status(500).json({ error: '책 검색에 실패했습니다.' });
  }
});

// 책 상세보기 API
app.get('/api/book/:bookId', async (req, res) => {
  const { bookId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    // 카카오 책 검색 API 호출
    const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` },
      params: { query: bookId }, // ISBN으로 검색
    });

    const book = response.data.documents[0]; // 첫 번째 결과 사용
    if (!book) {
      return res.status(404).json({ error: '책 정보를 찾을 수 없습니다.' });
    }

    res.json({
      title: book.title,
      authors: book.authors,
      publisher: book.publisher,
      thumbnail: book.thumbnail || '/default-thumbnail.jpg',
      datetime: book.datetime,
      contents: book.contents,
    });
  } catch (err) {
    console.error('책 상세보기 오류:', err);
    res.status(500).json({ error: '책 상세 정보를 가져오는 데 실패했습니다.' });
  }
});


// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});