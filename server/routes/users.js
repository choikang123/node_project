// 필요한 모듈 불러오기
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

// Express 초기화
const app = express();
app.use(express.json());

// MongoDB 연결
const mongoURI = 'mongodb://localhost:27017/bookReviewDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// MongoDB 스키마 및 리뷰 모델 정의
const reviewSchema = new mongoose.Schema({
    bookId: String,
    title: String,
    author: String,
    review: String,
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

// 카카오 책 검색 API 키
const KAKAO_API_KEY = 'your_kakao_api_key';
const KAKAO_BOOKS_API_URL = 'https://dapi.kakao.com/v3/search/book';

// 카카오 책 검색 API를 사용하여 책 검색
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    try {
        const response = await axios.get(`${KAKAO_BOOKS_API_URL}`, {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
            params: { query }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: '카카오 책 검색 API에서 데이터를 가져오는데 실패했습니다.' });
    }
});