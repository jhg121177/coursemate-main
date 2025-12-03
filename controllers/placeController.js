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

// 1. 관광지 목록 조회 및 검색 (지역 필터 추가됨)
exports.getPlaces = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 쿼리 파라미터 받기 (카테고리, 검색어, ✨지역)
    const { category, keyword, region } = req.query;

    let sql = "SELECT * FROM TOUR_SPOT WHERE 1=1";
    let params = [];

    // 1) 지역 필터 (예: region=서울 -> 주소에 '서울'이 포함된 곳)
    if (region) {
      sql += " AND ADDRESS LIKE ?";
      params.push(`%${region}%`);
    }

    // 2) 카테고리 필터
    if (category) {
      sql += " AND CATEGORY = ?";
      params.push(category);
    }

    // 3) 검색어(키워드) 필터 (이름 검색)
    if (keyword) {
      sql += " AND NAME LIKE ?";
      params.push(`%${keyword}%`);
    }

    // 정렬 (별점순 등 필요 시 추가 가능, 일단은 등록순/ID순)
    // sql += " ORDER BY AVG_RATING DESC"; 

    const rows = await conn.query(sql, params);

    res.status(200).json({
      result_code: 200,
      result_msg: "관광지 목록 조회 성공",
      totalCount: rows.length,
      places: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};

// 2. 관광지 상세 정보 조회
exports.getPlaceDetail = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { id } = req.params; // URL 파라미터에서 ID 추출

    // 관광지 기본 정보 조회
    const rows = await conn.query("SELECT * FROM TOUR_SPOT WHERE SPOT_ID = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ result_code: 404, result_msg: "존재하지 않는 관광지입니다." });
    }

    const place = rows[0];

    // TODO: 나중에 AI 특성 태그(SPOT_FEATURE)도 여기서 같이 조회해서 붙여줘야 함

    res.status(200).json({
      result_code: 200,
      result_msg: "관광지 상세 정보 조회 성공",
      place: place
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ result_code: 500, result_msg: "서버 오류" });
  } finally {
    if (conn) conn.end();
  }
};