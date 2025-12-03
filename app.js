const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const placeRoutes = require('./routes/placeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jhgRoutes = require('./routes/jhg_routes');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors()); // 프론트엔드와 통신 허용
app.use(express.json()); // JSON 요청 본문 해석

// 1. MariaDB 연결 풀(Pool) 생성
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

// 2. DB 연결 테스트 함수
async function testDbConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ MariaDB 연결 성공! (Database: " + process.env.DB_NAME + ")");
  } catch (err) {
    console.error("❌ MariaDB 연결 실패:", err);
    console.log("힌트: .env 파일의 비밀번호가 맞는지 확인해보세요!");
  } finally {
    if (conn) conn.end();
  }
}

// 서버 실행 시 DB 연결 테스트 시도
testDbConnection();

// 기본 접속 테스트용 API
app.get('/', (req, res) => {
  res.send('CourseMate 백엔드 서버가 정상 작동 중입니다.');
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});


// 라우트 설정
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('CourseMate 백엔드 서버가 정상 작동 중입니다.');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

app.use('/api/places', placeRoutes);

//리뷰 라우터
app.use('/api', reviewRoutes);
// 이렇게 하면 '/api/places/:id/reviews' 와 '/api/reviews/:reviewId' 모두 reviewRoutes 안에서 처리

//사용자 라우터
app.use('/api/users', userRoutes);

//추천 라우터
app.use('/api/recommendations', recommendationRoutes);

//커뮤니티 라우터
app.use('/api/community', communityRoutes);

//관리자 라우터
app.use('/api/admin', adminRoutes);

app.use('/api/jhg', jhgRoutes)