const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env 파일의 환경 변수 불러오기
dotenv.config();

const app = express();
const PORT = 3000;

// MongoDB 연결 설정
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB에 성공적으로 연결되었습니다.");
    })
    .catch((error) => {
        console.error("MongoDB 연결 실패:", error);
    });


// 기본 라우트 설정
app.get('/', (req, res) => {
    res.send('MongoDB 연결 성공!');
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
