require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Failed to connect to MongoDB Atlas:', err));

// Middleware
app.use(bodyParser.json());

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
