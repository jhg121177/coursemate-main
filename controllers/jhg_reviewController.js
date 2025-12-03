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


// 1. 리뷰 목록 조회
exports.getReviews = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; // 관광지 ID
    conn = await pool.getConnection();

    // 리뷰와 태그를 같이 조회
    const query = `
      SELECT r.REVIEW_ID, r.RATING, r.CONTENT, r.REG_DATE, u.NAME as nickname,
             GROUP_CONCAT(t.TAG_NAME) as tags
      FROM REVIEW r
      LEFT JOIN USER u ON r.USER_ID = u.USER_ID
      LEFT JOIN REVIEW_TAG rt ON r.REVIEW_ID = rt.REVIEW_ID
      LEFT JOIN TAG t ON rt.TAG_ID = t.TAG_ID
      WHERE r.SPOT_ID = ?
      GROUP BY r.REVIEW_ID
      ORDER BY r.REG_DATE DESC
    `;
    
    const rows = await conn.query(query, [id]);

    const reviews = rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    }));

    res.status(200).json({ result_code: 200, result_msg: "리뷰 목록 조회 성공", reviews: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 별점 통계 조회
exports.getRatingSummary = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; 
    conn = await pool.getConnection();

    const query = `
      SELECT 
        COUNT(*) as totalReviews,
        IFNULL(AVG(RATING), 0) as averageRating,
        COUNT(CASE WHEN RATING = 5 THEN 1 END) as star5,
        COUNT(CASE WHEN RATING = 4 THEN 1 END) as star4,
        COUNT(CASE WHEN RATING = 3 THEN 1 END) as star3,
        COUNT(CASE WHEN RATING = 2 THEN 1 END) as star2,
        COUNT(CASE WHEN RATING = 1 THEN 1 END) as star1
      FROM REVIEW
      WHERE SPOT_ID = ?
    `;

    const rows = await conn.query(query, [id]);
    const stats = rows[0];
    const formattedAvg = Number(stats.averageRating).toFixed(1);

    res.status(200).json({
      result_code: 200,
      result_msg: "별점 통계 조회 성공",
      stats: {
        totalReviews: stats.totalReviews,
        averageRating: formattedAvg,
        distribution: {
          5: stats.star5,
          4: stats.star4,
          3: stats.star3,
          2: stats.star2,
          1: stats.star1
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 3. 사진 목록 조회
exports.getSpotPhotos = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; 
    conn = await pool.getConnection();

    const query = "SELECT PHOTO_ID, IMG_URL, REG_DATE FROM PHOTO WHERE SPOT_ID = ? ORDER BY REG_DATE DESC";
    const rows = await conn.query(query, [id]);

    res.status(200).json({
      result_code: 200,
      result_msg: "관광지 사진 조회 성공",
      count: rows.length,
      photos: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 4. 블로그 리뷰 링크 조회
exports.getSpotBlogs = async (req, res) => {
  let conn;
  try {
    const { id } = req.params; 
    conn = await pool.getConnection();

    const query = `
      SELECT BLOG_ID, TITLE, URL, BLOG_NAME, POST_DATE 
      FROM BLOG_REVIEW 
      WHERE SPOT_ID = ? 
      ORDER BY POST_DATE DESC
    `;
    
    const rows = await conn.query(query, [id]);

    res.status(200).json({
      result_code: 200,
      result_msg: "블로그 리뷰 링크 조회 성공",
      count: rows.length,
      blogs: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};