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

const Comment = mongoose.model('Comment', new mongoose.Schema({
  bookId: { type: String, required: true },
  comment: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}));

// 회원가입
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ message: '회원가입 성공!' });
  } catch (err) {
    res.status(400).json({ error: '아이디가 이미 존재합니다.' });
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

// 책 검색
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    jwt.verify(token, JWT_SECRET);

    const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` },
      params: { query },
    });

    const books = response.data.documents.map((doc) => ({
      id: doc.isbn,
      title: doc.title,
      authors: doc.authors,
      thumbnail: doc.thumbnail || '/default-thumbnail.jpg',
      publisher: doc.publisher,
      datetime: doc.datetime,
      contents: doc.contents,
    }));

    res.json({ books });
  } catch (err) {
    res.status(500).json({ error: '책 검색에 실패했습니다.' });
  }
});

// 댓글 저장
app.post('/api/comments', async (req, res) => {
  const { bookId, comment } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newComment = new Comment({ bookId, comment, username: decoded.username });
    await newComment.save();
    res.json({ message: '댓글이 저장되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '댓글 저장에 실패했습니다.' });
  }
});

// 댓글 조회
app.get('/api/comments/:bookId', async (req, res) => {
  const { bookId } = req.params;

  try {
    const comments = await Comment.find({ bookId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: '댓글 조회에 실패했습니다.' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
