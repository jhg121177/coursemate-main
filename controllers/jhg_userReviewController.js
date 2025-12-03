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



// 사용자 후기 작성 (태그 포함)
exports.createUserReview = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // 관광지 ID
    const { userId, rating, content, tags } = req.body; 
    const reviewId = 'REV' + Date.now(); // ID 생성

    conn = await pool.getConnection();
    await conn.beginTransaction(); // 트랜잭션 시작

    // 리뷰 테이블에 저장
    await conn.query(
      "INSERT INTO REVIEW (REVIEW_ID, USER_ID, SPOT_ID, RATING, CONTENT, REG_DATE) VALUES (?, ?, ?, ?, ?, NOW())",
      [reviewId, userId, id, rating, content]
    );

    // 태그 처리 (태그가 존재하면 저장 및 연결)
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // 태그가 있으면 ID 가져오고, 없으면 새로 만듦
        let rows = await conn.query("SELECT TAG_ID FROM TAG WHERE TAG_NAME = ?", [tagName]);
        let tagId;
        
        if (rows.length > 0) {
          tagId = rows[0].TAG_ID;
        } else {
          const result = await conn.query("INSERT INTO TAG (TAG_NAME) VALUES (?)", [tagName]);
          tagId = result.insertId;
        }

        // 리뷰-태그 연결 테이블에 저장
        await conn.query("INSERT INTO REVIEW_TAG (REVIEW_ID, TAG_ID) VALUES (?, ?)", [reviewId, tagId]);
      }
    }

    await conn.commit();
    res.status(200).json({ result_code: 200, result_msg: "후기 작성 성공", reviewId });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 사용자 후기 수정
exports.updateUserReview = async (req, res) => {
  let conn;
  try {
    const { reviewId } = req.params;
    const { rating, content, tags } = req.body;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 내용 및 별점 수정
    await conn.query(
      "UPDATE REVIEW SET RATING = ?, CONTENT = ? WHERE REVIEW_ID = ?",
      [rating, content, reviewId]
    );

    // 태그 수정: 기존 태그 연결 싹 지우고 새로 연결
    await conn.query("DELETE FROM REVIEW_TAG WHERE REVIEW_ID = ?", [reviewId]);

    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let rows = await conn.query("SELECT TAG_ID FROM TAG WHERE TAG_NAME = ?", [tagName]);
        let tagId;
        if (rows.length > 0) {
          tagId = rows[0].TAG_ID;
        } else {
          const result = await conn.query("INSERT INTO TAG (TAG_NAME) VALUES (?)", [tagName]);
          tagId = result.insertId;
        }
        await conn.query("INSERT INTO REVIEW_TAG (REVIEW_ID, TAG_ID) VALUES (?, ?)", [reviewId, tagId]);
      }
    }

    await conn.commit();
    res.status(200).json({ result_code: 200, result_msg: "후기 수정 성공" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 사용자 후기 삭제
exports.deleteUserReview = async (req, res) => {
  let conn;
  try {
    const { reviewId } = req.params;
    conn = await pool.getConnection();
    
    // 리뷰 삭제 (태그 연결도 DB 설정에 따라 자동 삭제되거나 여기서 처리됨)
    await conn.query("DELETE FROM REVIEW WHERE REVIEW_ID = ?", [reviewId]);

    res.status(200).json({ result_code: 200, result_msg: "후기 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};