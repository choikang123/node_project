const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // 사용자 인증을 위한 JWT 사용

const app = express();
const PORT = 3000;
const KAKAO_API_KEY = '1e8e1cf6caf17cc74db5ce1bf5f6c319';
const JWT_SECRET = 'your_jwt_secret'; // JWT 토큰용 시크릿 키

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 유틸리티: 리뷰 데이터 로드 및 저장
const loadReviews = () => {
    const reviewsPath = path.join(__dirname, 'data/reviews.json');
    if (!fs.existsSync(reviewsPath)) fs.writeFileSync(reviewsPath, '{}');
    return JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
};

const saveReviews = (reviews) => {
    const reviewsPath = path.join(__dirname, 'data/reviews.json');
    fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
};

// 사용자 데이터 로드
const loadUsers = () => {
    const usersPath = path.join(__dirname, 'data/users.json');
    if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, '{}');
    return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
};

const saveUsers = (users) => {
    const usersPath = path.join(__dirname, 'data/users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
};

// 사용자 인증 미들웨어
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// 사용자 회원가입
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });

    const users = loadUsers();
    if (users[username]) return res.status(400).json({ error: 'Username already exists' });

    users[username] = { password };
    saveUsers(users);
    res.json({ message: 'User registered successfully' });
});

// 사용자 로그인
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    if (users[username]?.password === password) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 도서 검색 (필터링 포함)
app.get('/api/search', async (req, res) => {
    const { query, page = 1, author, publisher } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
            params: { query, page, size: 10 },
        });

        let books = response.data.documents;

        // 필터링 로직
        if (author) books = books.filter((book) => book.authors.includes(author));
        if (publisher) books = books.filter((book) => book.publisher === publisher);

        res.json({ books, meta: response.data.meta });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// 즐겨찾기 추가/삭제
app.post('/api/favorites', authenticate, (req, res) => {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: 'Book ID is required' });

    const userFavoritesPath = path.join(__dirname, `data/favorites_${req.user.username}.json`);
    const favorites = fs.existsSync(userFavoritesPath)
        ? JSON.parse(fs.readFileSync(userFavoritesPath, 'utf-8'))
        : {};

    if (favorites[bookId]) {
        delete favorites[bookId];
        message = 'Book removed from favorites';
    } else {
        favorites[bookId] = true;
        message = 'Book added to favorites';
    }

    fs.writeFileSync(userFavoritesPath, JSON.stringify(favorites, null, 2));
    res.json({ message });
});

// 감상평 CRUD
app.put('/api/reviews/:bookId', authenticate, (req, res) => {
    const { bookId } = req.params;
    const { review } = req.body;

    if (!review) return res.status(400).json({ error: 'Review is required' });

    const reviews = loadReviews();
    reviews[bookId] = review;

    saveReviews(reviews);
    res.json({ message: 'Review updated successfully' });
});

app.delete('/api/reviews/:bookId', authenticate, (req, res) => {
    const { bookId } = req.params;
    const reviews = loadReviews();

    if (!reviews[bookId]) return res.status(404).json({ error: 'Review not found' });

    delete reviews[bookId];
    saveReviews(reviews);
    res.json({ message: 'Review deleted successfully' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
