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


// 전체 태그 목록 조회
exports.getAllTags = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM TAG ORDER BY TAG_ID ASC");
    res.status(200).json({ result_code: 200, tags: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 태그 추가 (관리자가 미리 태그 생성)
exports.createTag = async (req, res) => {
  let conn;
  try {
    const { tagName } = req.body;
    conn = await pool.getConnection();
    
    // 중복 확인
    const check = await conn.query("SELECT * FROM TAG WHERE TAG_NAME = ?", [tagName]);
    if (check.length > 0) return res.status(400).json({ result_code: 400, result_msg: "이미 존재하는 태그" });

    await conn.query("INSERT INTO TAG (TAG_NAME) VALUES (?)", [tagName]);
    res.status(200).json({ result_code: 200, result_msg: "태그 생성 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 태그 수정 (오타 수정 등)
exports.updateTag = async (req, res) => {
  let conn;
  try {
    const { tagId } = req.params;
    const { tagName } = req.body;
    conn = await pool.getConnection();
    await conn.query("UPDATE TAG SET TAG_NAME = ? WHERE TAG_ID = ?", [tagName, tagId]);
    res.status(200).json({ result_code: 200, result_msg: "태그 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 태그 삭제 (해당 태그는 모든 리뷰에서 사라짐)
exports.deleteTag = async (req, res) => {
  let conn;
  try {
    const { tagId } = req.params;
    conn = await pool.getConnection();
    await conn.query("DELETE FROM TAG WHERE TAG_ID = ?", [tagId]);
    res.status(200).json({ result_code: 200, result_msg: "태그 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};

// 관리자 권한 리뷰 수정 (부적절한 내용 가리기 등)
exports.adminUpdateReview = async (req, res) => {
  let conn;
  try {
    const { reviewId } = req.params;
    const { content, isHidden } = req.body; // isHidden: 숨김 처리 여부 등
    conn = await pool.getConnection();
    
    // 내용만 수정하거나 상태 변경
    await conn.query("UPDATE REVIEW SET CONTENT = ? WHERE REVIEW_ID = ?", [content, reviewId]);
    
    res.status(200).json({ result_code: 200, result_msg: "관리자 권한 리뷰 수정 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500 });
  } finally {
    if (conn) conn.end();
  }
};