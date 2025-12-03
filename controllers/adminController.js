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

// 1. 관리자 로그인 (POST /api/admin/login) 
exports.adminLogin = async (req, res) => {
  const { adminId, password } = req.body;
  
  // 테스트용: 아이디 'admin', 비밀번호 'admin1234'면 무조건 성공 처리
  if (adminId === 'admin' && password === 'admin1234') {
    return res.status(200).json({
      result_code: 200,
      result_msg: "관리자 로그인 성공",
      token: "admin_dummy_token_12345" // 실제론 JWT 발급 필요
    });
  }
  res.status(200).json({ result_code: 101, result_msg: "관리자 로그인 실패" });
};

// 2. 대시보드 통계 조회 (GET /api/admin/dashboard) [cite: 240]
exports.getDashboardStats = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const userCount = await conn.query("SELECT COUNT(*) as cnt FROM USER");
    const reviewCount = await conn.query("SELECT COUNT(*) as cnt FROM REVIEW");
    const spotCount = await conn.query("SELECT COUNT(*) as cnt FROM TOUR_SPOT");

    res.status(200).json({
      result_code: 200,
      result_msg: "통계 조회 성공",
      stats: {
        totalUsers: Number(userCount[0].cnt),
        totalReviews: Number(reviewCount[0].cnt),
        totalSpots: Number(spotCount[0].cnt)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 회원 목록 조회 (GET /api/admin/users) [cite: 301]
exports.getAllUsers = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT USER_ID, NAME, EMAIL, IS_ACTIVE, JOIN_DATE FROM USER ORDER BY JOIN_DATE DESC");
    res.status(200).json({ result_code: 200, users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 회원 상태 변경(정지/해제) (PUT /api/admin/users/:userId/status) [cite: 301]
exports.changeUserStatus = async (req, res) => {
  let conn;
  try {
    const { userId } = req.params;
    const { isActive } = req.body; // 'Y' or 'N'
    conn = await pool.getConnection();
    await conn.query("UPDATE USER SET IS_ACTIVE = ? WHERE USER_ID = ?", [isActive, userId]);
    res.status(200).json({ result_code: 200, result_msg: "회원 상태 변경 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 5. 관광지 등록 (POST /api/admin/places) [cite: 305]
exports.createPlace = async (req, res) => {
  let conn;
  try {
    // spotId는 자동생성하거나 입력받음. 여기선 입력받는다고 가정
    const { spotId, name, address, category, latitude, longitude } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO TOUR_SPOT (SPOT_ID, NAME, ADDRESS, CATEGORY, LATITUDE, LONGITUDE) VALUES (?, ?, ?, ?, ?, ?)",
      [spotId, name, address, category, latitude, longitude]
    );
    res.status(200).json({ result_code: 200, result_msg: "관광지 등록 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 6. 관광지 삭제 (DELETE /api/admin/places/:id) [cite: 305]
exports.deletePlace = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.query("DELETE FROM TOUR_SPOT WHERE SPOT_ID = ?", [id]);
    res.status(200).json({ result_code: 200, result_msg: "관광지 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 7. 전체 리뷰 조회 (GET /api/admin/reviews) [cite: 308]
exports.getAllReviews = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 어떤 유저가 어디에 썼는지 알기 위해 JOIN
    const query = `
      SELECT r.REVIEW_ID, u.NAME as writer, ts.NAME as spotName, r.CONTENT, r.RATING, r.REG_DATE 
      FROM REVIEW r
      JOIN USER u ON r.USER_ID = u.USER_ID
      JOIN TOUR_SPOT ts ON r.SPOT_ID = ts.SPOT_ID
      ORDER BY r.REG_DATE DESC
    `;
    const rows = await conn.query(query);
    res.status(200).json({ result_code: 200, reviews: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 8. 리뷰 삭제 (DELETE /api/admin/reviews/:reviewId) [cite: 308]
exports.deleteReviewAdmin = async (req, res) => {
  // 로직은 일반 리뷰 삭제와 같지만, 관리자 권한으로 수행한다는 점이 다름
  let conn;
  try {
    const { reviewId } = req.params;
    conn = await pool.getConnection();
    await conn.query("DELETE FROM REVIEW WHERE REVIEW_ID = ?", [reviewId]);
    res.status(200).json({ result_code: 200, result_msg: "관리자 권한으로 리뷰 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 9. 문의 답변 등록 (POST /api/admin/inquiries/:id/answer) [cite: 318]
exports.answerInquiry = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { answerContent } = req.body;
    conn = await pool.getConnection();
    
    // 답변 내용 업데이트 및 상태를 '완료'로 변경
    await conn.query(
      "UPDATE INQUIRY SET ANSWER_CONTENT = ?, ANSWER_DATE = NOW(), STATUS = '완료' WHERE INQUIRY_ID = ?",
      [answerContent, id]
    );
    res.status(200).json({ result_code: 200, result_msg: "답변 등록 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 10. AI 모델 재학습 요청 (POST /api/admin/ai/train) [cite: 313]
exports.triggerAITrain = async (req, res) => {
  // 실제 AI 서버에 요청을 보내야 하는 부분 (Mocking)
  console.log("[Admin] AI 모델 재학습 요청을 AI 서버로 전송했습니다.");
  
  res.status(200).json({
    result_code: 202,
    result_msg: "AI 모델 재학습 작업이 시작되었습니다.",
    jobId: "JOB_" + Date.now()
  });
};