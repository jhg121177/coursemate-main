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

// 1. 공지사항 목록 조회 (GET /api/community/notices) [cite: 354]
exports.getNotices = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 목록 조회 시에는 내용(CONTENT)까지 다 가져올 필요 없거나, 설계서상 다 가져오도록 되어있음
    const rows = await conn.query("SELECT NOTICE_ID, TITLE, REG_DATE FROM NOTICE ORDER BY REG_DATE DESC");

    res.status(200).json({
      result_code: 200,
      result_msg: "공지사항 목록 조회 성공",
      notices: rows.map(row => ({
        noticeId: row.NOTICE_ID,
        title: row.TITLE,
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

// 2. 공지사항 상세 조회 (GET /api/community/notices/:id) [cite: 355]
exports.getNoticeDetail = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const rows = await conn.query("SELECT * FROM NOTICE WHERE NOTICE_ID = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ result_code: 404, result_msg: "해당 공지사항이 없습니다." });
    }

    res.status(200).json({
      result_code: 200,
      result_msg: "공지사항 상세 조회 성공",
      notice: {
        noticeId: rows[0].NOTICE_ID,
        title: rows[0].TITLE,
        content: rows[0].CONTENT,
        regDate: rows[0].REG_DATE
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 문의/피드백 등록 (POST /api/community/feedback) [cite: 357]
exports.createFeedback = async (req, res) => {
  let conn;
  try {
    const { userId, title, content } = req.body;
    const inquiryId = 'INQ' + Date.now();

    conn = await pool.getConnection();

    await conn.query(
      "INSERT INTO INQUIRY (INQUIRY_ID, USER_ID, TITLE, CONTENT, STATUS) VALUES (?, ?, ?, ?, ?)",
      [inquiryId, userId, title, content, '대기']
    );

    res.status(200).json({
      result_code: 200,
      result_msg: "문의 등록 성공. 빠른 시일 내에 답변 드리겠습니다.",
      inquiryId: inquiryId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 내 문의 내역 조회 (GET /api/community/feedback/me) [cite: 359]
exports.getMyFeedbacks = async (req, res) => {
  let conn;
  try {
    const userId = req.query.userId || req.body.userId;
    conn = await pool.getConnection();

    const rows = await conn.query(
      "SELECT INQUIRY_ID, TITLE, STATUS, REG_DATE, ANSWER_DATE FROM INQUIRY WHERE USER_ID = ? ORDER BY REG_DATE DESC",
      [userId]
    );

    res.status(200).json({
      result_code: 200,
      result_msg: "내 문의 내역 조회 성공",
      feedbacks: rows.map(row => ({
        inquiryId: row.INQUIRY_ID,
        title: row.TITLE,
        status: row.STATUS,
        regDate: row.REG_DATE,
        answerDate: row.ANSWER_DATE
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};