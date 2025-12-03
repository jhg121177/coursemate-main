const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

// 🤖 가짜(Mock) AI 분석 함수
// 실제로는 여기서 axios.post('http://ai-server/analyze')를 호출.
async function mockAIAnalysis(content) {
  console.log(`[Mock AI] 리뷰 분석 시작: "${content}"`);
  
  // 1초 뒤에 분석이 끝난 것처럼 흉내 냅니다 (비동기 시뮬레이션)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 간단한 규칙: '좋', '최고', '추천'이 들어있으면 긍정(P), 아니면 부정(N)
  const isPositive = /좋|최고|추천|만족/.test(content);
  const sentiment = isPositive ? 'P' : 'N';
  
  console.log(`[Mock AI] 분석 완료! 감성: ${sentiment} (긍정: P, 부정: N)`);
  return { sentiment };
}

// 1. 특정 관광지의 리뷰 조회 (GET /api/places/:id/reviews)
exports.getReviewsByPlace = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // spotId
    conn = await pool.getConnection();

    // 작성자 닉네임(NAME)까지 같이 가져오기 위해 JOIN 사용
    const query = `
      SELECT r.REVIEW_ID, r.RATING, r.CONTENT, r.SENTIMENT, r.REG_DATE, u.NAME as nickname
      FROM REVIEW r
      JOIN USER u ON r.USER_ID = u.USER_ID
      WHERE r.SPOT_ID = ?
      ORDER BY r.REG_DATE DESC
    `;
    const rows = await conn.query(query, [id]);

    res.status(200).json({
      result_code: 200,
      result_msg: "리뷰 목록 조회 성공",
      reviews: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 리뷰 작성 (POST /api/places/:id/reviews) - ★ 핵심 기능
exports.createReview = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // spotId
    const { userId, rating, content } = req.body; // 실제로는 토큰에서 userId를 꺼내야 함 (지금은 테스트용으로 body에서 받음)

    const reviewId = 'REV' + Date.now(); // ID 생성

    conn = await pool.getConnection();
    
    // (1) 리뷰 우선 저장 (감성은 아직 NULL)
    await conn.query(
      "INSERT INTO REVIEW (REVIEW_ID, USER_ID, SPOT_ID, RATING, CONTENT) VALUES (?, ?, ?, ?, ?)",
      [reviewId, userId, id, rating, content]
    );

    // (2) AI 분석 요청 (Mocking)
    const aiResult = await mockAIAnalysis(content);

    // (3) AI 분석 결과(감성) 업데이트
    await conn.query(
      "UPDATE REVIEW SET SENTIMENT = ? WHERE REVIEW_ID = ?",
      [aiResult.sentiment, reviewId]
    );

    // (4) 관광지 평균 별점 업데이트 (선택 사항이지만 구현하면 좋음)
    // 간단하게 구현 생략 가능, 필요하면 추후 추가

    res.status(200).json({
      result_code: 200,
      result_msg: "리뷰 등록 및 AI 분석 완료",
      reviewId: reviewId,
      sentiment: aiResult.sentiment // 결과 확인용
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 리뷰 삭제 (DELETE /api/reviews/:reviewId)
exports.deleteReview = async (req, res) => {
  let conn;
  try {
    const { reviewId } = req.params;
    conn = await pool.getConnection();

    const result = await conn.query("DELETE FROM REVIEW WHERE REVIEW_ID = ?", [reviewId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ result_code: 404, result_msg: "리뷰가 존재하지 않습니다." });
    }

    res.status(200).json({ result_code: 200, result_msg: "리뷰 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 리뷰 수정 (PUT /api/reviews/:reviewId)
exports.updateReview = async (req, res) => {
  let conn;
  try {
    const { reviewId } = req.params;
    const { rating, content } = req.body;

    conn = await pool.getConnection();

    // (1) 리뷰 내용 업데이트
    const result = await conn.query(
      "UPDATE REVIEW SET RATING = ?, CONTENT = ? WHERE REVIEW_ID = ?",
      [rating, content, reviewId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result_code: 404, result_msg: "리뷰가 존재하지 않습니다." });
    }

    // (2) 내용이 바뀌었으니 AI 재분석 요청 (Mocking)
    const aiResult = await mockAIAnalysis(content);

    // (3) 바뀐 감성으로 재업데이트
    await conn.query(
      "UPDATE REVIEW SET SENTIMENT = ? WHERE REVIEW_ID = ?",
      [aiResult.sentiment, reviewId]
    );

    res.status(200).json({
      result_code: 200,
      result_msg: "리뷰 수정 및 AI 재분석 성공",
      sentiment: aiResult.sentiment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 5. 관광지 사진 목록 조회 (GET /api/places/:id/photos)
exports.getPlacePhotos = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // spotId
    conn = await pool.getConnection();

    const query = "SELECT PHOTO_ID, IMG_URL, REG_DATE FROM PHOTO WHERE SPOT_ID = ? ORDER BY REG_DATE DESC";
    const rows = await conn.query(query, [id]);

    res.status(200).json({
      result_code: 200,
      result_msg: "사진 목록 조회 성공",
      photos: rows.map(row => ({
        photoId: row.PHOTO_ID,
        url: row.IMG_URL,
        regDate: row.REG_DATE
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};