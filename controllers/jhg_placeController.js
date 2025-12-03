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

exports.searchAndSortPlaces = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 클라이언트에서 보낸 파라미터 받기
    // keyword: 검색어, sort: 정렬기준(best:주요여행지, latest:최신순)
    const { keyword, sort } = req.query; 

    let sql = "SELECT * FROM TOUR_SPOT WHERE 1=1";
    let params = [];

    // 1. 여행지 검색 기능 (이름 기준)
    if (keyword) {
      sql += " AND NAME LIKE ?";
      params.push(`%${keyword}%`);
    }

    // 2. 주요 여행지 선택 기능 (정렬 로직)
    // sort 값이 'best'이면 평점(AVG_RATING) 높은 순으로 정렬하여 '주요 여행지'를 보여줌
    if (sort === 'best') {
      // (DB에 AVG_RATING 컬럼이 있다고 가정, 없으면 VIEW_COUNT 등으로 대체 가능)
      sql += " ORDER BY AVG_RATING DESC"; 
    } else if (sort === 'latest') {
      sql += " ORDER BY REG_DATE DESC"; // 최신순
    } else {
      sql += " ORDER BY SPOT_ID ASC"; // 기본 정렬
    }

    const rows = await conn.query(sql, params);

    res.status(200).json({
      result_code: 200,
      result_msg: "여행지 검색/조회 성공",
      count: rows.length,
      places: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};